const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// 모든 admin 라우트에 인증 및 관리자 권한 검증 일괄 적용
router.use(authenticate, authorize('admin'));

// 약국 — 정적 경로를 :id 앞에 등록해야 충돌 없음
router.get('/pharmacies/pending',        adminController.getPendingPharmacies);
router.get('/pharmacies/rejected',       adminController.getRejectedPharmacies);
router.get('/pharmacies/approved',       adminController.getApprovedPharmacies);
router.put('/pharmacies/:id/approve',    adminController.approvePharmacy);
router.put('/pharmacies/:id/reject',     adminController.rejectPharmacy);
router.put('/pharmacies/:id/reapprove', adminController.reapprovePharmacy);
router.get('/pharmacies/:id',            adminController.getAdminPharmacyById);
router.put('/pharmacies/:id',            adminController.updateAdminPharmacy);
router.delete('/pharmacies/:id',         adminController.deletePharmacy);

// 사용자
router.get('/users',                     adminController.getAllUsers);
router.delete('/users/:id',              adminController.deleteUser);
router.put('/users/:id/role',            adminController.updateUserRole);

// 약품
router.get('/medicines',                 adminController.getAllMedicinesAdmin);
router.post('/medicines',                adminController.createMedicine);
router.put('/medicines/:id',             adminController.updateMedicine);
router.delete('/medicines/:id',          adminController.deleteMedicine);

// 관리자 대시보드 요약 통계
router.get('/overview',                  adminController.getOverview);

module.exports = router;
