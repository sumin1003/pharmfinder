import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// 인증 상태를 전역으로 제공하는 Context 프로바이더 — 앱 초기화 시 로컬 토큰으로 사용자 정보를 복원
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // 토큰이 있을 때만 true로 초기화 → useEffect 내 동기 setState 불필요
  const [loading, setLoading] = useState(() => !!localStorage.getItem('token'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    }
  }, []);

  // 로그인 — JWT를 로컬스토리지에 저장하고 user 상태를 갱신한 뒤 user 객체 반환
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  // 소셜 로그인 콜백 — 이미 발급된 JWT를 저장하고 사용자 정보를 조회해 상태 갱신
  const loginWithToken = async (token) => {
    localStorage.setItem('token', token);
    const res = await api.get('/auth/me');
    setUser(res.data);
    return res.data;
  };

  // 로그아웃 — 로컬스토리지의 토큰을 제거하고 user 상태를 초기화
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
