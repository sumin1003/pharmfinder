import axios from 'axios';

// baseURL /api로 설정된 Axios 인스턴스 — JWT 인터셉터 포함
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터 — 로컬스토리지의 JWT를 Authorization 헤더에 자동 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 응답 인터셉터 — 토큰 만료(401) 시 토큰 제거 후 로그인 페이지로 강제 이동
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // 토큰 만료 시에만 리다이렉트 (로그인 상태에서 토큰이 만료된 경우)
    if (err.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
