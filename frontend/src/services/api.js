import axios from 'axios';

// 개발: Vite 프록시(/api → localhost:3000), 프로덕션: VITE_API_URL 직접 호출
// withCredentials: httpOnly 인증 쿠키를 요청에 자동 포함
// X-Requested-With: 서버의 CSRF 커스텀 헤더 검증 통과용 (쿠키는 브라우저가 자동 전송하므로 필요)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
  withCredentials: true,
});

// httpOnly 쿠키는 JS로 읽을 수 없으므로, 로그인 세션이 확인된 적 있는지를 AuthContext가 갱신하는 플래그로 추적
// (비로그인 방문자의 최초 /auth/me 401까지 로그인 페이지로 튕기는 것을 방지)
let hasActiveSession = false;
export const setHasActiveSession = (value) => { hasActiveSession = value; };

// 응답 인터셉터 — 로그인 상태에서 인증 쿠키가 만료(401)된 경우에만 로그인 페이지로 강제 이동
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && hasActiveSession) {
      hasActiveSession = false;
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
