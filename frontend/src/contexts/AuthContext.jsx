import { createContext, useContext, useState, useEffect } from 'react';
import api, { setHasActiveSession } from '../services/api';

const AuthContext = createContext(null);

// 인증 상태를 전역으로 제공하는 Context 프로바이더 — 앱 초기화 시 httpOnly 쿠키로 사용자 정보를 복원
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 비로그인 상태의 401은 정상 케이스이므로 조용히 넘김 (실패 전파는 restoreSession을 직접 호출하는 쪽의 책임)
    restoreSession().catch(() => {}).finally(() => setLoading(false));
  }, []);

  // 세션 복원 — 쿠키가 유효하면 /auth/me로 사용자 정보를 조회해 상태 갱신 (앱 로드·소셜 로그인 콜백 시 사용)
  const restoreSession = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      setHasActiveSession(true);
      return res.data;
    } catch (err) {
      setUser(null);
      setHasActiveSession(false);
      throw err;
    }
  };

  // 로그인 — 서버가 httpOnly 쿠키로 JWT를 발급하고, 응답의 user로 상태를 갱신한 뒤 user 객체 반환
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.user);
    setHasActiveSession(true);
    return res.data.user;
  };

  // 로그아웃 — 서버에 쿠키 삭제를 요청하고 user 상태를 초기화
  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    setHasActiveSession(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, restoreSession, logout, updateUser: setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
