const supabase = require('../config/supabase');
const { geocodeAddress } = require('./pharmacyService');
const { sendPharmacyStatusEmail } = require('./notificationService');

// 승인 대기(pending) 상태의 약국 목록을 가입 신청 순으로 조회
const getPendingPharmacies = async () => {
  const { data, error } = await supabase
    .from('pharmacies')
    .select('*, users(id, email, name, created_at)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

// 특정 약국의 상태(approved/rejected/pending)를 변경 — 거절 시 reason 저장, 재승인(pending 복귀) 시 reason 초기화
const updatePharmacyStatus = async (pharmacyId, status, reason = '') => {
  const updates = { status };
  if (status === 'rejected') updates.rejection_reason = reason;
  if (status === 'pending')  updates.rejection_reason = null;

  const { data, error } = await supabase
    .from('pharmacies')
    .update(updates)
    .eq('id', pharmacyId)
    .select('*, users(email)')
    .single();

  if (error || !data) throw Object.assign(new Error('약국을 찾을 수 없습니다.'), { status: 404 });

  // approved / rejected 변경 시 담당자에게 이메일 발송 (실패해도 에러 전파 안 함)
  if (status === 'approved' || status === 'rejected') {
    sendPharmacyStatusEmail({
      pharmacyEmail: data.users?.email,
      pharmacyName: data.name,
      status,
      rejectionReason: reason,
    }).catch((err) => console.error('[adminService] 승인 알림 이메일 발송 실패:', err.message));
  }

  return data;
};

// 전체 사용자 목록을 페이지네이션·역할 필터와 함께 조회
const getAllUsers = async ({ page = 1, limit = 20, role }) => {
  let query = supabase
    .from('users')
    .select('id, email, name, role, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (role) query = query.eq('role', role);

  const { data, count, error } = await query;
  if (error) throw error;
  return { users: data, total: count, page, limit };
};

// 관리자 대시보드용 KPI·역할별 사용자 수·저재고 약국 현황·월별 가입 추이 등 요약 통계를 집계
const getOverview = async () => {
  // 최근 6개월 시작일 (해당 월 1일 00:00:00)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [usersResult, pharmaciesResult, medicinesResult, inventoryResult, recentResult, signupResult] = await Promise.all([
    supabase.from('users').select('role', { count: 'exact' }),
    supabase.from('pharmacies').select('status', { count: 'exact' }),
    supabase.from('medicines').select('id', { count: 'exact' }),
    supabase.from('pharmacy_inventory').select('quantity, min_quantity, pharmacy_id, pharmacies(name)'),
    supabase.from('users').select('id, name, email, role, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('users').select('created_at').gte('created_at', sixMonthsAgo.toISOString()),
  ]);

  // 역할별 사용자 수 집계
  const usersByRole = (usersResult.data || []).reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  // 상태별 약국 수 집계
  const pharmaciesByStatus = (pharmaciesResult.data || []).reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  // 최소 수량 이하 재고를 보유한 약국별 저재고 품목 수 집계
  const lowStockMap = (inventoryResult.data || [])
    .filter((i) => i.quantity <= i.min_quantity)
    .reduce((acc, i) => {
      const key = i.pharmacy_id;
      if (!acc[key]) acc[key] = { pharmacy_id: key, pharmacy_name: i.pharmacies?.name, low_stock_count: 0 };
      acc[key].low_stock_count += 1;
      return acc;
    }, {});

  // 최근 6개월 월별 신규 가입자 수 집계 — 데이터 없는 달은 0으로 초기화
  const monthlyMap = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap[key] = 0;
  }
  (signupResult.data || []).forEach((u) => {
    const key = u.created_at.substring(0, 7);
    if (key in monthlyMap) monthlyMap[key]++;
  });
  const monthlySignups = Object.entries(monthlyMap).map(([month, count]) => ({ month, count }));

  return {
    kpi: {
      totalUsers: usersResult.count ?? 0,
      approvedPharmacies: pharmaciesByStatus.approved ?? 0,
      pendingPharmacies: pharmaciesByStatus.pending ?? 0,
      rejectedPharmacies: pharmaciesByStatus.rejected ?? 0,
      totalMedicines: medicinesResult.count ?? 0,
    },
    usersByRole,
    monthlySignups,
    recentUsers: recentResult.data || [],
    lowStockPharmacies: Object.values(lowStockMap),
  };
};

// 거절된 약국 목록을 거절 순으로 조회
const getRejectedPharmacies = async () => {
  const { data, error } = await supabase
    .from('pharmacies')
    .select('*, users(id, email, name)')
    .eq('status', 'rejected')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// 승인된 약국 목록 조회
const getApprovedPharmacies = async () => {
  const { data, error } = await supabase
    .from('pharmacies')
    .select('*, users(id, email, name)')
    .eq('status', 'approved')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
};

// id로 약국 조회 (status 무관)
const getAdminPharmacyById = async (id) => {
  const { data, error } = await supabase
    .from('pharmacies')
    .select('*, users(id, email, name)')
    .eq('id', id)
    .single();

  if (error || !data) throw Object.assign(new Error('약국을 찾을 수 없습니다.'), { status: 404 });
  return data;
};

// 약국 정보 수정 (주소 변경 시 재지오코딩 포함)
const updateAdminPharmacy = async (id, updates) => {
  if (updates.address) {
    const coords = await geocodeAddress(updates.address);
    updates = { ...updates, ...coords };
  }

  const { data, error } = await supabase
    .from('pharmacies')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) throw Object.assign(new Error('약국을 찾을 수 없습니다.'), { status: 404 });
  return data;
};

// 회원 강제 탈퇴 (admin 계정 보호)
const deleteUser = async (id) => {
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', id)
    .single();

  if (!user) throw Object.assign(new Error('사용자를 찾을 수 없습니다.'), { status: 404 });
  if (user.role === 'admin') throw Object.assign(new Error('관리자 계정은 삭제할 수 없습니다.'), { status: 403 });

  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
};

// 회원 역할 변경 (user ↔ admin만 허용, pharmacy 역할은 pharmacy 레코드와 결합되어 있어 제외)
const updateUserRole = async (id, role) => {
  if (!['user', 'admin'].includes(role)) {
    throw Object.assign(new Error("역할은 'user' 또는 'admin'만 지정할 수 있습니다."), { status: 400 });
  }

  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', id)
    .neq('role', 'pharmacy')
    .select('id, email, name, role, created_at')
    .single();

  if (error || !data) throw Object.assign(new Error('사용자를 찾을 수 없거나 변경할 수 없는 역할입니다.'), { status: 404 });
  return data;
};

// 전체 약품 목록 페이지네이션 조회
const getAllMedicinesAdmin = async ({ page = 1, limit = 20 }) => {
  const { data, count, error } = await supabase
    .from('medicines')
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })
    .range((page - 1) * limit, page * limit - 1);

  if (error) throw error;
  return { medicines: data, total: count, page, limit };
};

