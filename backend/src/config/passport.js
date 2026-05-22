const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const NaverStrategy = require('passport-naver').Strategy;
const { findOrCreateSocialUser } = require('../services/authService');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

passport.serializeUser((obj, done) => done(null, obj));
passport.deserializeUser((obj, done) => done(null, obj));

// 자격증명이 없는 프로바이더는 건너뜀 — 미설정 상태에서 서버가 오류 없이 기동되도록
if (process.env.KAKAO_CLIENT_ID) {
  passport.use(new KakaoStrategy(
    {
      clientID: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET || undefined,
      callbackURL: `${BACKEND_URL}/api/auth/kakao/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const result = await findOrCreateSocialUser({
          provider: 'kakao',
          providerId: String(profile.id),
          email: profile._json?.kakao_account?.email || null,
          name: profile.displayName || profile.username || '카카오사용자',
        });
        done(null, result);
      } catch (err) {
        done(err, null);
      }
    },
  ));
} else {
  console.warn('[passport] KAKAO_CLIENT_ID 미설정 — 카카오 로그인 비활성화');
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const result = await findOrCreateSocialUser({
          provider: 'google',
          providerId: profile.id,
          email: profile.emails?.[0]?.value || null,
          name: profile.displayName || 'Google사용자',
        });
        done(null, result);
      } catch (err) {
        done(err, null);
      }
    },
  ));
} else {
  console.warn('[passport] GOOGLE_CLIENT_ID/SECRET 미설정 — 구글 로그인 비활성화');
}

if (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) {
  passport.use(new NaverStrategy(
    {
      clientID: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/api/auth/naver/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const result = await findOrCreateSocialUser({
          provider: 'naver',
          providerId: profile.id,
          email: profile.emails?.[0]?.value || profile._json?.email || null,
          name: profile.displayName || profile._json?.name || '네이버사용자',
        });
        done(null, result);
      } catch (err) {
        done(err, null);
      }
    },
  ));
} else {
  console.warn('[passport] NAVER_CLIENT_ID/SECRET 미설정 — 네이버 로그인 비활성화');
}

module.exports = passport;
