const axios = require('axios');
const supabase = require('../config/supabase');

const HIRA_URL = 'https://apis.data.go.kr/B551182/pharmacyInfoService/getParmacyBasisList';
const KAKAO_LOCAL_URL = 'https://dapi.kakao.com/v2/local/search/category.json';
const EGEN_URL = 'http://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyListInfoInqire';

// E-Gen dutyTime 필드의 요일 번호 → 요일 키 매핑 (1~7=월~일, 8=공휴일)
const EGEN_DUTY_DAYS = [
  { num: 1, key: 'mon' }, { num: 2, key: 'tue' }, { num: 3, key: 'wed' }, { num: 4, key: 'thu' },
  { num: 5, key: 'fri' }, { num: 6, key: 'sat' }, { num: 7, key: 'sun' }, { num: 8, key: 'holiday' },
];

// E-Gen의 "HHMM" 4자리 문자열을 "HH:MM"으로 변환
const formatEgenTime = (hhmm) => {
  const s = hhmm == null ? '' : String(hhmm);
  if (s.length !== 4) return null;
  return `${s.slice(0, 2)}:${s.slice(2)}`;
};

// E-Gen 응답 1건(dutyTime1s~dutyTime8c)을 요일별 영업시간 객체로 변환
const buildWeeklyHours = (item) => {
  const weekly = {};
  for (const { num, key } of EGEN_DUTY_DAYS) {
    const start = formatEgenTime(item[`dutyTime${num}s`]);
    const close = formatEgenTime(item[`dutyTime${num}c`]);
    weekly[key] = start && close ? `${start}-${close}` : null;
  }
  return weekly;
};

// 요일별 영업시간 객체에서 오늘(KST 기준) 영업시간 문자열을 계산
const getTodayHoursString = (weekly) => {
  if (!weekly) return null;
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const kstDay = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })).getDay();
  return weekly[dayKeys[kstDay]] || null;
};

// 이름 앞뒤 공백·"약국" 접미사를 제거해 느슨하게 비교하기 위한 정규화
const normalizeName = (name) => (name || '').replace(/\s/g, '').replace(/약국$/, '');

