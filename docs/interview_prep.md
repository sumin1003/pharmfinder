# PharmFinder 기술 면접 답변 가이드

> 기준: 실제 구현 코드 분석 (2026-06-10)

---

## 1. 프로젝트 개요

**Q. 이 프로젝트를 간단히 소개해주세요.**

PharmFinder는 사용자가 특정 의약품을 찾을 때 어느 약국에 재고가 있는지 실시간으로 확인할 수 있는 플랫폼입니다. 세 가지 사용자 역할(일반 사용자, 약국 관리자, 슈퍼 관리자)을 기반으로, 의약품 검색·AI 증상 추천·카카오 지도 기반 약국 찾기·재고 관리까지 제공합니다. 백엔드는 Node.js/Express, 프론트엔드는 React/Vite, DB는 Supabase(PostgreSQL)로 구성하고 Render와 Vercel에 배포했습니다.

---

**Q. 이 프로젝트에서 가장 어려웠던 점은 무엇인가요?**

세 가지를 꼽겠습니다.

1. **소셜 로그인 흐름**: OAuth 콜백 후 신규 사용자인 경우 바로 계정을 생성하지 않고 `pendingToken`(10분 유효 JWT)을 발급해 프론트엔드로 보낸 뒤, 사용자가 이름·이메일을 확인하고 완성 요청을 보내면 그때 계정을 생성하는 2단계 흐름을 설계해야 했습니다.

2. **공공데이터와 가입 약국의 연결**: HIRA 공공약국 데이터와 자체 가입 약국은 별개 테이블로 존재합니다. 약국이 직접 공공데이터 레코드를 자기 계정에 연결(`linked_pharmacy_id`)하는 자가 연결 기능을 설계해 두 데이터를 이어붙였습니다.

3. **식약처 API 응답 불일치 처리**: 공공 API가 오류 시 JSON 대신 XML을 반환하거나 응답 래퍼 구조가 일정하지 않아, 응답 파싱 전 타입 체크와 이중 래퍼(`response.data?.response?.body ?? response.data?.body`) 대응 로직을 추가했습니다.

---

## 2. 기술 스택 선택 이유

**Q. 백엔드에 Express를 선택한 이유는 무엇인가요?**

Express는 미들웨어 체인 구조가 이 프로젝트의 인증·인가 흐름(`authenticate → authorize → requireApprovedPharmacy`)과 잘 맞았고, CommonJS 환경에서 빠르게 프로토타이핑하기 좋았습니다. NestJS 같은 풀프레임워크는 이 규모에서 오버엔지니어링이라 판단했습니다.

---

**Q. DB로 Supabase를 선택한 이유는?**

PostgreSQL 기반이라 관계형 데이터 모델링이 가능하면서도, 별도 서버 없이 클라우드 호스팅을 제공합니다. 또한 JavaScript SDK(`@supabase/supabase-js`)가 직관적이고, 필요 시 RLS(Row Level Security) 적용도 가능해 보안 확장성이 있습니다. 현재는 `service_role` 키로 서버 사이드에서만 쿼리하므로 RLS는 미적용 상태입니다.

---

**Q. AI 추천에 Groq + LLaMA를 사용한 이유는?**

Groq은 LLaMA 3.3 70B 모델을 무료 티어에서도 매우 빠른 추론 속도로 제공합니다. GPT-4와 비교했을 때 비용 부담이 없고, 한국어 의학 컨텍스트 처리 성능도 충분했습니다. `temperature: 0.2`로 낮게 설정해 일관된 의약품 추천 결과를 유지했습니다.

---

**Q. 프론트엔드에 Vite + TailwindCSS를 선택한 이유는?**

Vite는 HMR(Hot Module Replacement) 속도가 빠르고 번들 크기 최적화도 용이합니다. TailwindCSS 4는 별도 CSS 파일 없이 컴포넌트 단위로 스타일을 관리할 수 있어 React의 컴포넌트 기반 구조와 잘 맞습니다.

---

## 3. 아키텍처 및 설계

**Q. 백엔드 아키텍처를 설명해주세요.**

3계층 구조로 분리했습니다.

- **Controller**: `req`/`res` 처리만 담당. 비즈니스 로직은 없고, `try/catch`로 에러를 잡아 `next(err)`로 전역 에러 핸들러에 위임합니다.
- **Service**: 비즈니스 로직과 Supabase 쿼리를 담당합니다. 에러는 `Object.assign(new Error('메시지'), { status: 코드 })` 형태로 throw해 HTTP 상태코드를 함께 전달합니다.
- **Route**: 미들웨어 체인을 조립하는 역할만 합니다. `authenticate → authorize → controller` 순서를 일관되게 유지합니다.

