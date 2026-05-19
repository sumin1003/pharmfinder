const adminService = require('../services/adminService');

/**
 * GET /api/admin/pharmacies/pending
 * 인증: authenticate, authorize('admin')
 * 관리자 승인을 기다리는 약국 목록을 신청 순으로 조회한다.
 */
const getPendingPharmacies = async (req, res, next) => {
  try {
    const data = await adminService.getPendingPharmacies();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/pharmacies/:id/approve
 * 인증: authenticate, authorize('admin')
 * 특정 약국의 상태를 approved로 변경하여 서비스 이용을 허가한다.
 */
const approvePharmacy = async (req, res, next) => {
  try {
    const pharmacy = await adminService.updatePharmacyStatus(req.params.id, 'approved');
    res.json({ message: '약국이 승인됐습니다.', pharmacy });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/pharmacies/:id/reject
 * 인증: authenticate, authorize('admin')
 * 특정 약국의 상태를 rejected로 변경하고 거절 사유를 저장한다.
 */
const rejectPharmacy = async (req, res, next) => {
  try {
    const pharmacy = await adminService.updatePharmacyStatus(req.params.id, 'rejected', req.body.reason || '');
    res.json({ message: '약국이 거절됐습니다.', pharmacy });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/pharmacies/:id/reapprove
 * 인증: authenticate, authorize('admin')
 * 거절된 약국을 pending 상태로 복귀시켜 재검토 대기열에 올린다.
 */
const reapprovePharmacy = async (req, res, next) => {
  try {
    const pharmacy = await adminService.updatePharmacyStatus(req.params.id, 'pending');
    res.json({ message: '약국이 재검토 대기 상태로 변경됐습니다.', pharmacy });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/pharmacies/:id
 * 인증: authenticate, authorize('admin')
 * 약국을 삭제한다. 재고가 있으면 409 반환.
 */
const deletePharmacy = async (req, res, next) => {
  try {
    await adminService.deletePharmacy(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/users?page=&limit=&role=
 * 인증: authenticate, authorize('admin')
 * 전체 사용자 목록을 페이지네이션 및 역할 필터와 함께 조회한다.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, role } = req.query;
    const result = await adminService.getAllUsers({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      role,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/overview
 * 인증: authenticate, authorize('admin')
 * 관리자 대시보드용 KPI·사용자 통계·저재고 약국 현황 등 요약 데이터를 반환한다.
 */
const getOverview = async (req, res, next) => {
  try {
    const data = await adminService.getOverview();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/pharmacies/rejected
 * 인증: authenticate, authorize('admin')
 * 거절된 약국 목록을 조회한다.
 */
const getRejectedPharmacies = async (req, res, next) => {
  try {
    const data = await adminService.getRejectedPharmacies();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/pharmacies/approved
 * 인증: authenticate, authorize('admin')
 * 승인된 약국 목록을 조회한다.
 */
const getApprovedPharmacies = async (req, res, next) => {
  try {
    const data = await adminService.getApprovedPharmacies();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/pharmacies/:id
 * 인증: authenticate, authorize('admin')
 * 특정 약국 상세 정보를 조회한다 (status 무관).
 */
const getAdminPharmacyById = async (req, res, next) => {
  try {
    const data = await adminService.getAdminPharmacyById(req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/pharmacies/:id
 * 인증: authenticate, authorize('admin')
 * 약국 정보를 수정한다. 주소 변경 시 재지오코딩을 수행한다.
 */
const updateAdminPharmacy = async (req, res, next) => {
  try {
    const data = await adminService.updateAdminPharmacy(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/users/:id
 * 인증: authenticate, authorize('admin')
 * 회원을 강제 탈퇴한다. admin 계정은 삭제 불가.
 */
const deleteUser = async (req, res, next) => {
  try {
    await adminService.deleteUser(req.params.id);
    res.json({ message: '회원이 삭제됐습니다.' });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/users/:id/role
 * 인증: authenticate, authorize('admin')
 * 회원 역할을 변경한다 (user ↔ admin).
 */
const updateUserRole = async (req, res, next) => {
  try {
    const data = await adminService.updateUserRole(req.params.id, req.body.role);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/medicines?page=&limit=
 * 인증: authenticate, authorize('admin')
 * 전체 약품 목록을 페이지네이션으로 반환한다.
 */
const getAllMedicinesAdmin = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await adminService.getAllMedicinesAdmin({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/medicines
 * 인증: authenticate, authorize('admin')
 * 약품을 직접 등록한다.
 */
const createMedicine = async (req, res, next) => {
  try {
    const data = await adminService.createMedicine(req.body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/medicines/:id
 * 인증: authenticate, authorize('admin')
 * 약품 정보를 수정한다.
 */
const updateMedicine = async (req, res, next) => {
  try {
    const data = await adminService.updateMedicine(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/medicines/:id
 * 인증: authenticate, authorize('admin')
 * 약품을 삭제한다. 재고 참조 시 409 반환.
 */
const deleteMedicine = async (req, res, next) => {
  try {
    await adminService.deleteMedicine(req.params.id);
    res.json({ message: '약품이 삭제됐습니다.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPendingPharmacies, approvePharmacy, rejectPharmacy, reapprovePharmacy, deletePharmacy,
  getAllUsers, getOverview,
  getRejectedPharmacies, getApprovedPharmacies, getAdminPharmacyById, updateAdminPharmacy,
  deleteUser, updateUserRole,
  getAllMedicinesAdmin, createMedicine, updateMedicine, deleteMedicine,
};
