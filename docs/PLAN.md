# PharmFinder — 작업 계획서

> 생성일: 2026-05-19
> 기준: SPEC.md 없음 — CLAUDE.md + 코드베이스 직접 분석

---

## 1. 구현 완료 기능

| 기능 | 백엔드 | 프론트 | 비고 |
|------|--------|--------|------|
| 일반 회원가입 | ✅ | ✅ | `POST /api/auth/register` → `RegisterPage` |
| 약국 사업자 회원가입 | ✅ | ✅ | `POST /api/auth/pharmacy/register` → `PharmacyRegisterPage` |
| 이메일 로그인 / 로그아웃 | ✅ | ✅ | JWT, AuthContext, localStorage |
| 소셜 로그인 (카카오·구글·네이버) | ✅ | ✅ | 코드 완성 — Supabase 마이그레이션·패키지·OAuth 앱 등록 필요 |
| 내 정보 조회 | ✅ | ✅ | `GET /api/auth/me` → AuthContext 초기화 |
| 약품 검색 | ✅ | ✅ | `GET /api/medicines/search` → `MedicineSearchPage` |
| 약품 상세 조회 | ✅ | ✅ | `GET /api/medicines/:id` → `MedicineDetailPage` |
| AI 증상 기반 의약품 추천 | ✅ | ✅ | `POST /api/medicines/recommend` → `HomePage` 검색 창 |
| 약국 지도 (카카오맵) | ✅ | ✅ | `GET /api/pharmacies/nearby` → `PharmacyMapPage` |
| 약국 상세 조회 | ✅ | ✅ | `GET /api/pharmacies/:id` → `PharmacyDetailPage` |
| 약국 즐겨찾기 토글 | ✅ | ✅ | `POST /api/pharmacies/:id/favorite` → `PharmacyDetailPage` 버튼 |
| 약국 재고 조회 (공개) | ✅ | ✅ | `GET /api/pharmacies/:id/inventory` → `PharmacyDetailPage` |
| 즐겨찾기 목록 페이지 | ✅ | ✅ | `GET /api/pharmacies/my/favorites` → `FavoritesPage` (해제·빈 상태 CTA) |
| 약국 대시보드 — 재고 등록 | ✅ | ✅ | `POST /api/pharmacies/inventory` |
| 약국 대시보드 — 재고 수정 | ✅ | ✅ | `PUT /api/pharmacies/inventory/:id` |
| 약국 대시보드 — 재고 삭제 | ✅ | ✅ | `DELETE /api/pharmacies/inventory/:id` |
| 관리자 — 약국 승인 | ✅ | ✅ | `PUT /api/admin/pharmacies/:id/approve` |
| 관리자 — 약국 거절 (+ 사유) | ✅ | ✅ | `PUT /api/admin/pharmacies/:id/reject` |
| 관리자 — 거절 약국 재승인 | ✅ | ✅ | `PUT /api/admin/pharmacies/:id/reapprove` |
| 관리자 — 약국 삭제 | ✅ | ✅ | `DELETE /api/admin/pharmacies/:id` (재고 있으면 409 차단) |
| 관리자 — 약국 정보 수정 | ✅ | ✅ | `PUT /api/admin/pharmacies/:id` (주소 변경 시 재지오코딩) |
| 관리자 — 회원 목록 (페이지네이션·역할 필터) | ✅ | ✅ | `GET /api/admin/users?page=&limit=&role=` |
| 관리자 — 회원 삭제 | ✅ | ✅ | `DELETE /api/admin/users/:id` (admin 계정 보호) |
| 관리자 — 회원 역할 변경 | ✅ | ✅ | `PUT /api/admin/users/:id/role` (user ↔ admin) |
| 관리자 — 약품 CRUD | ✅ | ✅ | `GET/POST/PUT/DELETE /api/admin/medicines` |
| 관리자 — 전체현황 (KPI·차트 4종) | ✅ | ✅ | `GET /api/admin/overview` → `OverviewPage` (recharts) |
| AI 추천 UX 개선 | - | ✅ | `HomePage` 버튼 "종류 보기 →", `MedicineDetailPage` 상단 약국 찾기 버튼 |

---

## 2. 미완성 / Gap 기능

| 기능 | 백엔드 | 프론트 | 우선순위 | 설명 |
|------|--------|--------|----------|------|
| 약국 내 정보 자체 수정 | ✅ | ✅ | - | `PUT /api/pharmacies/my/info` → `PharmacyDashboard` 상단 "정보 수정" 버튼·인라인 폼 추가 완료 |
| OAuth 소셜 로그인 환경 설정 | ✅ | ✅ | P1 | 코드 완성, 아래 3가지 미완료: ① `ALTER TABLE users` Supabase 실행 ② `npm install passport ...` ③ 카카오·구글·네이버 앱 등록 + `.env` 키 입력 |

---

## 3. 이번 대화 신규 요청

| 요청 내용 | 상태 | SDD 작성 여부 |
|-----------|------|---------------|
| OAuth 소셜 로그인 (카카오·구글·네이버) | 코드 완료 / 환경 설정 중 | 있음 |

---

## 4. 우선순위별 작업 계획

### P1 — 즉시 필요 (운영 불가)

- [ ] OAuth 소셜 로그인 환경 설정 완료 — Supabase SQL 실행 + `npm install` + OAuth 앱 등록 + `.env` 키 설정

### P2 — 중요 (핵심 UX·기능 완성도)

없음

### P3 — 개선 (편의·polish)

없음

---

## 5. 보류 / 결정 필요

- **소셜 로그인 앱 발급 상태**: 카카오(REST API 키만 필요, 이메일 동의 설정 권장), 구글(테스트 모드로 즉시 사용 가능), 네이버(앱 등록 후 개발 환경에서 5개 테스트 계정 무료)
- **약국 정보 수정 UI 범위**: 승인된 약국만 수정 가능 (`requireApprovedPharmacy` 미들웨어 적용) — 관리자 재승인 전에는 수정 불가하도록 UX 안내 문구 필요 여부 결정 필요
