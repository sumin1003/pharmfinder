# Design: 추가된 전체기능

> 생성일: 2026-05-19
> 기준: 코드베이스 직접 분석 (backend/src/routes, services, controllers + frontend/src)

---

## 1. 기능 개요

- **목적**: PharmFinder 플랫폼에 구현된 모든 기능의 API·DB·프론트엔드 구조를 한 문서로 기록해 유지보수 및 신규 개발의 참조 문서로 활용
- **대상 사용자**: user / pharmacy / admin 전체
- **범위 IN**: 현재 코드베이스에 구현 완료된 전체 기능
- **범위 OUT**: 미구현·보류 기능

---

## 2. API 엔드포인트 설계

### 2-1. 인증 (`/api/auth`)

| 메서드 | 경로 | 인증 | 역할 | 설명 |
|--------|------|------|------|------|
| POST | `/api/auth/register` | 불필요 | - | 일반 회원가입 |
| POST | `/api/auth/pharmacy/register` | 불필요 | - | 약국 사업자 회원가입 (status: pending) |
| POST | `/api/auth/login` | 불필요 | - | 로그인 → JWT 반환 |
| POST | `/api/auth/logout` | 필요 | - | 로그아웃 (클라이언트 토큰 삭제 안내) |
| GET  | `/api/auth/me` | 필요 | - | 내 정보 조회 |

```
POST /api/auth/register
Request:  { "email": "user@example.com", "password": "...", "name": "홍길동" }
Response 201: { "token": "jwt...", "user": { "id", "email", "name", "role": "user" } }

POST /api/auth/login
Request:  { "email": "...", "password": "..." }
Response 200: { "token": "jwt...", "user": { "id", "email", "name", "role" } }

GET /api/auth/me
Response 200: { "id", "email", "name", "role", "created_at" }
```

---

### 2-2. 의약품 (`/api/medicines`)

| 메서드 | 경로 | 인증 | 역할 | 설명 |
|--------|------|------|------|------|
| GET  | `/api/medicines/search?q=` | 불필요 | - | 의약품명 검색 |
| POST | `/api/medicines/recommend` | 불필요 | - | AI 증상 기반 의약품 추천 |
| GET  | `/api/medicines/:id` | 불필요 | - | 의약품 상세 조회 |

```
GET /api/medicines/search?q=타이레놀
Response 200: [ { "id", "name", "category", "efficacy", ... } ]

POST /api/medicines/recommend
Request:  { "symptoms": "두통, 발열" }
Response 200: { "medicines": [ { "name", "reason", ... } ] }

GET /api/medicines/123
Response 200: { "id", "name", "category", "efficacy", "usage", "precautions", "side_effects" }
```

---

### 2-3. 약국 (`/api/pharmacies`)

| 메서드 | 경로 | 인증 | 역할 | 설명 |
|--------|------|------|------|------|
| GET  | `/api/pharmacies/nearby?lat=&lng=&radius=&medicineId=` | 불필요 | - | 근처 약국 목록 (거리순) |
| GET  | `/api/pharmacies/:id` | 불필요 | - | 약국 상세 조회 |
| GET  | `/api/pharmacies/:id/inventory` | 불필요 | - | 약국 재고 목록 |
| GET  | `/api/pharmacies/my/info` | 필요 | pharmacy | 내 약국 정보 조회 |
| PUT  | `/api/pharmacies/my/info` | 필요 | pharmacy(승인) | 내 약국 정보 수정 |
| GET  | `/api/pharmacies/my/favorites` | 필요 | user·pharmacy | 즐겨찾기 목록 조회 |
| POST | `/api/pharmacies/:id/favorite` | 필요 | user·pharmacy | 즐겨찾기 토글 |
| POST | `/api/pharmacies/inventory` | 필요 | pharmacy(승인) | 재고 등록(upsert) |
| PUT  | `/api/pharmacies/inventory/:id` | 필요 | pharmacy(승인) | 재고 수정 |
| DELETE | `/api/pharmacies/inventory/:id` | 필요 | pharmacy(승인) | 재고 삭제 |

```
GET /api/pharmacies/nearby?lat=37.5&lng=127.0&radius=2
Response 200: [ { "id", "name", "address", "phone", "latitude", "longitude", "distance" } ]

POST /api/pharmacies/:id/favorite
Response 200: { "favorited": true }  또는  { "favorited": false }

GET /api/pharmacies/my/favorites
Response 200: [
  { "id", "created_at", "pharmacies": { "id", "name", "address", "phone" } }
]

POST /api/pharmacies/inventory
Request:  { "medicineId": 1, "quantity": 50, "minQuantity": 10 }
Response 201: { "id", "pharmacy_id", "medicine_id", "quantity", "min_quantity", "medicines": { "name" } }
```

