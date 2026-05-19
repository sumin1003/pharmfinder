const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const FAILURE = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=social_login_failed`;

// ── 소셜 OAuth 라우트 ──
router.get('/kakao', passport.authenticate('kakao'));
router.get('/kakao/callback',
  passport.authenticate('kakao', { failureRedirect: FAILURE }),
  authController.socialCallback,
);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: FAILURE }),
  authController.socialCallback,
);

router.get('/naver', passport.authenticate('naver'));
router.get('/naver/callback',
  passport.authenticate('naver', { failureRedirect: FAILURE }),
  authController.socialCallback,
);

// 일반 회원가입
router.post('/register',           authController.register);
// 약국 사업자 회원가입
router.post('/pharmacy/register',  authController.registerPharmacy);
// 로그인
router.post('/login',              authController.login);
// 로그아웃 (토큰 검증 후 클라이언트 측 삭제 안내)
router.post('/logout',             authenticate, authController.logout);
// 내 정보 조회
router.get('/me',                  authenticate, authController.me);

module.exports = router;
