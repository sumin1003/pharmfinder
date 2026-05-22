# PharmFinder — 작업 계획서

> 갱신일: 2026-05-22
> 기준: CLAUDE.md + 코드베이스 직접 분석 (SPEC.md 없음)

---

## 1. 구현 완료 기능

| 기능 | 백엔드 | 프론트 | 비고 |
|------|--------|--------|------|
| 일반 회원가입 | ✅ | ✅ | POST /api/auth/register, bcrypt 해싱 |
| 약국 사업자 회원가입 | ✅ | ✅ | POST /api/auth/pharmacy/register, pending→approved |
| 이메일 로그인 / 로그아웃 | ✅ | ✅ | JWT 발급, 클라이언트 측 삭제 |
| 카카오 OAuth 로그인 | ✅ | ✅ | passport-kakao, Kakao Client Secret 포함 |
| 구글 OAuth 로그인 | ✅ | ✅ | passport-google-oauth20 |
| 네이버 OAuth 로그인 | ✅ | ✅ | passport-naver |
| 소셜 신규 가입 완성 | ✅ | ✅ | pendingToken → SocialSignupPage → 계정 생성 |
| 소셜 로그인 배포 대응 | ✅ | ✅ | VITE_API_URL 동적화, FRONTEND_URL 기반 리디렉션 |
| 내 정보 조회 | ✅ | ✅ | GET /api/auth/me |
| 프로필 수정 | ✅ | ✅ | PUT /api/auth/profile, 약국 정보 동기화 포함 |
| 비밀번호 변경 (로그인 상태) | ✅ | ✅ | PUT /api/auth/password, ResetPasswordPage, ProfilePage 링크 연결 |
| 의약품 이름 검색 | ✅ | ✅ | DB 우선 → 식약처 API 폴백, 결과 캐싱 |
| 의약품 상세 조회 | ✅ | ✅ | MedicineDetailPage |
| AI 증상 기반 약품 추천 (RAG-lite) | ✅ | ✅ | Groq LLaMA-3.3-70b, DB 컨텍스트 주입, db_id 부착, INN 일반명 강제 |
| 약국 지도 — 카카오 로컬 API 실시간 | ✅ | ✅ | GET /api/pharmacies/public/nearby, PM9 카테고리, 3색 마커 |
| 공공약국 상세 페이지 | ✅ | ✅ | /pharmacies/public/:id, 비가입/가입 분기 |
| 가입 약국 상세 + 재고 | ✅ | ✅ | PharmacyDetailPage, 품절·부족 배지 |
| 영업시간 표시 + 영업 중/종료 배지 | ✅ | ✅ | isOpenNow() 유틸, PharmacyDetailPage + 지도 사이드바·팝업 |
| 공공데이터 약국 검색 | ✅ | ✅ | GET /api/pharmacies/public/search (연결 선택용) |
| 공공데이터 약국 동기화 (Admin) | ✅ | ✅ | POST /api/pharmacies/public/sync, HIRA API |
| 약국-공공데이터 자가 연결 | ✅ | ✅ | PUT /api/pharmacies/public/self/link, 약국 대시보드 |
| 재고 관리 (약국 대시보드) | ✅ | ✅ | 추가·수정·삭제, requireApprovedPharmacy 보호 |
| CSV 재고 일괄 업로드 | ✅ | ✅ | POST /api/pharmacies/inventory/csv, multer, 약품명 완전 일치 |
| 재고 부족 이메일 알림 | ✅ | ✅ | min_quantity 이하 시 Gmail SMTP, 일 1회 쿨다운 |
| 내 약국 정보 조회·수정 | ✅ | ✅ | 주소 변경 시 카카오 지오코딩 재적용 |
| 즐겨찾기 토글 / 목록 | ✅ | ✅ | FavoritesPage |
| 의약품 → 재고 약국 지도 이동 | ✅ | ✅ | MedicineDetailPage → /map?medicine=:id |
| Admin — 약국 승인·거절·재승인 | ✅ | ✅ | 거절 사유 입력, pending 복귀 지원 |
| Admin — 약국 관리 | ✅ | ✅ | 인라인 수정·삭제 |
| Admin — 회원 관리 | ✅ | ✅ | 페이지네이션, 역할 변경, 삭제 |
| Admin — 약품 관리 | ✅ | ✅ | CRUD, 페이지네이션 |
| Admin — 개요 통계 | ✅ | ✅ | OverviewPage, KPI 4종 |
| Admin — 공공약국 동기화 탭 | ✅ | ✅ | 시도/시군구 입력, 빠른 선택 버튼 |
| 약국 승인/거절 이메일 알림 | ✅ | N/A | notificationService.sendPharmacyStatusEmail, adminService 연동 |
| 공공약국 자동 주기 동기화 | ✅ | N/A | node-cron, 매일 UTC 18:00(KST 03:00), 5개 광역시 |
| 배포 환경 설정 | ✅ | ✅ | Render(백) + Vercel(프론트), CORS 설정 완료 |

---

## 2. 미구현 / Gap 기능