---

### 2-4. 관리자 (`/api/admin`) — 전체 authenticate + authorize('admin')

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET    | `/api/admin/pharmacies/pending` | 승인 대기 약국 목록 |
| GET    | `/api/admin/pharmacies/rejected` | 거절된 약국 목록 |
| GET    | `/api/admin/pharmacies/approved` | 승인된 약국 목록 |
| PUT    | `/api/admin/pharmacies/:id/approve` | 약국 승인 |
| PUT    | `/api/admin/pharmacies/:id/reject` | 약국 거절 (사유 포함) |
| PUT    | `/api/admin/pharmacies/:id/reapprove` | 거절 약국 재승인 (pending 복귀) |
| GET    | `/api/admin/pharmacies/:id` | 약국 단건 조회 |
| PUT    | `/api/admin/pharmacies/:id` | 약국 정보 수정 (주소 변경 시 재지오코딩) |
| DELETE | `/api/admin/pharmacies/:id` | 약국 삭제 (재고 있으면 409 차단) |
| GET    | `/api/admin/users?page=&limit=&role=` | 회원 목록 (페이지네이션·역할 필터) |
| DELETE | `/api/admin/users/:id` | 회원 강제 탈퇴 (admin 계정 보호) |
| PUT    | `/api/admin/users/:id/role` | 회원 역할 변경 (user ↔ admin) |
| GET    | `/api/admin/medicines?page=&limit=` | 전체 의약품 목록 |
| POST   | `/api/admin/medicines` | 의약품 등록 |
| PUT    | `/api/admin/medicines/:id` | 의약품 수정 |
| DELETE | `/api/admin/medicines/:id` | 의약품 삭제 (재고 참조 시 409 차단) |
| GET    | `/api/admin/overview` | KPI·차트 통계 데이터 |

```
PUT /api/admin/pharmacies/:id/reject
Request:  { "reason": "서류 미비" }
Response 200: { "id", "status": "rejected", "rejection_reason": "서류 미비", ... }

PUT /api/admin/users/:id/role
Request:  { "role": "admin" }
Response 200: { "id", "email", "name", "role": "admin", "created_at" }

GET /api/admin/users?page=1&limit=20&role=user
Response 200: { "users": [...], "total": 42, "page": 1, "limit": 20 }

GET /api/admin/overview
Response 200:
{
  "kpi": {
    "totalUsers": 100,
    "approvedPharmacies": 30,
    "pendingPharmacies": 5,
    "rejectedPharmacies": 2,
    "totalMedicines": 500
  },
  "usersByRole": { "user": 80, "pharmacy": 18, "admin": 2 },
  "monthlySignups": [ { "month": "2026-05", "count": 12 }, ... ],
  "recentUsers": [ { "id", "name", "email", "role", "created_at" } ],
  "lowStockPharmacies": [ { "pharmacy_id", "pharmacy_name", "low_stock_count" } ]
}
```

---

## 3. DB 테이블 설계

기존 테이블 그대로 사용. 아래는 현재 운용 중인 테이블 목록.

| 테이블 | 주요 컬럼 | 설명 |
|--------|-----------|------|
| `users` | id, email, password, name, role, created_at | 전체 사용자 |
| `pharmacies` | id, user_id, name, address, phone, latitude, longitude, status, rejection_reason, business_hours, created_at | 약국 정보 |
| `medicines` | id, name, category, efficacy, usage, precautions, side_effects | 의약품 정보 |
| `pharmacy_inventory` | id, pharmacy_id, medicine_id, quantity, min_quantity, updated_at | 약국별 재고 |
| `favorites` | id, user_id, pharmacy_id, created_at | 사용자 즐겨찾기 |

`pharmacies.rejection_reason` 컬럼은 이 세션에서 추가됨:
```sql
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
```

---

## 4. 프론트엔드 컴포넌트 구조

### 전체 파일 목록

