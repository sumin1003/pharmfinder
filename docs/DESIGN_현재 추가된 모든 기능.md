# Design: 현재 추가된 모든 기능

> 생성일: 2026-05-19 / 최종 갱신: 2026-05-22
> 기준: 코드베이스 직접 분석 — RAG-lite AI 추천, 공공약국 상세, MFDS API 수정 반영

---

## 1. 기능 개요

- **목적**: PharmFinder 플랫폼에 현재 구현된 전체 기능의 API·DB·프론트엔드 구조를 최신 상태로 기록
- **대상 사용자**: user / pharmacy / admin 전체
- **범위 IN**: 2026-05-19 기준 코드베이스에 구현 완료된 전체 기능
- **범위 OUT**: 미구현·보류 기능

---

## 2. API 엔드포인트 설계

### 2-1. 인증 (`/api/auth`)

| 메서드 | 경로 | 인증 | 역할 | 설명 |
|--------|------|------|------|------|
| POST | `/api/auth/register` | 불필요 | - | 일반 회원가입 |
| POST | `/api/auth/pharmacy/register` | 불필요 | - | 약국 사업자 회원가입 (status: pending) |
| POST | `/api/auth/login` | 불필요 | - | 로그인 → JWT 반환 |
| POST | `/api/auth/logout` | 필요 | - | 로그아웃 |
| GET  | `/api/auth/me` | 필요 | - | 내 정보 조회 |

```
POST /api/auth/register
Request:  { "email": "...", "password": "...", "name": "홍길동" }
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
// DB 우선 검색 → 없으면 식약처(MFDS) getDrbEasyDrugInfoService 폴백 → 결과 DB 캐싱

POST /api/medicines/recommend
Request:  { "symptom": "두통, 발열" }
Response 200: {
  "summary": "...",
  "medicines": [
    {
      "name": "아세트아미노펜",   // 식약처 등재 한국어 INN 강제
      "reason": "...",
      "usage": "...",
      "caution": "...",
      "side_effects": "...",
      "db_id": "uuid-or-null"    // DB 등록 약품이면 UUID, 없으면 null
    }
  ],
  "advice": "..."
}

GET /api/medicines/123
Response 200: { "id", "name", "category", "efficacy", "usage", "precautions", "side_effects" }
```

#### AI 추천 내부 흐름 (RAG-lite)

```
POST /api/medicines/recommend { symptom }
  1. fetchContextMedicines(symptom)
       → medicines 테이블에서 name·efficacy·category ilike 검색 (최대 30개)
  2. 컨텍스트 블록 조립
       → "PharmFinder에 등록된 관련 의약품 목록" 형식으로 시스템 프롬프트에 주입
  3. Groq LLaMA-3.3-70b-versatile 호출
       → temperature 0.2, max_tokens 1024
       → 규칙: DB 목록 우선 추천 / 일반의약품만 / INN 일반명 사용 / JSON only
  4. JSON 파싱 후 attachDbIds(medicines)
       → 추천 약품명을 exact match → ilike fallback 순으로 DB 역조회
       → 매칭되면 db_id(UUID) 부착, 없으면 null
  5. 결과 반환 (db_id 포함)
```

**프론트 연동 (HomePage.jsx):**
- `db_id` 있는 약품: "DB 등록" 뱃지 표시 + "종류 보기 →" → `/medicines/search?q=약품명`
- `db_id` 없는 약품: 뱃지 없음 + "종류 보기 →" → `/medicines/search?q=약품명` (MFDS 폴백 검색)

---

### 2-2b. 의약품 검색 — MFDS API 폴백 상세

| 단계 | 동작 |
|------|------|
| 1 | Supabase `medicines` 테이블 ilike 검색 |
| 2 | 결과 있으면 즉시 반환 |
| 3 | 없으면 MFDS `getDrbEasyDrugInfoService/getDrbEasyDrugList` 호출 |
| 4 | `URLSearchParams`로 serviceKey 인코딩 (decoded key 기준) |
| 5 | 응답 `header.resultCode !== '00'` 이면 에러 throw |
| 6 | 결과를 `medicines` 테이블에 upsert 캐싱 후 반환 |

---

### 2-3. 약국 (`/api/pharmacies`)

| 메서드 | 경로 | 인증 | 역할 | 설명 |
|--------|------|------|------|------|
| GET    | `/api/pharmacies/public/nearby?lat=&lng=&radius=&medicineId=` | 불필요 | - | 카카오 API 기반 근처 약국 (is_registered·has_inventory·business_hours 포함) |
| GET    | `/api/pharmacies/public/search?q=` | 불필요 | - | 공공약국 이름 검색 (연결 선택용) |
| GET    | `/api/pharmacies/public/:id` | 불필요 | - | 공공약국 단건 조회 (연결된 가입 약국 재고 포함) |
| PUT    | `/api/pharmacies/public/self/link` | 필요 | pharmacy(승인) | 자기 약국 공공데이터 연결 |
| POST   | `/api/pharmacies/public/sync` | 필요 | admin | HIRA API 지역별 동기화 |
| PUT    | `/api/pharmacies/public/:id/link` | 필요 | admin | 관리자 수동 연결 |
| DELETE | `/api/pharmacies/public/:id/link` | 필요 | admin | 관리자 연결 해제 |
| GET    | `/api/pharmacies/nearby?lat=&lng=&radius=&medicineId=` | 불필요 | - | 근처 약국 목록 (거리순) |
| GET    | `/api/pharmacies/:id` | 불필요 | - | 약국 상세 조회 |
| GET    | `/api/pharmacies/:id/inventory` | 불필요 | - | 약국 재고 목록 |
| GET    | `/api/pharmacies/my/info` | 필요 | pharmacy | 내 약국 정보 조회 |
| PUT    | `/api/pharmacies/my/info` | 필요 | pharmacy(승인) | 내 약국 정보 수정 |
| GET    | `/api/pharmacies/my/favorites` | 필요 | user·pharmacy | 즐겨찾기 목록 조회 |
| POST   | `/api/pharmacies/:id/favorite` | 필요 | user·pharmacy | 즐겨찾기 토글 |
| POST   | `/api/pharmacies/inventory` | 필요 | pharmacy(승인) | 재고 등록(upsert) |
| PUT    | `/api/pharmacies/inventory/:id` | 필요 | pharmacy(승인) | 재고 수정 |
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

