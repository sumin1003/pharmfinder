import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// 소셜 로그인 콜백 — 백엔드가 이미 httpOnly 쿠키로 인증을 발급했으므로 세션을 복원해 홈으로 이동
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { restoreSession } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pending = params.get('pending');
    if (pending) {
      const name = params.get('name') || '';
      const email = params.get('email') || '';
      navigate(`/social-signup?pending=${encodeURIComponent(pending)}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`, { replace: true });
      return;
    }

    const error = params.get('error');
    if (error) {
      navigate('/login?error=social_login_failed', { replace: true });
      return;
    }

    restoreSession()
      .then(() => navigate('/', { replace: true }))
      .catch(() => navigate('/login', { replace: true }));
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', color: '#94a3b8', fontSize: 15 }}>
      로그인 처리 중...
    </div>
  );
}
