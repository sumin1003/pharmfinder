const COOKIE_NAME = 'token';

// JWT_EXPIRES_IN(예: '7d', '12h', '30m')을 쿠키 maxAge(ms)로 변환
const parseExpiresInMs = (value) => {
  const match = /^(\d+)([smhd])$/.exec(value || '');
  if (!match) return 7 * 24 * 60 * 60 * 1000; // 기본 7일

  const amount = Number(match[1]);
  const unitMs = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 }[match[2]];
  return amount * unitMs;
};

// httpOnly 인증 쿠키 옵션 — 프로덕션은 cross-site 배포이므로 SameSite=None + Secure 필수
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: parseExpiresInMs(process.env.JWT_EXPIRES_IN),
  path: '/',
});

module.exports = { COOKIE_NAME, getCookieOptions };