---

**Q. 인증/인가는 어떻게 구현했나요?**

JWT 기반입니다. 로그인 시 `id`, `email`, `role`을 페이로드에 담아 서명된 토큰을 발급하고, 클라이언트는 이후 모든 요청에 `Authorization: Bearer <token>` 헤더를 포함합니다.

미들웨어는 3가지입니다.

```
authenticate            — Bearer 토큰 검증 후 req.user에 페이로드 주입
authorize(...roles)     — req.user.role이 허용 역할에 포함되는지 확인
requireApprovedPharmacy — pharmacies 테이블 조회로 status: 'approved' 확인 후 req.pharmacy 주입
```

비밀번호는 `bcryptjs`로 `saltRounds: 10`을 적용해 해싱합니다.

---

**Q. 소셜 로그인 흐름을 설명해주세요.**

Passport.js로 카카오·구글·네이버 OAuth를 처리합니다. 콜백에서 두 가지 경우를 분기합니다.

- **기존 사용자**: `provider` + `provider_id`로 DB 조회 성공 → 바로 JWT 발급 후 프론트로 리다이렉트
- **신규 사용자**: DB에 생성하지 않고 `pendingToken`(10분 유효 JWT, `type: 'social_pending'`)만 발급 → 프론트 `SocialSignupPage`로 리다이렉트 → 사용자가 이름·이메일 확인 후 `/api/auth/social/complete` 호출 → 그때 DB에 계정 생성

이 설계로 OAuth 콜백에서 불완전한 계정이 생성되는 것을 방지했습니다.

---

**Q. 역할 기반 접근 제어(RBAC)는 어떻게 구현했나요?**

세 가지 역할(`user`, `pharmacy`, `admin`)을 JWT 페이로드에 포함시킵니다. 라우트에서 `authorize('admin')` 같은 미들웨어로 접근을 제한하고, 약국 전용 기능은 `requireApprovedPharmacy`로 `pending`/`rejected` 상태를 추가로 차단합니다. 프론트엔드에서도 `PrivateRoute` 컴포넌트가 `roles` prop으로 접근 제어를 이중으로 수행합니다.

---

## 4. 핵심 기능 구현

**Q. 의약품 검색은 어떻게 동작하나요?**

DB 우선 검색 후 폴백 전략을 사용합니다.

1. Supabase `medicines` 테이블에서 `ilike`로 약품명 검색
2. 결과가 있으면 바로 반환 (외부 API 호출 없음)
3. 결과가 없으면 식약처(MFDS) 외부 API 호출
4. 외부 API 결과를 `item_seq` 기준으로 DB에 `upsert` 캐싱
5. 다음 동일 검색 시 DB에서 바로 반환

이 구조로 외부 API 호출 횟수를 최소화하고 응답 속도를 개선했습니다.

---

**Q. AI 증상 추천 기능은 어떻게 구현했나요? RAG-lite가 무엇인가요?**

일반적인 RAG(Retrieval-Augmented Generation)는 벡터 DB를 사용하지만, 이 프로젝트는 벡터 DB 없이 간소화된 방식을 사용했습니다.

1. 사용자 증상 키워드로 `medicines` 테이블에서 관련 약품 최대 30개를 `ilike`로 조회
2. 조회된 약품 목록을 시스템 프롬프트에 컨텍스트로 주입
3. Groq LLaMA-3.3-70b가 컨텍스트를 참고해 실제 DB에 등록된 약품을 우선 추천
4. 응답 약품명에 DB `id`를 부착(`attachDbIds`)해 프론트에서 상세 페이지로 바로 연결

추가로 LLM이 상품명(타이레놀, 이브프로펜) 대신 INN 일반명(아세트아미노펜, 이부프로펜)만 사용하도록 시스템 프롬프트 규칙을 명시해 DB 매칭 정확도를 높였습니다.

---

**Q. 약국 지도 기능은 어떻게 구현했나요?**

두 가지 데이터 소스를 사용합니다.

- **카카오 로컬 API**: 실시간 주변 약국 검색 (카테고리 `PM9`). 비가입 약국 포함 전체 약국 표시용
- **자체 DB**: 가입·승인된 약국의 재고 정보, 영업시간, 상세 정보