| 기능 | 백엔드 | 프론트 | 우선순위 | 설명 |
|------|--------|--------|----------|------|
| 비밀번호 찾기 (이메일 토큰) | ❌ | ❌ | **보류** | 이메일 토큰 기반 forgot-password — 의도적으로 제외 |
| 영업시간 표시 — 지도 팝업 | ✅ | ✅ | P2 | getNearbyPublicPharmacies에 pharmacies.business_hours 조인, 팝업·사이드바 배지 표시 |
| 영업 중 / 영업 종료 — 지도 배지 | ✅ | ✅ | P3 | 사이드바 목록·팝업에 영업 중/종료 배지 (가입 약국 한정) |
| Supabase RLS 적용 | ❌ | N/A | P3 | service_role 키로 RLS 우회 중 — 보안 정책 미적용 |
| CSV 재고 업로드 — 유사 검색 | ✅ | ✅ | P3 | bulkUpsertInventory ilike fallback, 프론트 fuzzy 경고 표시 |

---

## 3. 이번 대화 신규 요청 (완료)

| 요청 내용 | 상태 | 비고 |
|-----------|------|------|
| 약국 승인/거절 이메일 알림 | ✅ 완료 | notificationService + adminService 연동 |
| 공공약국 자동 주기 동기화 | ✅ 완료 | node-cron, server.js 등록 |
| 비밀번호 재설정 페이지 (로그인 상태) | ✅ 완료 | ResetPasswordPage.jsx + ProfilePage 링크 |
| 지도 영업시간 표시 | ✅ 완료 | publicPharmacyService에 business_hours 조인, 사이드바·팝업 배지 |
| CSV 재고 유사 검색 | ✅ 완료 | bulkUpsertInventory ilike fallback, fuzzy 카운트 반환 |
| AI 추천 RAG-lite | ✅ 완료 | fetchContextMedicines DB 컨텍스트 주입, attachDbIds, db_id 부착 |
| AI 추천 약품명 INN 강제 | ✅ 완료 | 시스템 프롬프트 규칙 6 추가, 이브프로펜→이부프로펜 교정 예시 포함 |
| 공공약국 상세 페이지 404 수정 | ✅ 완료 | React Router state로 데이터 전달, API 호출 제거 |
| 식약처 MFDS API URL 환경변수 제거 | ✅ 완료 | URL 코드 고정, URLSearchParams 인코딩 |

---

## 4. 우선순위별 작업 계획

### P1 — 즉시 필요 (없음)
> 현재 운영·데이터 누락 이슈 없음

### P2 — 중요 (핵심 UX·기능 완성도)
> 현재 완료 항목 없음

### P3 — 개선 (편의·polish)
- [ ] Supabase RLS 정책 적용 — service_role 의존 제거
- [ ] 영업 중/종료 지도 마커 색상 — 가입 약국 한정으로 부분 구현됨, 카카오 API 약국은 영업시간 정보 없음

---

## 5. 환경변수 현황

### Render (백엔드)
| 키 | 상태 | 비고 |
|----|------|------|
| NODE_ENV | ✅ | production |
| JWT_SECRET | ✅ | |
| SUPABASE_URL | ✅ | |
| SUPABASE_SERVICE_ROLE_KEY | ✅ | |
| GROQ_API_KEY | ✅ | |
| MFDS_API_KEY | ✅ | |
| KAKAO_REST_API_KEY | ✅ | |
| HIRA_API_KEY | ✅ | |
| KAKAO_CLIENT_ID | ✅ | |
| GOOGLE_CLIENT_ID | ✅ | |
| GOOGLE_CLIENT_SECRET | ✅ | |
| NAVER_CLIENT_ID | ✅ | |
| NAVER_CLIENT_SECRET | ✅ | |
| SESSION_SECRET | ✅ | |
| BACKEND_URL | ✅ | https://pharmfinder.onrender.com |
| FRONTEND_URL | ✅ | https://pharmfinder.vercel.app |
| EMAIL_USER | ⬜ | 선택 — 재고 부족·약국 승인 알림 이메일 발송자 |
| EMAIL_PASSWORD | ⬜ | 선택 — Gmail 앱 비밀번호 |

### Vercel (프론트엔드)
| 키 | 상태 | 비고 |
|----|------|------|
| VITE_KAKAO_MAP_APP_KEY | ✅ | |
| VITE_API_URL | ✅ | https://pharmfinder.onrender.com/api |

---

## 6. 보류 / 결정 필요

- **비밀번호 찾기**: nodemailer 직접 발송(이미 설치) vs Supabase Auth 이메일 활용 — 현재 보류 상태
- **소셜 계정 병합 정책**: 동일 이메일로 이메일 가입 후 소셜 로그인 시 현재 409 차단 — 병합 허용 여부
- **Supabase RLS 적용 범위**: service_role 키 유지 vs 테이블별 RLS 정책 적용
- **지도 팝업 영업시간**: 카카오 Local API에 없음 — 표시하지 않거나 HIRA 데이터와 조인 필요
