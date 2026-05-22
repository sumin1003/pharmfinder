const axios = require('axios');
const supabase = require('../config/supabase');

const HIRA_URL = 'https://apis.data.go.kr/B551182/pharmacyInfoService/getParmacyBasisList';

const getDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// 공공데이터 약국 목록을 현재 위치 기준으로 조회하고 가입 약국 재고 여부를 합산
const getNearbyPublicPharmacies = async ({ lat, lng, radius = 3, medicineId }) => {
  const { data: allPublic, error } = await supabase
    .from('public_pharmacies')
    .select('id, hpid, name, address, phone, latitude, longitude, linked_pharmacy_id')
    .not('latitude', 'is', null);

  if (error) throw error;
  if (!allPublic || allPublic.length === 0) return [];

  const registeredIds = allPublic
    .filter((p) => p.linked_pharmacy_id)
    .map((p) => p.linked_pharmacy_id);

  let anyInventorySet = new Set();
  let stockInventorySet = new Set();

  if (registeredIds.length > 0) {
    if (medicineId) {
      const [anyRes, stockRes] = await Promise.all([
        supabase.from('pharmacy_inventory').select('pharmacy_id').in('pharmacy_id', registeredIds).gt('quantity', 0),
        supabase.from('pharmacy_inventory').select('pharmacy_id').in('pharmacy_id', registeredIds).eq('medicine_id', medicineId).gt('quantity', 0),
      ]);
      anyInventorySet = new Set((anyRes.data || []).map((i) => i.pharmacy_id));
      stockInventorySet = new Set((stockRes.data || []).map((i) => i.pharmacy_id));
    } else {
      const { data: anyData } = await supabase
        .from('pharmacy_inventory')
        .select('pharmacy_id')
        .in('pharmacy_id', registeredIds)
        .gt('quantity', 0);
      anyInventorySet = new Set((anyData || []).map((i) => i.pharmacy_id));
    }
  }

  return allPublic
    .map((p) => ({
      id: p.id,
      hpid: p.hpid,
      name: p.name,
      address: p.address,
      phone: p.phone,
      latitude: p.latitude,
      longitude: p.longitude,
      linked_pharmacy_id: p.linked_pharmacy_id,
      distance: getDistance(lat, lng, p.latitude, p.longitude),
      is_registered: !!p.linked_pharmacy_id,
      has_inventory: p.linked_pharmacy_id ? anyInventorySet.has(p.linked_pharmacy_id) : false,
    }))
    .filter((p) => {
      if (p.distance > radius) return false;
      // 특정 의약품 필터 시 재고 있는 가입 약국만 포함
      if (medicineId) return p.linked_pharmacy_id && stockInventorySet.has(p.linked_pharmacy_id);
      return true;
    })
    .sort((a, b) => a.distance - b.distance);
};

// 공공데이터 약국 단건 조회 + 연결된 가입 약국 재고 포함
const getPublicPharmacyById = async (id) => {
  const { data: pub, error } = await supabase
    .from('public_pharmacies')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !pub) throw Object.assign(new Error('약국 정보를 찾을 수 없습니다.'), { status: 404 });

  let inventory = [];
  if (pub.linked_pharmacy_id) {
    const { data: inv } = await supabase
      .from('pharmacy_inventory')
      .select('*, medicines(id, name, category)')
      .eq('pharmacy_id', pub.linked_pharmacy_id)
      .order('updated_at', { ascending: false });
    inventory = inv || [];
  }

  return { ...pub, is_registered: !!pub.linked_pharmacy_id, inventory };
};

// 약국 이름으로 공공데이터 약국 검색 (가입 시 연결 선택용)
const searchPublicPharmacies = async (query) => {
  if (!query || query.trim().length < 2) {
    throw Object.assign(new Error('검색어는 2자 이상 입력하세요.'), { status: 400 });
  }

  const { data, error } = await supabase
    .from('public_pharmacies')
    .select('id, hpid, name, address, phone, linked_pharmacy_id')
    .ilike('name', `%${query.trim()}%`)
    .limit(20);

  if (error) throw error;
  return data || [];
};

