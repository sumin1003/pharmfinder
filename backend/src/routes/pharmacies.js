const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacyController');
const { authenticate, authorize, requireApprovedPharmacy } = require('../middleware/auth');

// Public
// 현재 위치 기준 근처 약국 목록 조회
router.get('/nearby',          pharmacyController.getNearby);
// 특정 약국 상세 조회
router.get('/:id',             pharmacyController.getById);
// 특정 약국의 재고 목록 조회
router.get('/:id/inventory',   pharmacyController.getInventory);

// 로그인 필요
// 내 약국 정보 조회 (약국 계정 전용)
router.get('/my/info',         authenticate, authorize('pharmacy'), pharmacyController.getMyPharmacy);
// 내 약국 정보 수정 (승인된 약국 계정 전용)
router.put('/my/info',         authenticate, authorize('pharmacy'), requireApprovedPharmacy, pharmacyController.updateMyPharmacy);
// 내 즐겨찾기 약국 목록 조회
router.get('/my/favorites',    authenticate, pharmacyController.getFavorites);
// 특정 약국 즐겨찾기 토글
router.post('/:id/favorite',   authenticate, pharmacyController.toggleFavorite);

// 승인된 약국만
// 재고 추가 (upsert)
router.post('/inventory',             authenticate, authorize('pharmacy'), requireApprovedPharmacy, pharmacyController.addInventory);
// 특정 재고 항목 수정
router.put('/inventory/:id',          authenticate, authorize('pharmacy'), requireApprovedPharmacy, pharmacyController.updateInventory);
// 특정 재고 항목 삭제
router.delete('/inventory/:id',       authenticate, authorize('pharmacy'), requireApprovedPharmacy, pharmacyController.deleteInventory);

module.exports = router;
