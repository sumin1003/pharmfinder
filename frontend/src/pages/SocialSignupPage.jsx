import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// 소셜 신규 가입 완성 페이지 — 소셜 로그인으로 처음 방문한 사용자가 이름·이메일을 확인하고 계정을 생성
export default function SocialSignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useAuth();

  const params = new URLSearchParams(location.search);
  const pendingToken = params.get('pending') || '';
  const [form, setForm] = useState({
    name: params.get('name') || '',
    email: params.get('email') || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!pendingToken) {
    navigate('/login', { replace: true });
    return null;
  }

  // 소셜 가입 완성 폼 제출 — pendingToken과 이름·이메일을 서버에 전송해 계정 생성 후 로그인 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError('이름과 이메일을 모두 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/social/complete', {
        pendingToken,
        name: form.name.trim(),
        email: form.email.trim(),
      });
      await loginWithToken(data.token);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || '가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: '이름', key: 'name', type: 'text', placeholder: '홍길동' },
    { label: '이메일', key: 'email', type: 'email', placeholder: 'example@email.com' },
  ];

  return (
    <div style={{
      minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #ecfdf5 100%)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{
          background: 'white', borderRadius: 24, padding: '40px 36px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9',
        }}>
          {/* 헤더 */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 52, height: 52,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
            }}>
              <span style={{ color: 'white', fontSize: 24, fontWeight: 700 }}>+</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>소셜 계정 가입 완성</h1>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>
              소셜 로그인으로 연결된 계정 정보를 확인해주세요<br />
              <span style={{ color: '#10b981' }}>정보를 수정한 뒤 가입을 완료하세요</span>
            </p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit}>
            {fields.map(({ label, key, type, placeholder }) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  {label}
                </label>
                <input
                  type={type}
                  required
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  style={{
                    width: '100%', padding: '12px 16px', fontSize: 14,
                    border: '1.5px solid #e2e8f0', borderRadius: 12,
                    background: '#f8fafc', color: '#0f172a', outline: 'none',
                    transition: 'border-color 0.15s', boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#10b981'; e.target.style.background = 'white'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                />
              </div>
            ))}

            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 10, padding: '12px 16px',
                color: '#dc2626', fontSize: 13, marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(16,185,129,0.35)',
                transition: 'opacity 0.15s',
              }}
            >
              {loading ? '처리 중...' : '가입 완료'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 20 }}>
          잘못 접근하셨나요?{' '}
          <a
            href="/login"
            onClick={(e) => { e.preventDefault(); navigate('/login'); }}
            style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}
          >
            로그인으로 돌아가기
          </a>
        </p>
      </div>
    </div>
  );
}