| 파일 | 역할 |
|------|------|
| `frontend/src/App.jsx` | 라우터 루트, AuthProvider, Layout 래핑 |
| `frontend/src/contexts/AuthContext.jsx` | 인증 전역 상태 (user, token, login, logout) |
| `frontend/src/components/Layout.jsx` | 헤더(네비게이션)·본문·푸터 |
| `frontend/src/components/PrivateRoute.jsx` | roles 배열 기반 접근 제어 |
| `frontend/src/services/api.js` | Axios 인스턴스 (baseURL=/api, JWT 인터셉터, 401 자동 로그아웃) |
| `frontend/src/pages/HomePage.jsx` | 홈 — AI 증상 검색 |
| `frontend/src/pages/LoginPage.jsx` | 로그인 |
| `frontend/src/pages/RegisterPage.jsx` | 일반 회원가입 |
| `frontend/src/pages/PharmacyRegisterPage.jsx` | 약국 사업자 회원가입 |
| `frontend/src/pages/MedicineSearchPage.jsx` | 의약품 검색 결과 |
| `frontend/src/pages/MedicineDetailPage.jsx` | 의약품 상세 |
| `frontend/src/pages/PharmacyMapPage.jsx` | 카카오맵 약국 지도 |
| `frontend/src/pages/PharmacyDetailPage.jsx` | 약국 상세·재고·즐겨찾기 버튼 |
| `frontend/src/pages/FavoritesPage.jsx` | 즐겨찾기 목록·해제·빈 상태 CTA |
| `frontend/src/pages/pharmacy/DashboardPage.jsx` | 약국 대시보드 — 재고 관리·내 정보 수정 |
| `frontend/src/pages/admin/DashboardPage.jsx` | 관리자 대시보드 — 4개 탭 (대기/거절/약국/회원) |
| `frontend/src/pages/admin/OverviewPage.jsx` | 전체현황 — KPI·차트 4종·테이블 |

### 등록된 라우트 (App.jsx)

```jsx
<Route path="/"                    element={<HomePage />} />
<Route path="/login"               element={<LoginPage />} />
<Route path="/register"            element={<RegisterPage />} />
<Route path="/register/pharmacy"   element={<PharmacyRegisterPage />} />
<Route path="/medicines/search"    element={<MedicineSearchPage />} />
<Route path="/medicines/:id"       element={<MedicineDetailPage />} />
<Route path="/map"                 element={<PharmacyMapPage />} />
<Route path="/pharmacies/:id"      element={<PharmacyDetailPage />} />

<Route path="/favorites"
  element={<PrivateRoute roles={['user', 'pharmacy']}><FavoritesPage /></PrivateRoute>} />
<Route path="/pharmacy/dashboard"
  element={<PrivateRoute roles={['pharmacy']}><PharmacyDashboard /></PrivateRoute>} />
<Route path="/admin"
  element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
<Route path="/admin/overview"
  element={<PrivateRoute roles={['admin']}><OverviewPage /></PrivateRoute>} />
```

### 헤더 네비게이션 조건

| 링크 | 표시 조건 |
|------|-----------|
| 약국 찾기 (`/map`) | 항상 |
| 즐겨찾기 (`/favorites`) | 로그인 + role ≠ admin |
| 재고 관리 (`/pharmacy/dashboard`) | role = pharmacy |
| 관리자 (`/admin`) | role = admin |
| 전체현황 (`/admin/overview`) | role = admin |

---

## 5. 구현 순서

1. [x] DB 스키마 변경 — `pharmacies.rejection_reason` 컬럼 추가
2. [x] 서비스 레이어 — `adminService`: `updatePharmacyStatus`, `deletePharmacy`, `getOverview`(monthlySignups 포함) 수정
3. [x] 컨트롤러 — `adminController`: `rejectPharmacy`(reason), `reapprovePharmacy`, `deletePharmacy` 추가
4. [x] 라우트 — `admin.js`: `reapprove`, `DELETE /pharmacies/:id` 등록
5. [x] 프론트 — `admin/DashboardPage`: 거절사유 입력, 재승인 버튼, 약국 삭제, 회원 페이지네이션·역할 필터
6. [x] 프론트 — `admin/OverviewPage`: recharts 차트 4종 (PieChart·DonutChart·BarChart·HorizontalBarChart)
7. [x] 프론트 — `FavoritesPage`: 즐겨찾기 목록, 해제 버튼, 빈 상태 CTA
8. [x] 프론트 — `App.jsx`: `/favorites` 라우트 추가
9. [x] 프론트 — `Layout.jsx`: 즐겨찾기 헤더 링크 추가

---

## 6. 미들웨어 체인

