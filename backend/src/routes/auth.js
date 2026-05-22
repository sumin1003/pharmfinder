const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { register, registerPharmacy, login, logout, me, socialCallback, changePassword, updateProfile, completeSocialSignup } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const FAILURE = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=social_login_failed`;

// 프로바이더가 미설정일 때 클라이언트를 실패 페이지로 보내는 미들웨어
const requireStrategy = (strategyName) => (req, res, next) => {
  try {
    passport._strategy(strategyName);
    next();
  } catch {
    res.redirect(FAILURE);
  }
};

// ── 소셜 OAuth 라우트 ──
router.get('/kakao', requireStrategy('kakao'), passport.authenticate('kakao'));
router.get('/kakao/callback',
  requireStrategy('kakao'),
  passport.authenticate('kakao', { failureRedirect: FAILURE }),
  socialCallback,
);

router.get('/google', requireStrategy('google'), passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  requireStrategy('google'),
  passport.authenticate('google', { failureRedirect: FAILURE }),
  socialCallback,
);

router.get('/naver', requireStrategy('naver'), passport.authenticate('naver'));
router.get('/naver/callback',
  requireStrategy('naver'),
  passport.authenticate('naver', { failureRedirect: FAILURE }),
  socialCallback,
);

// 일반 회원가입
router.post('/register',           register);
// 약국 사업자 회원가입
router.post('/pharmacy/register',  registerPharmacy);
// 로그인
router.post('/login',              login);
// 로그아웃 (토큰 검증 후 클라이언트 측 삭제 안내)
router.post('/logout',             authenticate, logout);
// 내 정보 조회
router.get('/me',                  authenticate, me);
// 비밀번호 변경 (이메일 가입 계정만 가능, JWT 유지)
router.put('/password',            authenticate, changePassword);
// 프로필 수정 (이름·이메일, 약국 역할이면 약국 정보도)
router.put('/profile',             authenticate, updateProfile);
// 소셜 신규 가입 완성
router.post('/social/complete',    completeSocialSignup);

module.exports = router;
