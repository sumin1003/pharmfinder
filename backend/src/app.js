const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('./config/passport');
const { verifyCustomHeader } = require('./middleware/csrf');

const app = express();

// Render 등 리버스 프록시 뒤에서 HTTPS 프로토콜·IP를 올바르게 인식
app.set('trust proxy', 1);

// 보안 헤더 설정
app.use(helmet());
// CORS: Vercel 프로덕션 URL은 항상 허용, 추가 오리진은 FRONTEND_URL로 지정
const ALLOWED_ORIGINS = new Set([
  'https://pharmfinder.vercel.app',
  ...(process.env.FRONTEND_URL || '').split(',').map((o) => o.trim()).filter(Boolean),
]);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.has(origin)) return callback(null, true);
    callback(Object.assign(new Error('CORS 정책에 의해 차단됐습니다.'), { status: 403 }));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
// HTTP 요청 로깅
app.use(morgan('dev'));
// JSON 바디 파싱
app.use(express.json());
// URL 인코딩 바디 파싱
app.use(express.urlencoded({ extended: true }));
// httpOnly 인증 쿠키 파싱
app.use(cookieParser());
// CSRF 방어: 상태 변경 요청에 X-Requested-With 헤더 요구 (쿠키는 브라우저가 자동 전송하므로 필요)
app.use(verifyCustomHeader);
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