// 약품 등록 (name 필수)
const createMedicine = async ({ name, category, efficacy, usage, precautions, side_effects }) => {
  if (!name) throw Object.assign(new Error('약품명은 필수입니다.'), { status: 400 });

  const { data, error } = await supabase
    .from('medicines')
    .insert({ name, category, efficacy, usage, precautions, side_effects })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 약품 정보 수정
const updateMedicine = async (id, updates) => {
  const { data, error } = await supabase
    .from('medicines')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) throw Object.assign(new Error('약품을 찾을 수 없습니다.'), { status: 404 });
  return data;
};

// 약품 삭제 (재고 참조 시 차단)
const deleteMedicine = async (id) => {
  const { data: refs } = await supabase
    .from('pharmacy_inventory')
    .select('id')
    .eq('medicine_id', id)
    .limit(1);

  if (refs && refs.length > 0) {
    throw Object.assign(new Error('재고에 등록된 약품은 삭제할 수 없습니다.'), { status: 409 });
  }

  const { error } = await supabase.from('medicines').delete().eq('id', id);
  if (error) throw error;
};

// 약국 삭제 — 재고(pharmacy_inventory)가 있으면 409로 차단
const deletePharmacy = async (id) => {
  const { data: refs } = await supabase
    .from('pharmacy_inventory')
    .select('id')
    .eq('pharmacy_id', id)
    .limit(1);

  if (refs && refs.length > 0) {
    throw Object.assign(new Error('재고가 등록된 약국은 삭제할 수 없습니다.'), { status: 409 });
  }

  const { error } = await supabase.from('pharmacies').delete().eq('id', id);
  if (error) throw error;
};

module.exports = {
  getPendingPharmacies, updatePharmacyStatus, getAllUsers, getOverview,
  getRejectedPharmacies, getApprovedPharmacies, getAdminPharmacyById, updateAdminPharmacy,
  deleteUser, updateUserRole,
  getAllMedicinesAdmin, createMedicine, updateMedicine, deleteMedicine,
  deletePharmacy,
};
