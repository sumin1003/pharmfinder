const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');

// 의약품 검색 (쿼리: q)
router.get('/search',      medicineController.search);
// 증상 기반 AI 의약품 추천
router.post('/recommend',  medicineController.recommend);
// 의약품 상세 조회
router.get('/:id',         medicineController.getById);

module.exports = router;
