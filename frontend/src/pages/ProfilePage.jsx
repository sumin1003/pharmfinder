import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// 내 계정 페이지 — 기본 정보 수정 및 비밀번호 변경(이메일 계정 한정), pharmacy 역할이면 약국 정보도 수정
export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [pharmacyForm, setPharmacyForm] = useState({ pharmacyName: '', address: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', newPasswordConfirm: '' });

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [pageLoading, setPageLoading] = useState(true);

  // 마운트 시 사용자 정보 및 약국 정보(pharmacy 역할) 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: me } = await api.get('/auth/me');
        setProfileForm({ name: me.name || '', email: me.email || '' });

        if (me.role === 'pharmacy') {
          try {
            const { data: pharmacyData } = await api.get('/pharmacies/my/info');
            setPharmacyForm({
              pharmacyName: pharmacyData.name || '',
              address: pharmacyData.address || '',
              phone: pharmacyData.phone || '',
            });
          } catch {
            // 약국 정보가 없는 경우 빈 값 유지
          }
        }
      } catch {
        // AuthContext의 user 값을 기본값으로 사용
        if (user) {
          setProfileForm({ name: user.name || '', email: user.email || '' });
        }
      } finally {
        setPageLoading(false);
      }
    };
    loadData();
  }, []);

  // 기본 정보 저장 — 이름·이메일(및 약국 정보)을 서버에 전송하고 AuthContext를 갱신
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);
    try {
      const payload = { name: profileForm.name.trim(), email: profileForm.email.trim() };
      if (user?.role === 'pharmacy') {
        payload.pharmacyName = pharmacyForm.pharmacyName.trim();
        payload.address = pharmacyForm.address.trim();
        payload.phone = pharmacyForm.phone.trim();
      }
      const { data } = await api.put('/auth/profile', payload);
      updateUser(data.user);
      // 이메일 변경으로 새 토큰이 발급된 경우 로컬스토리지 갱신
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      setProfileSuccess('정보가 성공적으로 저장되었습니다.');
    } catch (err) {
      setProfileError(err.response?.data?.message || '저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setProfileLoading(false);
    }
  };

  // 비밀번호 변경 — 새 비밀번호 일치 여부 확인 후 서버에 전송
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (passwordForm.newPassword !== passwordForm.newPasswordConfirm) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess('비밀번호가 성공적으로 변경되었습니다.');
      setPasswordForm({ currentPassword: '', newPassword: '', newPasswordConfirm: '' });
    } catch (err) {
      setPasswordError(err.response?.data?.message || '비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 16px', color: '#94a3b8', fontSize: 15 }}>
        로딩 중...
      </div>
    );
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', fontSize: 14,
    border: '1.5px solid #e2e8f0', borderRadius: 12,
    background: '#f8fafc', color: '#0f172a', outline: 'none',
    transition: 'border-color 0.15s', boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6,
  };

  const fieldWrapStyle = { marginBottom: 16 };

  return (
    <div style={{
      minHeight: '90vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%)',
      padding: '48px 16px',
    }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* 페이지 제목 */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>내 계정</h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>계정 정보를 확인하고 수정할 수 있습니다.</p>
        </div>

        {/* 섹션 1: 기본 정보 수정 */}
        <div style={{
          background: 'white', borderRadius: 28, padding: '36px 32px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{
              width: 40, height: 40,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(16,185,129,0.3)',
            }}>
              <span style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>✎</span>
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>기본 정보 수정</h2>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, marginTop: 2 }}>이름과 이메일을 변경할 수 있습니다.</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit}>
            <div style={fieldWrapStyle}>
              <label style={labelStyle}>이름</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="홍길동"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#10b981'; e.target.style.background = 'white'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
              />
            </div>

            <div style={fieldWrapStyle}>
              <label style={labelStyle}>이메일</label>
              <input
                type="email"
                required
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="example@email.com"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#10b981'; e.target.style.background = 'white'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
              />
            </div>

            {/* pharmacy 역할: 약국 정보 추가 필드 */}
            {user?.role === 'pharmacy' && (
              <>
                <div style={{ height: 1, background: '#f1f5f9', margin: '20px 0' }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 16 }}>약국 정보</p>

                <div style={fieldWrapStyle}>
                  <label style={labelStyle}>약국명</label>
                  <input
                    type="text"
                    value={pharmacyForm.pharmacyName}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, pharmacyName: e.target.value })}
                    placeholder="OO약국"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#10b981'; e.target.style.background = 'white'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                  />
                </div>

                <div style={fieldWrapStyle}>
                  <label style={labelStyle}>주소</label>
                  <input
                    type="text"
                    value={pharmacyForm.address}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, address: e.target.value })}
                    placeholder="서울특별시 강남구 ..."
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#10b981'; e.target.style.background = 'white'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                  />
                </div>

                <div style={fieldWrapStyle}>
                  <label style={labelStyle}>전화번호</label>
                  <input
                    type="tel"
                    value={pharmacyForm.phone}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, phone: e.target.value })}
                    placeholder="02-0000-0000"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#10b981'; e.target.style.background = 'white'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                  />
                </div>
              </>
            )}

            {profileError && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 10, padding: '12px 16px',
                color: '#dc2626', fontSize: 13, marginBottom: 16,
              }}>
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 10, padding: '12px 16px',
                color: '#16a34a', fontSize: 13, marginBottom: 16,
              }}>
                {profileSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={profileLoading}
              style={{
                width: '100%', padding: '14px',
                background: profileLoading ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 600, cursor: profileLoading ? 'not-allowed' : 'pointer',
                boxShadow: profileLoading ? 'none' : '0 4px 16px rgba(16,185,129,0.35)',
                transition: 'opacity 0.15s',
              }}
            >
              {profileLoading ? '저장 중...' : '정보 저장'}
            </button>
          </form>
        </div>

        {/* 섹션 2: 비밀번호 변경 */}
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
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, marginTop: 2 }}>현재 비밀번호를 확인한 후 새 비밀번호로 변경합니다.</p>
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
            <form onSubmit={handlePasswordSubmit}>
              <div style={fieldWrapStyle}>
                <label style={labelStyle}>현재 비밀번호</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="현재 비밀번호 입력"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.background = 'white'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                />
              </div>

              <div style={fieldWrapStyle}>
                <label style={labelStyle}>새 비밀번호</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="8자 이상 입력"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.background = 'white'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                />
              </div>

              <div style={fieldWrapStyle}>
                <label style={labelStyle}>새 비밀번호 확인</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPasswordConfirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPasswordConfirm: e.target.value })}
                  placeholder="새 비밀번호 재입력"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.background = 'white'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                />
              </div>

              {passwordError && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: 10, padding: '12px 16px',
                  color: '#dc2626', fontSize: 13, marginBottom: 16,
                }}>
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div style={{
                  background: '#f0fdf4', border: '1px solid #bbf7d0',
                  borderRadius: 10, padding: '12px 16px',
                  color: '#16a34a', fontSize: 13, marginBottom: 16,
                }}>
                  {passwordSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={passwordLoading}
                style={{
                  width: '100%', padding: '14px',
                  background: passwordLoading ? '#9ca3af' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: 'white', border: 'none', borderRadius: 12,
                  fontSize: 15, fontWeight: 600, cursor: passwordLoading ? 'not-allowed' : 'pointer',
                  boxShadow: passwordLoading ? 'none' : '0 4px 16px rgba(99,102,241,0.35)',
                  transition: 'opacity 0.15s',
                }}
              >
                {passwordLoading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
