import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// 개발: Vite 프록시(/api → localhost:3000), 프로덕션: VITE_API_URL로 백엔드 직접 호출
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// 로그인 페이지 — 이메일·비밀번호 입력 후 AuthContext의 login을 호출해 역할별로 이동
export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // 폼 제출 처리 — 로그인 성공 시 역할(admin/pharmacy/user)에 따라 대시보드로 이동
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'pharmacy') navigate('/pharmacy/dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '이메일 또는 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* 카드 */}
        <div className="pf-form-card" style={{ background: 'white', borderRadius: 28, padding: '40px 40px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
          {/* 로고 */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 52, height: 52, margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(16,185,129,0.3)', fontSize: 26,
            }}>+</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>로그인</h1>
            <p style={{ fontSize: 14, color: '#94a3b8' }}>PharmFinder에 오신 것을 환영해요</p>
          </div>

          <form onSubmit={handleSubmit}>
            {[
              { label: '이메일', key: 'email', type: 'email', placeholder: 'example@email.com' },
              { label: '비밀번호', key: 'password', type: 'password', placeholder: '비밀번호 입력' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>{label}</label>
                <input
                  type={type} required
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  style={{
                    width: '100%', padding: '13px 16px', fontSize: 14,
                    border: '1.5px solid #e2e8f0', borderRadius: 12, outline: 'none',
                    background: '#f8fafc', color: '#0f172a',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            ))}

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#dc2626', marginBottom: 18 }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, color: 'white',
                background: loading ? '#6ee7b7' : 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%' }} className="animate-spin" />
                  로그인 중...
                </>
              ) : '로그인'}
            </button>
          </form>
        </div>

        {/* 소셜 로그인 */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e2e8f0' }} />
            <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>또는 소셜 계정으로 로그인</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e2e8f0' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href={`${API_BASE}/auth/kakao`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '13px 0', borderRadius: 12, fontSize: 14, fontWeight: 600,
              background: '#FEE500', color: '#191919', textDecoration: 'none',
              border: '1px solid #FEE500',
            }}>
              <span style={{ fontSize: 18 }}>💬</span> 카카오로 로그인
            </a>
            <a href={`${API_BASE}/auth/google`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '13px 0', borderRadius: 12, fontSize: 14, fontWeight: 600,
              background: 'white', color: '#374151', textDecoration: 'none',
              border: '1.5px solid #e2e8f0',
            }}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.96 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              구글로 로그인
            </a>
            <a href={`${API_BASE}/auth/naver`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '13px 0', borderRadius: 12, fontSize: 14, fontWeight: 600,
              background: '#03C75A', color: 'white', textDecoration: 'none',
              border: '1px solid #03C75A',
            }}>
              <span style={{ fontSize: 16, fontWeight: 900 }}>N</span> 네이버로 로그인
            </a>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <p style={{ fontSize: 14, color: '#64748b' }}>
            계정이 없으신가요?{' '}
            <Link to="/register" style={{ color: '#059669', fontWeight: 600, textDecoration: 'none' }}>일반 회원가입</Link>
            {' '}·{' '}
            <Link to="/register/pharmacy" style={{ color: '#059669', fontWeight: 600, textDecoration: 'none' }}>약국 등록</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
