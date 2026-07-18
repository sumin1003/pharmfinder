const authService = require('../services/authService');
const { COOKIE_NAME, getCookieOptions } = require('../config/cookie');

/**
 * POST /api/auth/register
 * 인증: 불필요
 * 이메일·비밀번호·이름으로 일반 사용자를 가입시키고 JWT를 httpOnly 쿠키로 발급한다.
 */
const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name)
      return res.status(400).json({ message: '이메일, 비밀번호, 이름은 필수입니다.' });

    const { token, ...result } = await authService.registerUser({ email, password, name });
    res.cookie(COOKIE_NAME, token, getCookieOptions());
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
 * 이메일·비밀번호로 로그인하고 JWT를 httpOnly 쿠키로 발급한다.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });

    const { token, ...result } = await authService.login({ email, password });
    res.cookie(COOKIE_NAME, token, getCookieOptions());
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * 인증: authenticate
 * 인증 쿠키를 만료시켜 로그아웃 처리한다.
 */
const logout = (req, res) => {
  res.clearCookie(COOKIE_NAME, getCookieOptions());
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
 * OAuth 콜백 — 기존 사용자는 JWT를 httpOnly 쿠키로 발급한 뒤 콜백 페이지로, 신규 사용자는 소셜 가입 완성 페이지로 리다이렉트한다.
 */
const socialCallback = (req, res) => {
  const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173';
  if (!req.user)
    return res.redirect(`${FRONTEND}/login?error=social_login_failed`);

  if (req.user.type === 'login') {
    res.cookie(COOKIE_NAME, req.user.token, getCookieOptions());
    return res.redirect(`${FRONTEND}/auth-callback`);
  }

  // 신규 사용자 → 소셜 가입 완성 페이지로 (이름·이메일도 함께 전달)
  // pendingToken은 계정 미생성 상태의 10분짜리 임시 토큰이므로 인증 쿠키 대상이 아님 — URL 쿼리 유지
  const params = new URLSearchParams({ pending: req.user.pendingToken });
  if (req.user.name) params.set('name', req.user.name);
  if (req.user.email) params.set('email', req.user.email);
  return res.redirect(`${FRONTEND}/social-signup?${params.toString()}`);
};

/**
 * PUT /api/auth/password
 * 인증: 필요 (authenticate)
 * 현재 비밀번호 확인 후 새 비밀번호로 변경한다. 인증 쿠키는 유지된다.
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: '현재 비밀번호와 새 비밀번호를 입력해주세요.' });
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/auth/profile
 * 인증: 필요 (authenticate)
 * 사용자 이름·이메일 및 약국 정보(약국 역할인 경우)를 수정한다.
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, pharmacyName, address, phone } = req.body;
    const { token, ...result } = await authService.updateProfile(req.user.id, req.user.role, { name, email, pharmacyName, address, phone });
    if (token) res.cookie(COOKIE_NAME, token, getCookieOptions());
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/social/complete
 * 인증: 불필요
 * 소셜 신규 사용자가 이름·이메일을 확인한 뒤 계정을 생성하고 JWT를 httpOnly 쿠키로 발급한다.
 */
const completeSocialSignup = async (req, res, next) => {
  try {
    const { pendingToken, name, email } = req.body;
    if (!pendingToken || !name || !email)
      return res.status(400).json({ message: '필수 항목이 누락됐습니다.' });
    const { token, ...result } = await authService.completeSocialSignup({ pendingToken, name, email });
    res.cookie(COOKIE_NAME, token, getCookieOptions());
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/forgot-password
 * 인증: 불필요
 * 이메일로 비밀번호 재설정 링크를 발송한다. 계정 존재 여부와 무관하게 동일한 응답을 반환한다.
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: '이메일을 입력해주세요.' });

    await authService.requestPasswordReset(email);
    res.json({ message: '해당 이메일로 가입된 계정이 있다면 재설정 링크를 발송했습니다.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password
 * 인증: 불필요
 * 재설정 토큰을 검증한 뒤 새 비밀번호로 변경한다.
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({ message: '토큰과 새 비밀번호를 입력해주세요.' });

    const result = await authService.resetPassword(token, newPassword);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, registerPharmacy, login, logout, me, socialCallback, changePassword, updateProfile, completeSocialSignup, forgotPassword, resetPassword };
