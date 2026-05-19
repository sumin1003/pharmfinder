const express = require('express');
const router = express.Router();

// 서버 상태 확인용 헬스체크 엔드포인트
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 인증 관련 라우트 (/api/auth)
router.use('/auth',       require('./auth'));
// 의약품 관련 라우트 (/api/medicines)
router.use('/medicines',  require('./medicines'));
// 약국 관련 라우트 (/api/pharmacies)
router.use('/pharmacies', require('./pharmacies'));
// 관리자 전용 라우트 (/api/admin)
router.use('/admin',      require('./admin'));

module.exports = router;
