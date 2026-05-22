# PharmFinder — 작업 계획서

> 갱신일: 2026-05-21
> 기준: CLAUDE.md + 코드베이스 직접 분석 (SPEC.md 없음)

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
| 약국 지도 — 공공데이터 전체 | ✅ | ✅ | GET /api/pharmacies/public/nearby, 3색 마커(녹/황/회) |
| 공공약국 상세 페이지 | ✅ | ✅ | /pharmacies/public/:id, 비가입/가입 분기 |
| 가입 약국 상세 + 재고 | ✅ | ✅ | PharmacyDetailPage, 품절·부족 배지 |
| 공공데이터 약국 검색 | ✅ | ✅ | GET /api/pharmacies/public/search (연결 선택용) |
| 공공데이터 약국 동기화 (Admin) | ✅ | ✅ | POST /api/pharmacies/public/sync, HIRA API |
| 약국-공공데이터 자가 연결 | ✅ | ✅ | 약국 대시보드 "지도 연결 설정" 섹션 |
| 재고 관리 (약국 대시보드) | ✅ | ✅ | 추가·수정·삭제, requireApprovedPharmacy 보호 |
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

## 2. 미완성 / Gap 기능

| 기능 | 백엔드 | 프론트 | 우선순위 | 설명 |
|------|--------|--------|----------|------|
| public_pharmacies DB 초기 적재 | N/A | N/A | **P1** | migration SQL 실행 + Admin 동기화 버튼으로 데이터 투입 필요 |
| HIRA_API_KEY 환경변수 | N/A | N/A | **P1** | .env 및 Render에 실제 키 입력 필요 |
| 배포 OAuth 콜백 URI 등록 | N/A | N/A | **P1** | 카카오·구글·네이버 콘솔에 onrender.com URI 추가 필요 |
| Vercel VITE_API_URL 설정 | N/A | N/A | **P1** | 미설정 시 소셜 로그인 프로덕션에서 실패 |
| JWT_SECRET / SESSION_SECRET 강화 | N/A | N/A | **P1** | 개발용 dev 값 → 랜덤 64자로 교체 필요 |
| Admin — 공공약국 수동 연결 UI | ✅ | ✅ | P2 | "공공약국 연결" 탭 추가 완료 |
| 약국 영업시간 표시 | ✅ | ❌ | P2 | business_hours 필드 있으나 지도·공공상세에 미표시 |
| 비밀번호 찾기 (이메일 재설정) | ❌ | ❌ | P2 | 이메일 발송 서비스 연동 필요 |
| 알림 시스템 | ❌ | ❌ | P3 | 약국 승인 결과·재고 부족 이메일/푸시 |
| CSV 재고 일괄 업로드 | ❌ | ❌ | P3 | 약국 대시보드 편의 기능 |
| 영업 중 / 영업 종료 실시간 배지 | ❌ | ❌ | P3 | 영업시간 파싱 + 현재 시각 비교 |
| 공공약국 자동 주기 동기화 | ❌ | ❌ | P3 | 현재 수동 방식 — 크론 자동화 미구현 |
| Supabase RLS 적용 | ❌ | N/A | P3 | service_role 키로 RLS 우회 중 — 보안 정책 미적용 |

---

## 3. 이번 대화 신규 요청

| 요청 내용 | 상태 | SDD 작성 여부 |
|-----------|------|---------------|
| 배포 환경 소셜 로그인 준비 (Render+Vercel) | 완료 | 있음 |
| 공공데이터 전체 약국 지도 + 가입 약국 재고 연동 | 완료 | 있음 |

---

## 4. 우선순위별 작업 계획

### P1 — 즉시 필요 (운영 불가 or 데이터 누락)
- [ ] Supabase SQL Editor에서 `supabase/migrations/add_public_pharmacies.sql` 실행
- [ ] `backend/.env`에 `HIRA_API_KEY` 실제 키 입력
- [ ] Admin 로그인 → "공공약국 동기화" 탭 → 지역별 초기 데이터 적재
- [ ] Render 환경변수: `HIRA_API_KEY`, `KAKAO_CLIENT_SECRET`, `NODE_ENV=production`, `JWT_SECRET`(강화), `SESSION_SECRET`(강화) 추가
- [ ] Vercel 환경변수: `VITE_API_URL=https://pharmfinder.onrender.com/api` 설정 후 Redeploy
- [ ] 카카오/구글/네이버 콘솔에 프로덕션 Callback URI 등록

### P2 — 중요 (핵심 UX 완성도)
- [x] Admin 대시보드에 공공약국 ↔ 가입약국 수동 연결 UI 추가 ✅ 완료
- [ ] 지도·공공약국 상세에 영업시간 표시
- [ ] 비밀번호 찾기 이메일 재설정 기능

### P3 — 개선 (편의·polish)
- [ ] 재고 부족 시 이메일 알림 발송
- [ ] CSV 파일 재고 일괄 업로드
- [ ] 영업시간 파싱 → "영업 중 / 영업 종료" 배지
- [ ] 공공데이터 야간 자동 동기화 (크론)
- [ ] Supabase Row Level Security 정책 적용

---

## 5. 보류 / 결정 필요

- **공공약국 자동 매칭**: 이름+주소 유사도로 자동 연결할지, 수동 연결만 지원할지
- **소셜 계정 병합 정책**: 동일 이메일로 이메일 가입 후 소셜 로그인 시 현재 409 차단 — 병합 허용 여부
- **비밀번호 찾기 구현 방식**: Supabase Auth 이메일 vs nodemailer 직접 발송
- **Supabase RLS 적용 범위**: service_role 키 유지 vs 테이블별 RLS 정책 적용