// HIRA API에서 지역별 약국 목록을 가져와 public_pharmacies에 upsert
const syncFromPublicApi = async ({ siNm, sigunguNm }) => {
  if (!process.env.HIRA_API_KEY) {
    throw Object.assign(new Error('HIRA API 키가 설정되지 않았습니다.'), { status: 503 });
  }

  // 1페이지(100개)만 가져와 Render 타임아웃 회피
  const response = await axios.get(HIRA_URL, {
    params: {
      serviceKey: process.env.HIRA_API_KEY,
      Q0: siNm,
      Q1: sigunguNm || '',
      numOfRows: 100,
      pageNo: 1,
      _type: 'json',
    },
    timeout: 15000,
  });

  const body = response.data?.response?.body;
  const rawItems = body?.items?.item;
  const allItems = rawItems ? (Array.isArray(rawItems) ? rawItems : [rawItems]) : [];

  console.log('[sync] HIRA 응답 수신:', allItems.length, '개');
  if (allItems.length === 0) return { synced: 0 };

  const now = new Date().toISOString();
  const records = allItems.map((item) => ({
    hpid: item.ykiho,
    name: item.yadmNm,
    address: item.addr || null,
    phone: item.telno || null,
    latitude: item.YPos ? parseFloat(item.YPos) : null,
    longitude: item.XPos ? parseFloat(item.XPos) : null,
    updated_at: now,
  }));

  const { error } = await supabase
    .from('public_pharmacies')
    .upsert(records, { onConflict: 'hpid' });

  if (error) throw error;
  return { synced: records.length };
};

// 관리자: 공공약국과 가입 약국 수동 연결
const linkPharmacy = async (publicPharmacyId, registeredPharmacyId) => {
  // 이미 다른 공공약국에 연결된 등록 약국인지 중복 확인
  const { data: dup } = await supabase
    .from('public_pharmacies')
    .select('id')
    .eq('linked_pharmacy_id', registeredPharmacyId)
    .single();

  if (dup && dup.id !== publicPharmacyId) {
    throw Object.assign(new Error('이미 다른 공공약국에 연결된 약국입니다.'), { status: 409 });
  }

  const { data, error } = await supabase
    .from('public_pharmacies')
    .update({ linked_pharmacy_id: registeredPharmacyId, updated_at: new Date().toISOString() })
    .eq('id', publicPharmacyId)
    .select()
    .single();

  if (error || !data) throw Object.assign(new Error('약국 연결에 실패했습니다.'), { status: 404 });
  return data;
};

// 약국 사업자: 공공데이터 약국에 자신의 약국을 직접 연결
const linkSelf = async (userId, publicPharmacyId) => {
  const { data: pharmacy, error: pharmError } = await supabase
    .from('pharmacies')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (pharmError || !pharmacy) {
    throw Object.assign(new Error('약국 정보를 찾을 수 없습니다.'), { status: 404 });
  }

  return linkPharmacy(publicPharmacyId, pharmacy.id);
};

// 연결 해제 (관리자 전용)
const unlinkPharmacy = async (publicPharmacyId) => {
  const { data, error } = await supabase
    .from('public_pharmacies')
    .update({ linked_pharmacy_id: null, updated_at: new Date().toISOString() })
    .eq('id', publicPharmacyId)
    .select()
    .single();

  if (error || !data) throw Object.assign(new Error('연결 해제에 실패했습니다.'), { status: 404 });
  return data;
};

module.exports = {
  getNearbyPublicPharmacies,
  getPublicPharmacyById,
  searchPublicPharmacies,
  syncFromPublicApi,
  linkPharmacy,
  linkSelf,
  unlinkPharmacy,
};
