# PharmFinder — 작업 계획서

> 최초 생성: 2026-05-19  
> 최종 업데이트: 2026-05-19  
> 기준: SPEC.md 없음 — CLAUDE.md + 코드베이스 직접 분석

---

## 1. 구현 완료 기능

| 기능 | 백엔드 | 프론트 | 비고 |
|------|--------|--------|------|
| 일반 회원가입 | ✅ | ✅ | `POST /api/auth/register` → `RegisterPage` |
| 약국 사업자 회원가입 | ✅ | ✅ | `POST /api/auth/pharmacy/register` → `PharmacyRegisterPage` |
| 이메일 로그인 / 로그아웃 | ✅ | ✅ | JWT, AuthContext, localStorage |
| 소셜 로그인 코드 완성 | ✅ | ✅ | passport.js 조건부 전략 등록, Supabase 마이그레이션 실행 완료 — OAuth 앱 등록 미완료 |
| 내 정보 조회 | ✅ | ✅ | `GET /api/auth/me` → AuthContext 초기화 |
| 약품 검색 | ✅ | ✅ | `GET /api/medicines/search` → `MedicineSearchPage` |
| 약품 상세 조회 | ✅ | ✅ | `GET /api/medicines/:id` → `MedicineDetailPage` |
| AI 증상 기반 의약품 추천 | ✅ | ✅ | `POST /api/medicines/recommend` → `HomePage` 검색 창 |
| 약국 지도 (카카오맵) | ✅ | ✅ | `GET /api/pharmacies/nearby` → `PharmacyMapPage` — 카카오맵 키 설정 미완료 |
| 약국 상세 조회 | ✅ | ✅ | `GET /api/pharmacies/:id` → `PharmacyDetailPage` |
| 약국 즐겨찾기 토글 | ✅ | ✅ | `POST /api/pharmacies/:id/favorite` → `PharmacyDetailPage` 버튼 |
| 약국 재고 조회 (공개) | ✅ | ✅ | `GET /api/pharmacies/:id/inventory` → `PharmacyDetailPage` |
| 즐겨찾기 목록 페이지 | ✅ | ✅ | `GET /api/pharmacies/my/favorites` → `FavoritesPage` |
| 약국 대시보드 — 재고 CRUD | ✅ | ✅ | `POST/PUT/DELETE /api/pharmacies/inventory` |
| 약국 내 정보 자체 수정 | ✅ | ✅ | `PUT /api/pharmacies/my/info` → `PharmacyDashboard` 인라인 폼 |
| 관리자 — 약국 승인/거절/재승인/삭제 | ✅ | ✅ | 거절 사유, 재고 참조 시 409 차단 |
| 관리자 — 약국 정보 수정 | ✅ | ✅ | 주소 변경 시 재지오코딩 |
| 관리자 — 회원 목록/삭제/역할 변경 | ✅ | ✅ | 페이지네이션, 역할 필터 |
| 관리자 — 약품 CRUD | ✅ | ✅ | `GET/POST/PUT/DELETE /api/admin/medicines` |
| 관리자 — 전체현황 KPI·차트 | ✅ | ✅ | `GET /api/admin/overview` → `OverviewPage` (recharts) |
| AI 추천 UX 개선 | - | ✅ | "종류 보기 →" 버튼, `MedicineDetailPage` 약국 찾기 버튼 |
| **GitHub 초기 푸시** | - | - | https://github.com/sumin1003/pharmfinder.git (master) |
| **Render 배포 (백엔드)** | ✅ | - | https://pharmfinder.onrender.com — render.yaml 작성 완료 |
| **Vercel 배포 (프론트엔드)** | - | ✅ | https://pharmfinder.vercel.app — vercel.json SPA 라우팅 설정 완료 |
| **CORS 프로덕션 설정** | ✅ | - | `trust proxy 1`, `pharmfinder.vercel.app` 하드코딩, FRONTEND_URL 추가 지원 |
| **VITE_API_URL 프로덕션 연결** | - | ✅ | Vercel 환경변수에 `https://pharmfinder.onrender.com/api` 설정 |
| **package-lock.json gitignore** | - | - | `.gitignore` 추가 + `git rm --cached` 완료 |
| **vercel.json SPA 라우팅** | - | ✅ | 직접 URL 접근 시 404 방지 (`rewrites: [{ source: "/(.*)", destination: "/index.html" }]`) |
| **Supabase OAuth 마이그레이션** | ✅ | - | `users` 테이블에 `provider`, `provider_id` 컬럼 추가 완료 |

