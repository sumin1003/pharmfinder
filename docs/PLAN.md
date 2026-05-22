# PharmFinder — 작업 계획서

> 갱신일: 2026-05-22
> 기준: CLAUDE.md + 코드베이스 직접 분석

---

## 1. 구현 완료 기능

| 기능 | 백엔드 | 프론트 | 비고 |
|------|--------|--------|------|
| 일반 회원가입 | ✅ | ✅ | POST /api/auth/register, bcrypt 해싱 |
| 약국 사업자 회원가입 | ✅ | ✅ | POST /api/auth/pharmacy/register, pending→approved |
| 이메일 로그인 / 로그아웃 | ✅ | ✅ | JWT 발급, 클라이언트 측 삭제 |
| 카카오 OAuth 로그인 | ✅ | ✅ | Kakao Client Secret 설정 포함 |
| 구글 OAuth 로그인 | ✅ | ✅ | passport-google-oauth20 |
| 네이버 OAuth 로그인 | ✅ | ✅ | passport-naver |
| 소셜 신규 가입 완성 | ✅ | ✅ | pendingToken → SocialSignupPage → 계정 생성 |
| 소셜 로그인 배포 대응 | ✅ | ✅ | VITE_API_URL 동적화, LoginPage href 수정 |
| 내 정보 조회 | ✅ | ✅ | GET /api/auth/me |
| 프로필 수정 | ✅ | ✅ | PUT /api/auth/profile, 약국 정보 동기화 포함 |
| 비밀번호 변경 | ✅ | ✅ | PUT /api/auth/password, 소셜 계정 차단, JWT 유지 |
| 의약품 이름 검색 | ✅ | ✅ | DB 우선 → 식약처 API 폴백, 결과 캐싱 |
| 의약품 상세 조회 | ✅ | ✅ | MedicineDetailPage |
| AI 증상 기반 약품 추천 | ✅ | ✅ | Groq LLaMA-3.3-70b, POST /api/medicines/recommend |
| 약국 지도 — 카카오 로컬 API 실시간 | ✅ | ✅ | GET /api/pharmacies/public/nearby, 카카오 PM9 카테고리, 3색 마커 |
| 공공약국 상세 페이지 | ✅ | ✅ | /pharmacies/public/:id, 비가입/가입 분기 |
| 가입 약국 상세 + 재고 | ✅ | ✅ | PharmacyDetailPage, 품절·부족 배지 |
| 영업시간 표시 + 영업 중/종료 배지 | ✅ | ✅ | isOpenNow() 유틸, PharmacyDetailPage |
| 공공데이터 약국 검색 | ✅ | ✅ | GET /api/pharmacies/public/search (연결 선택용) |
| 공공데이터 약국 동기화 (Admin) | ✅ | ✅ | POST /api/pharmacies/public/sync, HIRA API |
| 약국-공공데이터 자가 연결 | ✅ | ✅ | 약국 대시보드 "지도 연결 설정" 섹션 |
| 재고 관리 (약국 대시보드) | ✅ | ✅ | 추가·수정·삭제, requireApprovedPharmacy 보호 |
| CSV 재고 일괄 업로드 | ✅ | ✅ | POST /api/pharmacies/inventory/csv, multer, 약품명 완전 일치 |
| 재고 부족 이메일 알림 | ✅ | ✅ | min_quantity 이하 시 Gmail SMTP 발송, 일 1회 쿨다운 |
| 내 약국 정보 조회·수정 | ✅ | ✅ | 주소 변경 시 카카오 지오코딩 재적용 |
| 즐겨찾기 토글 / 목록 | ✅ | ✅ | FavoritesPage |
| 의약품 → 재고 약국 지도 이동 | ✅ | ✅ | MedicineDetailPage → /map?medicine=:id |
| Admin — 약국 승인·거절·재승인 | ✅ | ✅ | 거절 사유 입력, pending 복귀 지원 |
| Admin — 약국 관리 | ✅ | ✅ | 인라인 수정·삭제 |
| Admin — 회원 관리 | ✅ | ✅ | 페이지네이션, 역할 변경, 삭제 |
| Admin — 약품 관리 | ✅ | ✅ | CRUD, 페이지네이션 |
| Admin — 개요 통계 | ✅ | ✅ | OverviewPage, KPI 4종 |
| Admin — 공공약국 동기화 탭 | ✅ | ✅ | 시도/시군구 입력, 빠른 선택 버튼 |
| 배포 환경 설정 | ✅ | ✅ | Render(백) + Vercel(프론트), CORS 설정 완료 |

---

## 2. 미구현 / 추후 해야 할 일

| 기능 | 백엔드 | 프론트 | 우선순위 | 설명 |
|------|--------|--------|----------|------|
| 비밀번호 찾기 (이메일 재설정) | ❌ | ❌ | **P2** | 이메일 발송 서비스 연동 필요 (nodemailer 이미 설치됨) |
| 영업시간 표시 — 지도 팝업 | ✅ | ❌ | P2 | PharmacyDetailPage는 완료, 지도 팝업은 카카오 데이터에 업시간 없어 미적용 |
| 알림 시스템 — 약국 승인 결과 | ❌ | ❌ | P3 | 승인/거절 시 약국 담당자 이메일 발송 |
| 영업 중 / 영업 종료 — 지도 마커 | ❌ | ❌ | P3 | 카카오 API 응답에 영업시간 없음 — 별도 수집 필요 |
| 공공약국 자동 주기 동기화 | ❌ | ❌ | P3 | 현재 수동 방식 — 크론 자동화 미구현 |
| Supabase RLS 적용 | ❌ | N/A | P3 | service_role 키로 RLS 우회 중 — 보안 정책 미적용 |
| CSV 재고 업로드 — 유사 검색 | ❌ | ❌ | P3 | 현재 완전 일치만 지원 — ilike 유사 검색 옵션 추가 가능 |

---

## 3. 환경변수 설정 현황

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
| EMAIL_USER | ⬜ | 선택 — 재고 부족 알림 이메일 발송자 |
| EMAIL_PASSWORD | ⬜ | 선택 — Gmail 앱 비밀번호 |

### Vercel (프론트엔드)
| 키 | 상태 | 비고 |
|----|------|------|
| VITE_KAKAO_MAP_APP_KEY | ✅ | |
| VITE_API_URL | ✅ | https://pharmfinder.onrender.com/api |

---

## 4. 보류 / 결정 필요

- **비밀번호 찾기 구현 방식**: nodemailer 직접 발송(이미 설치) vs Supabase Auth 이메일 활용
- **소셜 계정 병합 정책**: 동일 이메일로 이메일 가입 후 소셜 로그인 시 현재 409 차단 — 병합 허용 여부
- **Supabase RLS 적용 범위**: service_role 키 유지 vs 테이블별 RLS 정책 적용
