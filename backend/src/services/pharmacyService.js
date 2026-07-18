const axios = require('axios');
const supabase = require('../config/supabase');
const notificationService = require('./notificationService');

// Haversine 공식으로 두 좌표 사이의 거리를 km 단위로 계산
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

// 카카오 주소 → 좌표 변환
const geocodeAddress = async (address) => {
  if (!process.env.KAKAO_REST_API_KEY) return { latitude: null, longitude: null };

  const response = await axios.get('https://dapi.kakao.com/v2/local/search/address.json', {
    headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` },
    params: { query: address },
  });

  const doc = response.data?.documents?.[0];
  if (!doc) return { latitude: null, longitude: null };
  return { latitude: parseFloat(doc.y), longitude: parseFloat(doc.x) };
};

// 기준 좌표에서 반경 내 승인된 약국 목록을 거리순으로 반환 (medicineId 지정 시 해당 재고 보유 약국만)
const getNearbyPharmacies = async ({ lat, lng, radius = 2, medicineId }) => {
  let query = supabase
    .from('pharmacies')
    .select('id, name, address, phone, latitude, longitude, business_hours')
    .eq('status', 'approved')
    .not('latitude', 'is', null);

  // 특정 약품 재고 있는 약국만 필터
  if (medicineId) {
    const { data: inventories } = await supabase
      .from('pharmacy_inventory')
      .select('pharmacy_id')
      .eq('medicine_id', medicineId)
      .gt('quantity', 0);

    const ids = (inventories || []).map((i) => i.pharmacy_id);
    if (ids.length === 0) return [];
    query = query.in('id', ids);
  }

  const { data: pharmacies, error } = await query;
  if (error) throw error;

  // 거리 계산 후 반경 필터링 및 가까운 순 정렬
  return pharmacies
    .map((p) => ({ ...p, distance: getDistance(lat, lng, p.latitude, p.longitude) }))
    .filter((p) => p.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
};

// id로 승인된 특정 약국 상세 정보를 담당자 정보(users)와 함께 조회
const getPharmacyById = async (id) => {
  const { data, error } = await supabase
    .from('pharmacies')
    .select('*, users(name, email)')
    .eq('id', id)
    .eq('status', 'approved')
    .single();

  if (error || !data) throw Object.assign(new Error('약국을 찾을 수 없습니다.'), { status: 404 });
  return data;
};

// 로그인한 약국 사용자의 약국 정보를 조회
const getMyPharmacy = async (userId) => {
  const { data, error } = await supabase
    .from('pharmacies')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) throw Object.assign(new Error('약국 정보를 찾을 수 없습니다.'), { status: 404 });
  return data;
};

// 약국 정보를 수정하고, 주소가 변경된 경우 카카오 API로 좌표를 재변환
const updateMyPharmacy = async (userId, updates) => {
  if (updates.address) {
    const coords = await geocodeAddress(updates.address);
    updates = { ...updates, ...coords };
  }

  const { data, error } = await supabase
    .from('pharmacies')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 특정 약국의 전체 재고 목록을 의약품 정보와 함께 최신 순으로 조회
const getInventory = async (pharmacyId) => {
  const { data, error } = await supabase
    .from('pharmacy_inventory')
    .select('*, medicines(id, name, category, efficacy)')
    .eq('pharmacy_id', pharmacyId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
};

// 재고 부족 알림 발송 — 오늘 이미 발송된 경우 건너뜀 (중복 방지)
const sendAlertIfNeeded = async (pharmacyId, medicineId, quantity, minQuantity) => {
  if (quantity > minQuantity) return;

  try {
    // 오늘 날짜로 이미 발송된 알림이 있는지 확인
    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await supabase
      .from('inventory_alerts')
      .select('id')
      .eq('pharmacy_id', pharmacyId)
      .eq('medicine_id', medicineId)
      .eq('alert_date', today)
      .maybeSingle();

    if (existing) return;

    // 약국 담당자 이메일 조회 (pharmacies → users 조인)
    const { data: pharmacy } = await supabase
      .from('pharmacies')
      .select('name, users(email)')
      .eq('id', pharmacyId)
      .single();

    // 약품명 조회
    const { data: medicine } = await supabase
      .from('medicines')
      .select('name')
      .eq('id', medicineId)
      .single();

    if (!pharmacy || !medicine) return;

    await notificationService.sendLowStockAlert({
      pharmacyEmail: pharmacy.users?.email,
      pharmacyName: pharmacy.name,
      medicineName: medicine.name,
      quantity,
      minQuantity,
    });

    // 알림 발송 기록 저장
    await supabase
      .from('inventory_alerts')
      .insert({ pharmacy_id: pharmacyId, medicine_id: medicineId, alert_date: today });
  } catch (alertErr) {
    console.error('[pharmacyService] 재고 부족 알림 발송 실패:', alertErr.message);
  }
};

// 약국 재고에 의약품을 추가하거나 기존 항목을 덮어씀 (medicine_id 기준 upsert)
const addInventory = async (pharmacyId, { medicineId, quantity, minQuantity = 10 }) => {
  const { data, error } = await supabase
    .from('pharmacy_inventory')
    .upsert({ pharmacy_id: pharmacyId, medicine_id: medicineId, quantity, min_quantity: minQuantity })
    .select('*, medicines(name)')
    .single();

  if (error) throw error;

  // 재고 부족 시 알림 발송 (실패해도 에러 전파 안 함)
  await sendAlertIfNeeded(pharmacyId, medicineId, quantity, minQuantity);

  return data;
};

// 특정 재고 항목의 수량 또는 최소 수량을 수정
const updateInventory = async (inventoryId, pharmacyId, { quantity, minQuantity }) => {
  const updates = {};
  if (quantity !== undefined) updates.quantity = quantity;
  if (minQuantity !== undefined) updates.min_quantity = minQuantity;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('pharmacy_inventory')
    .update(updates)
    .eq('id', inventoryId)
    .eq('pharmacy_id', pharmacyId)
    .select()
    .single();

  if (error || !data) throw Object.assign(new Error('재고를 찾을 수 없습니다.'), { status: 404 });

  // 수량이 수정됐고 재고 부족 상태이면 알림 발송 (실패해도 에러 전파 안 함)
  if (quantity !== undefined) {
    const effectiveMin = minQuantity !== undefined ? minQuantity : data.min_quantity;
    await sendAlertIfNeeded(pharmacyId, data.medicine_id, quantity, effectiveMin);
  }

  return data;
};

// CSV 업로드용 재고 일괄 등록 — 완전 일치 우선, 없으면 ilike 부분 일치 fallback
const bulkUpsertInventory = async (pharmacyId, rows) => {
  let success = 0;
  let fuzzy = 0;
  const failed = [];

  for (const row of rows) {
    const { name, quantity, minQuantity = 10 } = row;

    // 1단계: 완전 일치
    const { data: exactMed } = await supabase
      .from('medicines')
      .select('id')
      .eq('name', name)
      .maybeSingle();

    let medicineId = exactMed?.id || null;
    let matched = 'exact';

    // 2단계: ilike 부분 일치 fallback
    if (!medicineId) {
      const { data: fuzzyMeds } = await supabase
        .from('medicines')
        .select('id')
        .ilike('name', `%${name}%`)
        .limit(1);

      if (fuzzyMeds && fuzzyMeds.length > 0) {
        medicineId = fuzzyMeds[0].id;
        matched = 'fuzzy';
      }
    }

    if (!medicineId) {
      failed.push({ name, reason: '등록된 약품을 찾을 수 없습니다.' });
      continue;
    }

    const { error: upsertError } = await supabase
      .from('pharmacy_inventory')
      .upsert({ pharmacy_id: pharmacyId, medicine_id: medicineId, quantity, min_quantity: minQuantity });

    if (upsertError) {
      failed.push({ name, reason: '재고 등록에 실패했습니다.' });
      continue;
    }

    success++;
    if (matched === 'fuzzy') fuzzy++;
  }

  return { success, fuzzy, failed };
};

// 특정 재고 항목을 삭제 (해당 약국 소유 여부 검증 포함)
const deleteInventory = async (inventoryId, pharmacyId) => {
  const { error } = await supabase
    .from('pharmacy_inventory')
    .delete()
    .eq('id', inventoryId)
    .eq('pharmacy_id', pharmacyId);

  if (error) throw error;
};

// 즐겨찾기 토글: 이미 등록되어 있으면 삭제, 없으면 추가
const toggleFavorite = async (userId, pharmacyId) => {
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('pharmacy_id', pharmacyId)
    .single();

  if (existing) {
    await supabase.from('favorites').delete().eq('id', existing.id);
    return { favorited: false };
  }

  await supabase.from('favorites').insert({ user_id: userId, pharmacy_id: pharmacyId });
  return { favorited: true };
};

// 로그인한 사용자의 즐겨찾기 약국 목록을 약국 기본 정보와 함께 조회 (가입 약국 + 미가입/공공데이터 약국 모두 포함)
const getFavorites = async (userId) => {
  const { data, error } = await supabase
    .from('favorites')
    .select('*, pharmacies(id, name, address, phone), public_pharmacies(id, name, address, phone)')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
};

module.exports = {
  geocodeAddress,
  getNearbyPharmacies, getPharmacyById, getMyPharmacy, updateMyPharmacy,
  getInventory, addInventory, updateInventory, bulkUpsertInventory, deleteInventory,
  toggleFavorite, getFavorites,
};
