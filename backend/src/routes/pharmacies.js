const express = require('express');
const router = express.Router();
const multer = require('multer');
const pharmacyController = require('../controllers/pharmacyController');
const publicPharmacyController = require('../controllers/publicPharmacyController');
const { authenticate, authorize, requireApprovedPharmacy } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 } }); // 1MB 제한

// Public
// 현재 위치 기준 근처 약국 목록 조회
router.get('/nearby',          pharmacyController.getNearby);

// 공공데이터 약국 — 비파라미터 경로 먼저 (/:id보다 앞에 위치해야 함)
router.get('/public/nearby',     publicPharmacyController.getNearby);
router.get('/public/search',     publicPharmacyController.search);
router.put('/public/self/link',  authenticate, authorize('pharmacy'), requireApprovedPharmacy, publicPharmacyController.linkSelf);
router.post('/public/sync',      authenticate, authorize('admin'), publicPharmacyController.sync);
router.post('/public/sync-hours', authenticate, authorize('admin'), publicPharmacyController.syncHours);
router.get('/public/:id',        publicPharmacyController.getById);
router.put('/public/:id/link',   authenticate, authorize('admin'), publicPharmacyController.link);
router.delete('/public/:id/link', authenticate, authorize('admin'), publicPharmacyController.unlink);
// 미가입(공공데이터) 약국 즐겨찾기 토글
router.post('/public/:id/favorite', authenticate, publicPharmacyController.toggleFavorite);
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
// CSV 파일로 재고 일괄 등록
router.post('/inventory/csv',         authenticate, authorize('pharmacy'), requireApprovedPharmacy, upload.single('file'), pharmacyController.uploadInventoryCsv);
// 재고 추가 (upsert)
router.post('/inventory',             authenticate, authorize('pharmacy'), requireApprovedPharmacy, pharmacyController.addInventory);
// 특정 재고 항목 수정
router.put('/inventory/:id',          authenticate, authorize('pharmacy'), requireApprovedPharmacy, pharmacyController.updateInventory);
// 특정 재고 항목 삭제
router.delete('/inventory/:id',       authenticate, authorize('pharmacy'), requireApprovedPharmacy, pharmacyController.deleteInventory);

module.exports = router;
