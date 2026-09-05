import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

// 비밀번호 찾기 — 이메일 입력 시 재설정 링크 발송 요청 (계정 존재 여부와 무관하게 동일 안내 표시)
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // 재설정 이메일 발송 요청 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || '요청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(135deg, rgba(83,58,253,0.06) 0%, #f8fafc 100%)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ background: 'white', borderRadius: 28, padding: '40px 40px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 52, height: 52, margin: '0 auto 16px',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))',
              borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(83,58,253,0.3)', fontSize: 26,
            }}>+</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-ink)', marginBottom: 6 }}>비밀번호 찾기</h1>
            <p style={{ fontSize: 14, color: '#94a3b8' }}>가입한 이메일로 재설정 링크를 보내드려요</p>
          </div>

          {sent ? (
            <div style={{ background: 'rgba(83,58,253,0.06)', border: '1px solid #bbf7d0', borderRadius: 12, padding: '18px 16px', fontSize: 14, color: '#166534', textAlign: 'center', lineHeight: 1.6 }}>
              해당 이메일로 가입된 계정이 있다면 재설정 링크를 발송했습니다.<br />
              메일함(스팸함 포함)을 확인해주세요.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>이메일</label>
                <input
                  type="email" required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  style={{
                    width: '100%', padding: '13px 16px', fontSize: 14,
                    border: '1.5px solid #e2e8f0', borderRadius: 12, outline: 'none',
                    background: '#f8fafc', color: 'var(--color-ink)',
                    transition: 'border-color 0.15s', boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#dc2626', marginBottom: 18 }}>
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, color: 'white',
                  background: loading ? 'var(--color-primary-soft)' : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))',
                  border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 16px rgba(83,58,253,0.3)',
                }}
              >
                {loading ? '전송 중...' : '재설정 링크 받기'}
              </button>
            </form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/login" style={{ fontSize: 14, color: 'var(--color-primary-deep)', fontWeight: 600, textDecoration: 'none' }}>
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