거리 계산은 **Haversine 공식**으로 서버 사이드에서 수행합니다. 지구를 구체로 가정해 위경도 좌표 간 실제 거리를 계산하는 공식으로, 단순 유클리드 거리보다 정확합니다. 마커는 가입 약국 여부, 재고 보유 여부에 따라 3가지 색상으로 구분합니다.

---

**Q. CSV 재고 일괄 업로드는 어떻게 처리했나요?**

`multer`로 파일을 메모리 버퍼로 받아 파싱합니다. 약품명 매칭은 두 단계로 진행합니다.

1. **정확한 일치(`eq`)**: 먼저 약품명 완전 일치로 DB에서 찾음
2. **유사 검색(`ilike`) 폴백**: 정확한 일치 실패 시 부분 일치로 재시도

유사 매칭으로 처리된 항목은 `fuzzyCount`로 집계해 프론트에 경고를 표시합니다. 이로써 "타이레놀500mg"처럼 용량이 붙어 있거나 띄어쓰기가 다른 경우도 어느 정도 처리합니다.

---

**Q. 재고 부족 이메일 알림은 어떻게 구현했나요?**

`nodemailer`로 Gmail SMTP를 이용합니다. 알림 중복 방지를 위해 `inventory_alerts` 테이블에 `(pharmacy_id, medicine_id, alert_date)` 조합을 유니크 키로 설정해, 같은 날 같은 약품에 대해서는 알림을 한 번만 발송합니다. 재고 업데이트가 발생할 때마다 `min_quantity` 이하인 항목을 확인하고, 쿨다운이 지나지 않은 항목은 건너뜁니다.

---

**Q. 공공약국 자동 동기화는 어떻게 구현했나요?**

`node-cron`으로 매일 UTC 18:00(KST 03:00)에 HIRA(건강보험심사평가원) 공공데이터 API를 호출해 서울·경기·부산·인천·대구 5개 광역시 약국 데이터를 `public_pharmacies` 테이블에 `upsert`합니다. `hpid`(고유 식별자)를 기준으로 upsert하므로 중복 없이 최신 데이터를 유지합니다. 각 지역별로 독립적으로 실행하고 개별 에러를 catch해 한 지역 실패가 전체를 막지 않도록 처리했습니다.

---

## 5. 보안

**Q. 보안을 위해 어떤 조치를 취했나요?**

- **Helmet**: HTTP 보안 헤더 자동 설정 (XSS 방어, Clickjacking 방지 등)
- **CORS**: 허용 오리진을 `FRONTEND_URL` 환경변수와 하드코딩된 프로덕션 URL로만 제한
- **bcryptjs**: 비밀번호 단방향 해싱 (`saltRounds: 10`)
- **JWT**: 서버 사이드에서 `JWT_SECRET`으로 서명 검증, 만료 시간(`JWT_EXPIRES_IN`) 설정
- **환경변수 분리**: 모든 시크릿은 `.env`에만 존재하고 `.gitignore`에 포함, 코드에 하드코딩 없음
- **응답에서 비밀번호 제거**: 로그인 응답 시 `const { password: _, ...safeUser } = user`로 password 필드를 제거하고 반환

---

**Q. CORS 설정은 어떻게 했나요?**

`app.js`에서 허용 오리진을 `Set`으로 관리합니다. 프로덕션 Vercel URL을 코드에 고정하고, 추가 오리진은 `FRONTEND_URL` 환경변수로 쉼표 구분 입력을 지원합니다. `origin` 콜백에서 `!origin`(서버 간 요청)도 허용해 Render 내부 요청이 차단되지 않도록 했습니다.

---

## 6. 데이터베이스 설계

**Q. DB 테이블 구조를 설명해주세요.**

주요 테이블은 다음과 같습니다.

| 테이블 | 역할 |
|--------|------|
| `users` | 회원 정보 (`role`, `provider`, `provider_id` 포함) |
| `pharmacies` | 가입 약국 정보 (`status`: pending/approved/rejected, 좌표 포함) |
| `medicines` | 의약품 정보 (식약처 데이터 캐시, `item_seq` 유니크) |
| `pharmacy_inventory` | 약국별 재고 (`pharmacy_id`, `medicine_id`, `quantity`, `min_quantity`) |
| `public_pharmacies` | HIRA 공공약국 캐시 (`hpid` 유니크, `linked_pharmacy_id`로 가입 약국 연결) |
| `inventory_alerts` | 재고 알림 쿨다운 (`pharmacy_id + medicine_id + alert_date` 유니크) |
| `favorites` | 즐겨찾기 (`user_id + pharmacy_id` 유니크) |

