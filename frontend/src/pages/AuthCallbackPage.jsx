import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// 소셜 로그인 콜백 — 백엔드 리다이렉트에서 token 파라미터를 추출해 AuthContext에 저장 후 홈 이동
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pending = params.get('pending');
    if (pending) {
      const name = params.get('name') || '';
      const email = params.get('email') || '';
      navigate(`/social-signup?pending=${encodeURIComponent(pending)}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`, { replace: true });
      return;
    }

    const token = params.get('token');
    const error = params.get('error');

    if (error || !token) {
      navigate('/login?error=social_login_failed', { replace: true });
      return;
    }

    loginWithToken(token)
      .then(() => navigate('/', { replace: true }))
      .catch(() => navigate('/login', { replace: true }));
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', color: '#94a3b8', fontSize: 15 }}>
      로그인 처리 중...
    </div>
  );
}
