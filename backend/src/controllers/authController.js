const authService = require('../services/authService');

/**
 * POST /api/auth/register
 * 인증: 불필요
 * 이메일·비밀번호·이름으로 일반 사용자를 가입시키고 JWT 토큰을 반환한다.
 */
const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name)
      return res.status(400).json({ message: '이메일, 비밀번호, 이름은 필수입니다.' });

    const result = await authService.registerUser({ email, password, name });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/pharmacy/register
 * 인증: 불필요
 * 약국 사업자 정보를 포함한 회원가입을 처리하며, 관리자 승인 대기 상태로 등록한다.
 */
const registerPharmacy = async (req, res, next) => {
  try {
    const { email, password, name, pharmacyName, address, phone } = req.body;
    if (!email || !password || !name || !pharmacyName || !address)
      return res.status(400).json({ message: '필수 항목이 누락됐습니다.' });

    const result = await authService.registerPharmacy({ email, password, name, pharmacyName, address, phone });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * 인증: 불필요
 * 이메일·비밀번호로 로그인하고 JWT 토큰을 반환한다.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });

    const result = await authService.login({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * 인증: authenticate
 * JWT는 stateless이므로 클라이언트에서 토큰을 삭제하는 방식
 */
const logout = (req, res) => {
  // JWT는 stateless이므로 클라이언트에서 토큰을 삭제하는 방식
  res.json({ message: '로그아웃됐습니다.' });
};

/**
 * GET /api/auth/me
 * 인증: authenticate
 * 현재 로그인한 사용자의 프로필 정보를 반환한다.
 */
const me = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/{provider}/callback
 * 인증: 불필요 (passport가 처리)
 * OAuth 콜백 — JWT를 쿼리 파라미터로 담아 프론트엔드 콜백 페이지로 리다이렉트한다.
 */
const socialCallback = (req, res) => {
  if (!req.user?.token)
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=social_login_failed`);
  res.redirect(`${process.env.FRONTEND_URL}/auth-callback?token=${req.user.token}`);
};

module.exports = { register, registerPharmacy, login, logout, me, socialCallback };