---

**Q. `public_pharmacies`와 `pharmacies` 테이블을 분리한 이유는?**

두 데이터의 성격이 다르기 때문입니다. `public_pharmacies`는 HIRA API에서 주기적으로 동기화되는 외부 데이터고, `pharmacies`는 서비스에 직접 가입해 재고를 관리하는 사업자 데이터입니다. 분리하면 공공데이터 동기화 시 가입 약국 데이터를 덮어쓸 위험이 없고, `linked_pharmacy_id` 외래키로 두 테이블을 느슨하게 연결할 수 있습니다.

---

## 7. 배포 및 운영

**Q. 배포 구성을 설명해주세요.**

- **백엔드**: Render Web Service — Node.js 런타임, `render.yaml`로 환경변수 구조를 코드로 관리. 민감한 값(`JWT_SECRET`, API 키 등)은 `sync: false`로 대시보드에서만 입력
- **프론트엔드**: Vercel — GitHub 연동 자동 배포. `vercel.json`으로 SPA 라우팅(`/*` → `index.html`) 처리
- **프록시**: 개발 환경에서 Vite의 `proxy` 설정으로 `/api` 요청을 백엔드 포트로 포워딩. 프로덕션에서는 `VITE_API_URL`로 백엔드 URL을 직접 지정

---

**Q. 개발 환경과 프로덕션 환경의 차이는 어떻게 처리했나요?**

- CORS: `FRONTEND_URL` 환경변수로 오리진 추가 허용
- 세션 쿠키: `NODE_ENV === 'production'`일 때만 `secure: true` 설정 (HTTPS 전용)
- 리버스 프록시: Render가 HTTPS를 처리하므로 `app.set('trust proxy', 1)`로 실제 IP·프로토콜을 올바르게 인식
- 소셜 OAuth 콜백 URL: `BACKEND_URL` 환경변수 기반으로 동적 생성해 로컬/배포 환경 모두 동작

---

## 8. 추가 질문 대비

**Q. 현재 프로젝트에서 개선하고 싶은 부분이 있나요?**

세 가지입니다.

1. **Supabase RLS 미적용**: 현재 `service_role` 키로 RLS를 우회하고 있습니다. 테이블별 Row Level Security 정책을 적용해 서버 사이드 권한 검사가 DB 레벨에서도 이중으로 보호되도록 개선하고 싶습니다.

2. **약국 지도 위치 기반 쿼리**: 현재 서버에서 전체 약국을 가져와 Haversine으로 필터링합니다. 약국 수가 늘어나면 비효율적이므로, PostgreSQL의 PostGIS 확장이나 위경도 범위 쿼리로 DB 레벨에서 필터링하는 방식으로 개선이 필요합니다.

3. **비밀번호 찾기 미구현**: `nodemailer`는 이미 설치되어 있어 이메일 토큰 기반 비밀번호 재설정을 구현하는 것은 어렵지 않지만 현재 보류 상태입니다.

---

**Q. 테스트는 어떻게 했나요?**

별도의 자동화 테스트 코드는 작성하지 않았고, Postman으로 API 엔드포인트를 수동 테스트하고, 브라우저에서 시나리오별로 직접 검증했습니다. 개선점으로는 Jest + Supertest로 서비스 레이어 단위 테스트와 API 통합 테스트를 추가하고 싶습니다.

---

**Q. 약국 승인 절차가 왜 필요한가요?**

약국 관리자는 실제 재고 데이터를 올리는 신뢰 행위자이므로, 아무나 가입해 잘못된 재고 정보를 올리는 것을 방지하기 위해 관리자 승인 단계를 뒀습니다. 약국 계정은 `status: pending`으로 가입하고, 관리자가 승인(`approved`)하기 전까지는 재고 관리 API(`requireApprovedPharmacy`)에 접근할 수 없습니다.

---

**Q. JWT를 서버에서 무효화하려면 어떻게 해야 하나요? 현재 구현의 한계는?**

현재는 클라이언트 측에서 토큰을 삭제하는 방식으로만 로그아웃을 처리합니다. 서버는 상태를 저장하지 않아, 발급된 토큰은 만료 시간(`7d`)까지 기술적으로 유효합니다. 개선 방법으로는 Redis에 블랙리스트를 관리하거나, 단기 액세스 토큰 + 리프레시 토큰 구조로 전환하는 방법이 있습니다.
