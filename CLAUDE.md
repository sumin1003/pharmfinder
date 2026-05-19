# PharmFinder — 프로젝트 컨텍스트

## 프로젝트 개요
약국 찾기 서비스. 사용자가 의약품을 검색하고 근처 약국의 재고를 확인하며, 약국 사업자가 재고를 관리할 수 있는 플랫폼.

## 기술 스택
| 영역 | 기술 |
|------|------|
| 백엔드 | Node.js + Express 5 (CommonJS) |
| 프론트엔드 | React 19 + Vite + TailwindCSS 4 |
| DB | Supabase (PostgreSQL) |
| 인증 | JWT (`jsonwebtoken`) + bcryptjs |
| AI | Anthropic SDK, Google Generative AI, Groq SDK |

## 사용자 역할
- `user` — 일반 사용자: 약 검색, 약국 지도 조회
- `pharmacy` — 약국 관리자: 재고 관리 (관리자 승인 필요, status: pending→approved)
- `admin` — 슈퍼 관리자: 전체 관리, 약국 승인/거절

## 백엔드 구조 (`backend/src/`)
```
app.js              # Express 앱 (helmet, cors, morgan, 에러핸들러)
server.js           # 서버 진입점 (포트 바인딩)
config/
  supabase.js       # Supabase 클라이언트 싱글턴
controllers/        # req/res 처리만 담당 (try/catch → next(err))
  authController.js
  medicineController.js
  pharmacyController.js
  adminController.js
services/           # 비즈니스 로직 + Supabase 쿼리
  authService.js
  medicineService.js
  pharmacyService.js
  adminService.js
routes/
  index.js          # /api 하위 라우트 통합
  auth.js           # /api/auth
  medicines.js      # /api/medicines
  pharmacies.js     # /api/pharmacies
  admin.js          # /api/admin
middleware/
  auth.js           # authenticate, authorize(...roles), requireApprovedPharmacy
```

## API 엔드포인트
```
POST /api/auth/register           일반 회원가입
POST /api/auth/register/pharmacy  약국 회원가입
POST /api/auth/login              로그인
POST /api/auth/logout             로그아웃
GET  /api/auth/me                 내 정보 (authenticate 필요)

GET  /api/medicines/search        약 검색 (쿼리: q)
GET  /api/medicines/:id           약 상세

GET  /api/pharmacies              약국 목록
GET  /api/pharmacies/:id          약국 상세

GET  /api/admin/*                 관리자 전용 (authenticate + authorize('admin'))
```

## 미들웨어 사용법
```js
const { authenticate, authorize, requireApprovedPharmacy } = require('../middleware/auth');

// 로그인 필요
router.get('/profile', authenticate, controller.getProfile);

// 역할 제한
router.get('/admin/data', authenticate, authorize('admin'), controller.getData);

// 약국 전용 (승인된 약국만)
router.post('/inventory', authenticate, requireApprovedPharmacy, controller.updateInventory);
```

## 표준 에러 패턴 (서비스 레이어)
```js
// 상태코드 포함 에러
throw Object.assign(new Error('이미 사용 중인 이메일입니다.'), { status: 409 });

// Supabase 에러는 그냥 throw
if (error) throw error;
```

## 컨트롤러 패턴
```js
const someAction = async (req, res, next) => {
  try {
    const result = await someService.doSomething(req.body);
    res.status(201).json(result);          // 생성: 201
    // res.json(result);                   // 조회/수정: 200
  } catch (err) {
    next(err);  // 전역 에러핸들러로 위임
  }
};
```

## 프론트엔드 구조 (`frontend/src/`)
```
App.jsx                         # 라우터 + AuthProvider + Layout
contexts/AuthContext.jsx         # 인증 전역 상태 (user, token, login, logout)
components/
  Layout.jsx                    # 공통 레이아웃
  PrivateRoute.jsx               # roles 기반 접근 제어
pages/
  HomePage.jsx
  LoginPage.jsx / RegisterPage.jsx / PharmacyRegisterPage.jsx
  MedicineSearchPage.jsx / MedicineDetailPage.jsx
  PharmacyMapPage.jsx / PharmacyDetailPage.jsx
  pharmacy/DashboardPage.jsx     # role: pharmacy
  admin/DashboardPage.jsx        # role: admin
services/
  api.js                        # Axios 인스턴스 (baseURL=/api, JWT 인터셉터)
```

## PrivateRoute 사용법
```jsx
<Route
  path="/pharmacy/dashboard"
  element={<PrivateRoute roles={['pharmacy']}><PharmacyDashboard /></PrivateRoute>}
/>
```

## API 호출 패턴 (프론트)
```js
import api from '../services/api';

// GET
const { data } = await api.get('/medicines/search', { params: { q: keyword } });

// POST
const { data } = await api.post('/auth/login', { email, password });
```

## 환경 변수
```
backend/.env:
  SUPABASE_URL, SUPABASE_ANON_KEY, JWT_SECRET, JWT_EXPIRES_IN, PORT, FRONTEND_URL

frontend/.env:
  VITE_API_URL (vite.config.js의 proxy 설정으로 /api → backend로 포워딩)
```

## 개발 서버
```
cd backend  && npm run dev   # nodemon, 포트 3000
cd frontend && npm run dev   # vite, 포트 5173 (proxy: /api → localhost:3000)
```

## 코딩 규칙
- 백엔드: CommonJS (`require`/`module.exports`), async/await, 한국어 에러 메시지
- 프론트: ESM, 함수형 컴포넌트 + hooks, Tailwind 인라인 스타일
- 미사용 코드, 하위호환 shim 금지

## 주석 규칙
- **함수/컴포넌트 설명 주석 허용**: 모든 함수와 컴포넌트에 한 줄 설명 주석 작성
- **API 문서 주석 허용**: 라우트 핸들러에 JSDoc 스타일(`/** */`)로 메서드·경로·인증·설명 명시
- **인라인 주석**: WHY가 불명확한 경우에만 작성 (단순 동작 설명 금지)

### 백엔드 주석 형식
```js
// 사용자 목록 조회 (페이지네이션, 역할 필터 지원)
const getAllUsers = async ({ page, limit, role }) => { ... };

/**
 * GET /api/admin/users
 * 인증: 필요 (admin)
 * 전체 회원 목록을 페이지네이션으로 반환한다.
 */
const getAllUsers = async (req, res, next) => { ... };
```

### 프론트엔드 주석 형식
```js
// 로그인 폼 제출 처리 — 성공 시 AuthContext 업데이트 후 홈으로 이동
const handleSubmit = async (e) => { ... };
```
