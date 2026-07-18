import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

// 비밀번호 재설정 확인 — 이메일 링크의 토큰을 검증하며 새 비밀번호를 설정 (미로그인 상태에서 접근)
export default function ResetPasswordConfirmPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', color: '#94a3b8', fontSize: 15 }}>
        유효하지 않은 접근입니다. <Link to="/forgot-password" style={{ color: '#10b981', marginLeft: 6 }}>비밀번호 찾기로 이동</Link>
      </div>
    );
  }

  // 새 비밀번호 제출 — 토큰과 함께 서버에 전송해 비밀번호를 재설정
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword.length < 8) {
      setError('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: form.newPassword });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || '재설정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ background: 'white', borderRadius: 28, padding: '40px 40px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>새 비밀번호 설정</h1>
            <p style={{ fontSize: 14, color: '#94a3b8' }}>새로 사용할 비밀번호를 입력해주세요</p>
          </div>

          {done ? (
            <div>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '18px 16px', fontSize: 14, color: '#166534', textAlign: 'center', marginBottom: 20 }}>
                비밀번호가 재설정됐습니다.
              </div>
              <button
                onClick={() => navigate('/login')}
                style={{
                  width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, color: 'white',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none', borderRadius: 12, cursor: 'pointer',
                }}
              >
                로그인하러 가기
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {[
                { label: '새 비밀번호', key: 'newPassword', placeholder: '8자 이상 입력' },
                { label: '새 비밀번호 확인', key: 'confirmPassword', placeholder: '다시 입력' },
              ].map(({ label, key, placeholder }) => (
                <div key={key} style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>{label}</label>
                  <input
                    type="password" required
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    style={{
                      width: '100%', padding: '13px 16px', fontSize: 14,
                      border: '1.5px solid #e2e8f0', borderRadius: 12, outline: 'none',
                      background: '#f8fafc', color: '#0f172a',
                      transition: 'border-color 0.15s', boxSizing: 'border-box',
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
                }}
              >
                {loading ? '처리 중...' : '비밀번호 재설정'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