기존 테이블 그대로 사용.

| 테이블 | 주요 컬럼 | 설명 |
|--------|-----------|------|
| `users` | id, email, password, name, role, created_at | 전체 사용자 |
| `pharmacies` | id, user_id, name, address, phone, latitude, longitude, status, rejection_reason, business_hours, created_at | 약국 정보 |
| `medicines` | id, name, category, efficacy, usage, precautions, side_effects | 의약품 정보 |
| `pharmacy_inventory` | id, pharmacy_id, medicine_id, quantity, min_quantity, updated_at | 약국별 재고 |
| `favorites` | id, user_id, pharmacy_id, created_at | 사용자 즐겨찾기 |

`pharmacies.rejection_reason` — 이 세션에서 추가된 컬럼:
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
| `frontend/src/pages/HomePage.jsx` | 홈 — AI 증상 검색 (추천 카드: "종류 보기 →" 버튼) |
| `frontend/src/pages/LoginPage.jsx` | 로그인 |
| `frontend/src/pages/RegisterPage.jsx` | 일반 회원가입 |
| `frontend/src/pages/PharmacyRegisterPage.jsx` | 약국 사업자 회원가입 |
| `frontend/src/pages/MedicineSearchPage.jsx` | 의약품 검색 결과 목록 |
| `frontend/src/pages/MedicineDetailPage.jsx` | 의약품 상세 (상단 네비: [← 뒤로] [이 약 재고 있는 주변 약국 찾기 →]) |
| `frontend/src/pages/PharmacyMapPage.jsx` | 카카오맵 약국 지도 |
| `frontend/src/pages/PharmacyDetailPage.jsx` | 약국 상세·재고·즐겨찾기 버튼 |
| `frontend/src/pages/FavoritesPage.jsx` | 즐겨찾기 목록·해제 버튼·빈 상태 CTA(/map) |
| `frontend/src/pages/pharmacy/DashboardPage.jsx` | 약국 대시보드 — 재고 관리·내 정보 수정 |
| `frontend/src/pages/admin/DashboardPage.jsx` | 관리자 대시보드 — 4탭 (대기/거절/약국/회원) |
| `frontend/src/pages/admin/OverviewPage.jsx` | 전체현황 — KPI·차트 4종·테이블 (recharts) |

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

## 5. 구현 순서 (전체 완료)

1. [x] DB — `pharmacies.rejection_reason` 컬럼 추가
2. [x] 서비스 — `adminService`: `updatePharmacyStatus`(reason), `deletePharmacy`, `getOverview`(monthlySignups) 수정
3. [x] 컨트롤러 — `adminController`: `rejectPharmacy`(reason), `reapprovePharmacy`, `deletePharmacy` 추가
4. [x] 라우트 — `admin.js`: reapprove, DELETE /pharmacies/:id 등록
5. [x] 프론트 — `admin/DashboardPage`: 거절사유 입력, 재승인 버튼, 약국 삭제, 회원 페이지네이션·역할 필터
6. [x] 프론트 — `admin/OverviewPage`: recharts 차트 4종 (Pie·Donut·Bar·HorizontalBar)
7. [x] 프론트 — `FavoritesPage`: 즐겨찾기 목록, 해제 버튼, 빈 상태 CTA
8. [x] 프론트 — `App.jsx`: `/favorites` 라우트 추가
9. [x] 프론트 — `Layout.jsx`: 즐겨찾기 헤더 링크 (로그인 + admin 제외)
10. [x] 프론트 — `HomePage`: AI 추천 카드 버튼 "재고 확인" → "종류 보기 →"
11. [x] 프론트 — `MedicineDetailPage`: 상단 [← 뒤로][이 약 재고 있는 주변 약국 찾기 →] 배치, 하단 버튼 제거

---

## 6. 미들웨어 체인 (주요 경로)

```
GET /api/pharmacies/my/favorites
  → authenticate → pharmacyController.getFavorites → pharmacyService.getFavorites(userId) → Supabase

PUT /api/admin/pharmacies/:id/reject
  → authenticate → authorize('admin') → adminController.rejectPharmacy
  → adminService.updatePharmacyStatus(id, 'rejected', reason) → Supabase

DELETE /api/admin/pharmacies/:id
  → authenticate → authorize('admin') → adminController.deletePharmacy
  → adminService.deletePharmacy(id)  // pharmacy_inventory 참조 확인 후 삭제 → Supabase

GET /api/admin/overview
  → authenticate → authorize('admin') → adminController.getOverview
  → adminService.getOverview()  // 6개 Supabase 쿼리 병렬 실행 → Supabase
```

---

## 7. 열린 질문 / 결정 필요 사항

없음
