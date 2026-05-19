import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// 인증·역할 기반 접근 제어 — 미로그인 시 /login, 역할 불일치 시 /로 리다이렉트
export default function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex justify-center items-center min-h-screen">로딩 중...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}