// 카카오 로컬 API로 현재 위치 기준 주변 약국 실시간 조회 + 가입 약국 재고 여부 합산
const getNearbyPublicPharmacies = async ({ lat, lng, radius = 3, medicineId }) => {
  const radiusM = Math.min(radius * 1000, 20000);

  // 카카오 로컬 카테고리 검색 (PM9 = 약국), 최대 3페이지(45개)
  let kakaoItems = [];
  for (let page = 1; page <= 3; page++) {
    const res = await axios.get(KAKAO_LOCAL_URL, {
      headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` },
      params: { category_group_code: 'PM9', x: lng, y: lat, radius: radiusM, size: 15, page },
      timeout: 10000,
    });
    const docs = res.data?.documents || [];
    kakaoItems = kakaoItems.concat(docs);
    if (res.data?.meta?.is_end) break;
  }

  if (kakaoItems.length === 0) return [];

  // 가입 약국 재고 여부 확인 + E-Gen으로 채워진 영업시간 조회
  // 카카오 장소ID와 public_pharmacies.hpid(HIRA 기반)는 값 체계가 달라 직접 비교가 불가능하므로,
  // 검색 반경 내 후보를 좌표 범위로 가져와 좌표+이름 유사도로 매칭한다 (E-Gen 동기화와 동일한 방식)
  const latDeltaDeg = (radiusM / 1000) / 111;
  const lngDeltaDeg = latDeltaDeg / Math.cos((lat * Math.PI) / 180);
  const { data: candidates } = await supabase
    .from('public_pharmacies')
    .select('id, hpid, name, latitude, longitude, linked_pharmacy_id, business_hours_weekly')
    .gte('latitude', lat - latDeltaDeg).lte('latitude', lat + latDeltaDeg)
    .gte('longitude', lng - lngDeltaDeg).lte('longitude', lng + lngDeltaDeg);

  const linkedMap = new Map();
  const weeklyHoursMap = new Map();
  const publicIdMap = new Map();
  for (const d of kakaoItems) {
    const dLat = parseFloat(d.y);
    const dLng = parseFloat(d.x);
    const normalizedKakaoName = normalizeName(d.place_name);
    const match = (candidates || []).find((c) => {
      if (c.latitude == null || c.longitude == null) return false;
      if (getDistanceKm(dLat, dLng, c.latitude, c.longitude) > 0.05) return false;
      const normalizedCandidateName = normalizeName(c.name);
      return normalizedCandidateName.includes(normalizedKakaoName) || normalizedKakaoName.includes(normalizedCandidateName);
    });
    if (!match) continue;
    linkedMap.set(d.id, match.linked_pharmacy_id);
    weeklyHoursMap.set(d.id, match.business_hours_weekly);
    publicIdMap.set(d.id, match.id);
  }
  const registeredIds = [...new Set([...linkedMap.values()].filter(Boolean))];

  let anyInventorySet = new Set();
  let stockInventorySet = new Set();
  let hoursMap = new Map();

  if (registeredIds.length > 0) {
    if (medicineId) {
      const [anyRes, stockRes, hoursRes] = await Promise.all([
        supabase.from('pharmacy_inventory').select('pharmacy_id').in('pharmacy_id', registeredIds).gt('quantity', 0),
        supabase.from('pharmacy_inventory').select('pharmacy_id').in('pharmacy_id', registeredIds).eq('medicine_id', medicineId).gt('quantity', 0),
        supabase.from('pharmacies').select('id, business_hours').in('id', registeredIds),
      ]);
      anyInventorySet = new Set((anyRes.data || []).map((i) => i.pharmacy_id));
      stockInventorySet = new Set((stockRes.data || []).map((i) => i.pharmacy_id));
      hoursMap = new Map((hoursRes.data || []).map((p) => [p.id, p.business_hours]));
    } else {
      const [anyRes, hoursRes] = await Promise.all([
        supabase.from('pharmacy_inventory').select('pharmacy_id').in('pharmacy_id', registeredIds).gt('quantity', 0),
        supabase.from('pharmacies').select('id, business_hours').in('id', registeredIds),
      ]);
      anyInventorySet = new Set((anyRes.data || []).map((i) => i.pharmacy_id));
      hoursMap = new Map((hoursRes.data || []).map((p) => [p.id, p.business_hours]));
    }
  }

  return kakaoItems
    .filter((d) => !medicineId || (linkedMap.has(d.id) && stockInventorySet.has(linkedMap.get(d.id))))
    .map((d) => {
      const linkedPharmacyId = linkedMap.get(d.id) || null;
      return {
        id: d.id,
        hpid: d.id,
        name: d.place_name,
        address: d.road_address_name || d.address_name,
        phone: d.phone || null,
        latitude: parseFloat(d.y),
        longitude: parseFloat(d.x),
        linked_pharmacy_id: linkedPharmacyId,
        // public_pharmacies와 매칭된 경우에만 채워짐 — 즐겨찾기(미가입 약국) 대상 식별에 사용
        public_pharmacy_id: publicIdMap.get(d.id) || null,
        distance: parseInt(d.distance, 10) / 1000,
        is_registered: !!linkedPharmacyId,
        has_inventory: linkedPharmacyId ? anyInventorySet.has(linkedPharmacyId) : false,
        // 가입 약국은 사업자가 직접 입력한 시간을 우선하고, 미가입 약국은 E-Gen 동기화 결과(오늘 기준)를 사용
        business_hours: linkedPharmacyId
          ? (hoursMap.get(linkedPharmacyId) || null)
          : getTodayHoursString(weeklyHoursMap.get(d.id)),
      };
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
  let businessHours = getTodayHoursString(pub.business_hours_weekly);
  if (pub.linked_pharmacy_id) {
    const [{ data: inv }, { data: pharmacy }] = await Promise.all([
      supabase
        .from('pharmacy_inventory')
        .select('*, medicines(id, name, category)')
        .eq('pharmacy_id', pub.linked_pharmacy_id)
        .order('updated_at', { ascending: false }),
      supabase.from('pharmacies').select('business_hours').eq('id', pub.linked_pharmacy_id).single(),
    ]);
    inventory = inv || [];
    // 가입 약국은 사업자가 직접 입력한 시간을 우선
    businessHours = pharmacy?.business_hours || businessHours;
  }

  return { ...pub, is_registered: !!pub.linked_pharmacy_id, inventory, business_hours: businessHours };
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

const HIRA_JOB_NAME = 'hira_pharmacy_sync';
const HIRA_BATCH_PAGES = 10; // 1회 호출당 최대 처리 페이지 수 (Render 응답 타임아웃 회피)
const HIRA_PAGE_SIZE = 100;

// HIRA API에서 약국 목록을 페이지 단위로 가져와 public_pharmacies에 upsert
// Q0/Q1(시도/시군구) 파라미터는 문서상 지역 필터지만 라이브 테스트 결과 실제로는 전혀 필터링되지 않음
// (요청한 지역과 무관하게 항상 동일한 전국 순번 데이터가 반환됨 — E-Gen API와 동일한 문제).
// 그래서 지역 지정 없이 전국 데이터를 페이지 단위로 순회하며, sync_progress에 다음 시작 페이지를 저장해
// 호출할 때마다 이어서 처리한다. 전국을 완주하면 1페이지로 되돌아간다 (rolling 갱신).
const syncFromPublicApi = async () => {
  if (!process.env.HIRA_API_KEY) {
    throw Object.assign(new Error('HIRA API 키가 설정되지 않았습니다.'), { status: 503 });
  }

  const progress = await getSyncProgress(HIRA_JOB_NAME);
  let currentPage = progress.next_page || 1;
  let totalCount = progress.total_count;

  let processed = 0;
  let synced = 0;
  let reachedEnd = false;
  const now = new Date().toISOString();

  for (let i = 0; i < HIRA_BATCH_PAGES; i++) {
    const response = await axios.get(HIRA_URL, {
      params: {
        serviceKey: process.env.HIRA_API_KEY,
        numOfRows: HIRA_PAGE_SIZE,
        pageNo: currentPage,
        _type: 'json',
      },
      timeout: 15000,
    });

    const body = response.data?.response?.body;
    totalCount = body?.totalCount ?? totalCount;
    const rawItems = body?.items?.item;
    const items = rawItems ? (Array.isArray(rawItems) ? rawItems : [rawItems]) : [];

    if (items.length === 0) { reachedEnd = true; break; }

    processed += items.length;
    const records = items
      .filter((item) => item.ykiho)
      .map((item) => ({
        hpid: item.ykiho,
        name: item.yadmNm,
        address: item.addr || null,
        phone: item.telno || null,
        latitude: item.YPos ? parseFloat(item.YPos) : null,
        longitude: item.XPos ? parseFloat(item.XPos) : null,
        updated_at: now,
      }));

    if (records.length > 0) {
      const { error } = await supabase.from('public_pharmacies').upsert(records, { onConflict: 'hpid' });
      if (error) throw error;
      synced += records.length;
    }

    currentPage++;
    const pagesTotal = totalCount ? Math.ceil(totalCount / HIRA_PAGE_SIZE) : null;
    if (pagesTotal && currentPage > pagesTotal) { reachedEnd = true; break; }
  }

  const nextPage = reachedEnd ? 1 : currentPage;
  await saveSyncProgress(HIRA_JOB_NAME, nextPage, totalCount);

  console.log(`[hira-sync] 배치 완료 — processed:${processed} synced:${synced} nextPage:${nextPage} isComplete:${reachedEnd}`);

  return { processed, synced, nextPage, totalCount, isComplete: reachedEnd };
};

// 두 좌표 사이 거리를 km 단위로 계산 (Haversine)
const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const EGEN_JOB_NAME = 'egen_business_hours';
const EGEN_BATCH_PAGES = 10; // 1회 호출당 최대 처리 페이지 수 (Render 응답 타임아웃 회피)
const EGEN_PAGE_SIZE = 100;

// sync_progress에서 다음 시작 페이지를 조회 (레코드가 없으면 1페이지부터)
const getSyncProgress = async (jobName) => {
  const { data } = await supabase.from('sync_progress').select('next_page, total_count').eq('job_name', jobName).maybeSingle();
  return data || { next_page: 1, total_count: null };
};

// sync_progress를 다음 배치 시작 지점으로 갱신
const saveSyncProgress = async (jobName, nextPage, totalCount) => {
  await supabase
    .from('sync_progress')
    .upsert({ job_name: jobName, next_page: nextPage, total_count: totalCount, updated_at: new Date().toISOString() }, { onConflict: 'job_name' });
};

// E-Gen(국립중앙의료원) API에서 약국 진료시간을 페이지 단위로 조회해 기존 public_pharmacies 레코드에 매칭·저장
// Q0/Q1 지역필터가 실제로는 동작하지 않아(라이브 테스트로 확인) 전국 데이터를 페이지 단위로 순회하며,
// sync_progress에 다음 시작 페이지를 저장해 호출할 때마다 이어서 처리한다. 전국을 완주하면 1페이지로 되돌아간다.
// (신규 레코드는 생성하지 않음 — HIRA 동기화가 약국 목록의 단일 소스)
const syncBusinessHoursFromEgen = async () => {
  if (!process.env.EGEN_API_KEY) {
    throw Object.assign(new Error('E-Gen API 키가 설정되지 않았습니다.'), { status: 503 });
  }

  const progress = await getSyncProgress(EGEN_JOB_NAME);
  let currentPage = progress.next_page || 1;
  let totalCount = progress.total_count;

  // 매칭 후보 전체를 배치 시작 시 1회만 조회 (지역필터가 없어 전국 데이터를 상대해야 함)
  // Supabase/PostgREST는 .range() 없이 select()하면 기본적으로 최대 1000행만 반환하므로,
  // 전체 행을 다 가져오려면 1000건 단위로 페이지네이션해서 누적해야 한다
  // (이 제한을 몰라서 전국 데이터 중 항상 첫 1000건만 매칭 대상으로 삼던 버그가 있었음 — 실측으로 확인)
  const candidates = [];
  for (let offset = 0; ; offset += 1000) {
    const { data: page, error: candidateError } = await supabase
      .from('public_pharmacies')
      .select('id, hpid, name, address, latitude, longitude')
      .range(offset, offset + 999);

    if (candidateError) throw candidateError;
    if (!page || page.length === 0) break;
    candidates.push(...page);
    if (page.length < 1000) break;
  }

  let matched = 0;
  let unmatched = 0;
  let processed = 0;
  let reachedEnd = false;
  const now = new Date().toISOString();

  for (let i = 0; i < EGEN_BATCH_PAGES; i++) {
    // 이 API는 데이터포맷이 XML 기본이라, _type=json만 넘기고 Accept 헤더가 없으면 게이트웨이가 403을 반환함
    const response = await axios.get(EGEN_URL, {
      params: {
        serviceKey: process.env.EGEN_API_KEY,
        pageNo: currentPage,
        numOfRows: EGEN_PAGE_SIZE,
        _type: 'json',
      },
      headers: { Accept: 'application/json' },
      timeout: 15000,
    });

    const body = response.data?.response?.body;
    totalCount = body?.totalCount ?? totalCount;
    const rawItems = body?.items?.item;
    const egenItems = rawItems ? (Array.isArray(rawItems) ? rawItems : [rawItems]) : [];

    if (egenItems.length === 0) { reachedEnd = true; break; }

    for (const item of egenItems) {
      processed++;
      const weekly = buildWeeklyHours(item);
      if (!Object.values(weekly).some((v) => v !== null)) { unmatched++; continue; }

      const lat = item.wgs84Lat ? parseFloat(item.wgs84Lat) : null;
      const lng = item.wgs84Lon ? parseFloat(item.wgs84Lon) : null;
      const normalizedEgenName = normalizeName(item.dutyName);

      // 1순위: 기관식별자 매칭 — E-Gen의 hpid는 HIRA ykiho와 값 체계가 달라 사실상 항상 스킵되고 2순위로 넘어감
      let target = item.hpid ? (candidates || []).find((c) => c.hpid === item.hpid) : null;

      // 2순위: 좌표 50m 이내 + 이름 유사도 매칭
      if (!target && lat && lng) {
        target = (candidates || []).find((c) => {
          if (c.latitude == null || c.longitude == null) return false;
          if (getDistanceKm(lat, lng, c.latitude, c.longitude) > 0.05) return false;
          const normalizedCandidateName = normalizeName(c.name);
          return normalizedCandidateName.includes(normalizedEgenName) || normalizedEgenName.includes(normalizedCandidateName);
        });
      }

      if (!target) { unmatched++; continue; }

      const { error: updateError } = await supabase
        .from('public_pharmacies')
        .update({ business_hours_weekly: weekly, business_hours_synced_at: now })
        .eq('id', target.id);

      if (updateError) { unmatched++; continue; }
      matched++;
    }

    currentPage++;

    const pagesTotal = totalCount ? Math.ceil(totalCount / EGEN_PAGE_SIZE) : null;
    if (pagesTotal && currentPage > pagesTotal) { reachedEnd = true; break; }
  }

  const nextPage = reachedEnd ? 1 : currentPage;
  await saveSyncProgress(EGEN_JOB_NAME, nextPage, totalCount);

  console.log(`[egen-sync] 배치 완료 — processed:${processed} matched:${matched} unmatched:${unmatched} nextPage:${nextPage} isComplete:${reachedEnd}`);

  return { processed, matched, unmatched, nextPage, totalCount, isComplete: reachedEnd };
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

// 미가입(공공데이터) 약국 즐겨찾기 토글: 이미 등록되어 있으면 삭제, 없으면 추가
// publicPharmacyId가 실제 public_pharmacies 행을 가리키지 않으면(카카오 장소ID 등 잘못된 값) 저장할 대상이 없으므로 에러로 처리한다
const toggleFavoritePublic = async (userId, publicPharmacyId) => {
  const { data: target, error: targetError } = await supabase
    .from('public_pharmacies')
    .select('id')
    .eq('id', publicPharmacyId)
    .maybeSingle();

  if (targetError || !target)
    throw Object.assign(new Error('즐겨찾기할 수 없는 약국입니다. (공공데이터와 매칭되지 않음)'), { status: 404 });

  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('public_pharmacy_id', publicPharmacyId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('favorites').delete().eq('id', existing.id);
    if (error) throw error;
    return { favorited: false };
  }

  const { error } = await supabase.from('favorites').insert({ user_id: userId, public_pharmacy_id: publicPharmacyId });
  if (error) throw error;
  return { favorited: true };
};

module.exports = {
  getNearbyPublicPharmacies,
  getPublicPharmacyById,
  searchPublicPharmacies,
  syncFromPublicApi,
  syncBusinessHoursFromEgen,
  linkPharmacy,
  linkSelf,
  unlinkPharmacy,
  toggleFavoritePublic,
};