```
GET /api/pharmacies/my/favorites
  → authenticate
  → pharmacyController.getFavorites
  → pharmacyService.getFavorites(userId)
  → Supabase (favorites JOIN pharmacies)

PUT /api/admin/pharmacies/:id/reject
  → authenticate
  → authorize('admin')
  → adminController.rejectPharmacy
  → adminService.updatePharmacyStatus(id, 'rejected', reason)
  → Supabase (pharmacies UPDATE)

DELETE /api/admin/pharmacies/:id
  → authenticate
  → authorize('admin')
  → adminController.deletePharmacy
  → adminService.deletePharmacy(id)  // pharmacy_inventory 참조 확인 후 삭제
  → Supabase (pharmacies DELETE)

GET /api/admin/overview
  → authenticate
  → authorize('admin')
  → adminController.getOverview
  → adminService.getOverview()  // 6개 Supabase 쿼리 병렬 실행
  → Supabase
```

---

## 7. 배포 설정 (2026-05-19 추가)

### 인프라 구성

| 항목 | 값 |
|------|-----|
| 백엔드 | Render Web Service — https://pharmfinder.onrender.com |
| 프론트엔드 | Vercel Static — https://pharmfinder.vercel.app |
| 저장소 | GitHub — https://github.com/sumin1003/pharmfinder |

### 백엔드 설정 (`backend/src/app.js`)

```js
// Render 리버스 프록시 신뢰
app.set('trust proxy', 1);

// CORS — Vercel URL 하드코딩 + FRONTEND_URL 환경변수 추가 지원
const ALLOWED_ORIGINS = new Set([
  'https://pharmfinder.vercel.app',
  ...(process.env.FRONTEND_URL || '').split(',').map((o) => o.trim()).filter(Boolean),
]);

// OAuth 세션 쿠키 — 프로덕션에서만 secure
cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 5 * 60 * 1000 }
```

### 프론트엔드 설정 (`frontend/src/services/api.js`)

```js
// 개발: Vite 프록시(/api → localhost:3000)
// 프로덕션: VITE_API_URL → https://pharmfinder.onrender.com/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});
```

### 프론트엔드 SPA 라우팅 (`frontend/vercel.json`)

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```
직접 URL 접근(`/map`, `/medicines/123` 등) 시 Vercel 404 방지.

### Render 환경변수 (`render.yaml`)

| 키 | 값 | 비고 |
|----|-----|------|
| `NODE_ENV` | `production` | 하드코딩 |
| `PORT` | `10000` | Render 기본 포트 |
| `BACKEND_URL` | `https://pharmfinder.onrender.com` | |
| `FRONTEND_URL` | `https://pharmfinder.vercel.app` | CORS 추가 허용 |
| `JWT_SECRET` | — | Render 대시보드 직접 입력 |
| `SUPABASE_URL` | — | Render 대시보드 직접 입력 |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Render 대시보드 직접 입력 |
| `GROQ_API_KEY` | — | Render 대시보드 직접 입력 |
| `MFDS_API_KEY` | — | Render 대시보드 직접 입력 |
| `KAKAO_REST_API_KEY` | — | Render 대시보드 직접 입력 |
| `SESSION_SECRET` | — | Render 대시보드 직접 입력 |
| `KAKAO_CLIENT_ID` | — | OAuth용 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | — | OAuth용 |
| `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` | — | OAuth용 |

### Vercel 환경변수

| 키 | 값 |
|----|-----|
| `VITE_API_URL` | `https://pharmfinder.onrender.com/api` |
| `VITE_KAKAO_MAP_APP_KEY` | 카카오 JavaScript 키 (401 오류 확인 중) |

### OAuth passport.js 조건부 전략 등록 (`backend/src/config/passport.js`)

```js
// env 미설정 시 전략 등록 생략 → requireStrategy 미들웨어가 FAILURE로 리다이렉트
if (process.env.KAKAO_CLIENT_ID) {
  passport.use(new KakaoStrategy({ ... }, handler));
} else {
  console.warn('[passport] KAKAO_CLIENT_ID 미설정 — 카카오 로그인 비활성화');
}
```

### Supabase OAuth 마이그레이션 (실행 완료)

```sql
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'local';
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_provider_id_idx ON users (provider, provider_id)
  WHERE provider_id IS NOT NULL;
```

---

## 8. 열린 질문 / 결정 필요 사항

- **카카오맵 401**: `VITE_KAKAO_MAP_APP_KEY` 값이 JavaScript 키인지 재확인 필요 (내일 진행)
- **OAuth 앱 등록**: 카카오·구글·네이버 등록 우선순위 결정 필요
