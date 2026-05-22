import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// 비밀번호 재설정 전용 페이지 — 로그인 상태에서 현재 비밀번호 확인 후 새 비밀번호로 변경
export default function ResetPasswordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', newPasswordConfirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 폼 제출 — 새 비밀번호 일치 확인 후 API 호출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.newPassword !== form.newPasswordConfirm) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (form.newPassword.length < 8) {
      setError('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess('비밀번호가 성공적으로 변경되었습니다.');
      setForm({ currentPassword: '', newPassword: '', newPasswordConfirm: '' });
    } catch (err) {
      setError(err.response?.data?.message || '비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px', fontSize: 14,
    border: '1.5px solid #e2e8f0', borderRadius: 12,
    background: '#f8fafc', color: '#0f172a', outline: 'none',
    transition: 'border-color 0.15s', boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6,
  };

  return (
    <div style={{
      minHeight: '90vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%)',
      padding: '48px 16px',
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* 뒤로 가기 */}
        <button
          onClick={() => navigate('/profile')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#64748b', fontSize: 14, marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 6, padding: 0,
          }}
        >
          ← 내 계정으로 돌아가기
        </button>

        {/* 제목 */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>비밀번호 재설정</h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>현재 비밀번호를 확인한 후 새 비밀번호로 변경합니다.</p>
        </div>

        <div style={{
          background: 'white', borderRadius: 28, padding: '36px 32px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{
              width: 40, height: 40,
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(99,102,241,0.3)',
            }}>
              <span style={{ color: 'white', fontSize: 18 }}>🔒</span>
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>비밀번호 변경</h2>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, marginTop: 2 }}>
                {user?.provider ? `${user.provider} 계정은 해당 서비스에서 비밀번호를 관리합니다.` : '8자 이상의 새 비밀번호를 설정하세요.'}
              </p>
            </div>
          </div>

          {/* 소셜 계정: 비밀번호 변경 불가 안내 */}
          {user?.provider != null ? (
            <div style={{
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: 12, padding: '16px 20px',
              color: '#64748b', fontSize: 14, lineHeight: 1.7,
            }}>
              <strong style={{ color: '#334155' }}>{user.provider}</strong> 계정으로 로그인한 경우 비밀번호는 해당 서비스에서 관리합니다.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>현재 비밀번호</label>
                <input
                  type="password"
                  required
                  value={form.currentPassword}
                  onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  placeholder="현재 비밀번호 입력"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.background = 'white'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>새 비밀번호</label>
                <input
                  type="password"
                  required
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="8자 이상 입력"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.background = 'white'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>새 비밀번호 확인</label>
                <input
                  type="password"
                  required
                  value={form.newPasswordConfirm}
                  onChange={(e) => setForm({ ...form, newPasswordConfirm: e.target.value })}
                  placeholder="새 비밀번호 재입력"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.background = 'white'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                />
              </div>

              {error && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: 10, padding: '12px 16px',
                  color: '#dc2626', fontSize: 13, marginBottom: 16,
                }}>
                  {error}
                </div>
              )}

              {success && (
                <div style={{
                  background: '#f0fdf4', border: '1px solid #bbf7d0',
                  borderRadius: 10, padding: '12px 16px',
                  color: '#16a34a', fontSize: 13, marginBottom: 16,
                }}>
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px',
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: 'white', border: 'none', borderRadius: 12,
                  fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(99,102,241,0.35)',
                  transition: 'opacity 0.15s',
                }}
              >
                {loading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