---

## 2. 미완성 / Gap 기능

| 기능 | 백엔드 | 프론트 | 우선순위 | 설명 |
|------|--------|--------|----------|------|
| 카카오맵 API 키 설정 | - | ❌ | P1 | `VITE_KAKAO_MAP_APP_KEY` Vercel 환경변수 — JavaScript 키 값 확인 필요. 현재 401 Unauthorized 반환 중 |
| 카카오 OAuth 앱 등록 | ❌ | - | P2 | 카카오 개발자 콘솔에서 리다이렉트 URI 등록 + 카카오 로그인 활성화 |
| 구글 OAuth 앱 등록 | ❌ | - | P2 | Google Cloud Console에서 OAuth 앱 생성 + `.env` 키 설정 |
| 네이버 OAuth 앱 등록 | ❌ | - | P2 | 네이버 개발자 센터에서 앱 등록 + `.env` 키 설정 |

---

## 3. 이번 대화 신규 요청 및 완료 작업

| 요청 내용 | 상태 | 비고 |
|-----------|------|------|
| 약국 내 정보 자체 수정 (P2 Gap) | 완료 | `PUT /api/pharmacies/my/info` + DashboardPage 인라인 폼 |
| GitHub 초기 푸시 | 완료 | master 브랜치 |
| Render 배포 준비 | 완료 | render.yaml 생성 |
| Vercel + Render 연결 확인 | 완료 | VITE_API_URL 설정, CORS 수정 |
| OAuth passport.js 크래시 수정 | 완료 | 조건부 전략 등록 (env 미설정 시 경고만 출력) |
| package-lock.json gitignore | 완료 | .gitignore 추가 + git rm --cached |
| vercel.json SPA 라우팅 | 완료 | /map 직접 접근 404 수정 |
| 카카오맵 401 오류 | **진행 중** | VITE_KAKAO_MAP_APP_KEY JavaScript 키 확인 필요 — 내일 진행 |

---

## 4. 우선순위별 작업 계획

### P1 — 즉시 필요 (운영 불가)

- [ ] 카카오맵 API 키 수정 — Vercel `VITE_KAKAO_MAP_APP_KEY`에 **JavaScript 키** 값이 정확히 설정됐는지 확인 후 Redeploy

### P2 — 중요 (핵심 UX 완성도)

- [ ] 카카오 OAuth 앱 등록 — 카카오 개발자 콘솔에서 리다이렉트 URI `https://pharmfinder.onrender.com/api/auth/kakao/callback` 등록
- [ ] 구글 OAuth 앱 등록 — Google Cloud Console OAuth 2.0 클라이언트 생성
- [ ] 네이버 OAuth 앱 등록 — 네이버 개발자 센터 앱 등록

### P3 — 개선 (편의·polish)

- [ ] 카카오 Web 플랫폼에 `http://localhost:5173` 도메인 추가 (개발 환경 테스트용)

---

## 5. 보류 / 결정 필요

- **카카오맵 JavaScript 키**: `a75063199fbd759372bd0808eb9eeeff` 값이 실제 JavaScript 키인지 재확인 필요 — 카카오 콘솔 앱 키 탭에서 JavaScript 키 칸 값과 대조
- **OAuth 앱 등록 범위**: 카카오·구글·네이버 모두 등록할지, 카카오만 우선 처리할지 결정 필요
