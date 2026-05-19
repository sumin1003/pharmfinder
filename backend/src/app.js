const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('./config/passport');

const app = express();

// Render 등 리버스 프록시 뒤에서 HTTPS 프로토콜·IP를 올바르게 인식
app.set('trust proxy', 1);

// 보안 헤더 설정
app.use(helmet());
// CORS: 환경변수 미설정 시 Vercel 프로덕션 URL을 기본값으로 사용
const ALLOWED_ORIGINS = (process.env.FRONTEND_URL || 'https://pharmfinder.vercel.app')
  .split(',').map((o) => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // origin이 없으면 서버 간 요청 또는 개발 도구 — 허용
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(Object.assign(new Error('CORS 정책에 의해 차단됐습니다.'), { status: 403 }));
  },
  credentials: true,
}));
// HTTP 요청 로깅
app.use(morgan('dev'));
// JSON 바디 파싱
app.use(express.json());
// URL 인코딩 바디 파싱
app.use(express.urlencoded({ extended: true }));
// OAuth 핸드셰이크용 세션 (JWT 인증과 별개 — OAuth 리다이렉트 흐름에서만 사용)
app.use(session({
  secret: process.env.SESSION_SECRET || 'pharmfinder-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 5 * 60 * 1000 },
}));
app.use(passport.initialize());
app.use(passport.session());

// /api 하위 라우트 등록
app.use('/api', require('./routes'));

// 전역 에러 핸들러: 서비스·컨트롤러에서 next(err)로 전달된 에러를 처리
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || '서버 오류가 발생했습니다.' });
});

module.exports = app;
