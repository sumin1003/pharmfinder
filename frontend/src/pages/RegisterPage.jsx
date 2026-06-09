import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

// 일반 회원가입 페이지 — 이름·이메일·비밀번호를 입력받아 계정을 생성하고 로그인 페이지로 이동
export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 폼 제출 처리 — 비밀번호 일치 검증 후 회원가입 API 호출, 성공 시 로그인 페이지로 이동
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.passwordConfirm) return setError('비밀번호가 일치하지 않습니다.');
    setLoading(true);
    try {
      await api.post('/auth/register', { email: form.email, password: form.password, name: form.name });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: '이름', key: 'name', type: 'text', placeholder: '홍길동' },
    { label: '이메일', key: 'email', type: 'email', placeholder: 'example@email.com' },
    { label: '비밀번호', key: 'password', type: 'password', placeholder: '6자 이상 입력' },
    { label: '비밀번호 확인', key: 'passwordConfirm', type: 'password', placeholder: '비밀번호 재입력' },
  ];

  return (
    <div style={{
      minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #ecfdf5 100%)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div className="pf-form-card" style={{
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
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>일반 회원가입</h1>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>
              즐겨찾기 등 일부 기능에 사용돼요<br />
              <span style={{ color: '#10b981' }}>약 검색·AI 추천은 가입 없이 이용 가능해요</span>
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
                    transition: 'border-color 0.15s',
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
              {loading ? '처리 중...' : '가입하기'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 20 }}>
          이미 계정이 있으신가요?{' '}
          <Link to="/login" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
