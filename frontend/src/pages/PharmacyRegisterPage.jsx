import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const inputStyle = {
  width: '100%', padding: '13px 16px', fontSize: 14,
  border: '1.5px solid #e2e8f0', borderRadius: 12, outline: 'none',
  background: '#f8fafc', color: 'var(--color-ink)',
};

// 약국 등록 신청 페이지 — 약국 정보를 입력받아 관리자 승인 대기 상태로 신청
export default function PharmacyRegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', name: '', pharmacyName: '', address: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  // 폼 제출 처리 — 비밀번호 검증 후 약국 회원가입 API 호출, 성공 시 완료 화면으로 전환
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.passwordConfirm) return setError('비밀번호가 일치하지 않습니다.');
    setLoading(true);
    try {
      await api.post('/auth/pharmacy/register', { email: form.email, password: form.password, name: form.name, pharmacyName: form.pharmacyName, address: form.address, phone: form.phone });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || '가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(135deg, rgba(83,58,253,0.06), #f8fafc)' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-ink)', marginBottom: 10 }}>신청 완료!</h2>
        <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 28 }}>
          관리자 승인 후 로그인하실 수 있습니다.<br />보통 1~2 영업일 내 처리됩니다.
        </p>
        <button onClick={() => navigate('/login')} style={{ padding: '14px 32px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          로그인 페이지로 →
        </button>
      </div>
    </div>
  );

  const fields = [
    { label: '담당자 이름', key: 'name', type: 'text', placeholder: '홍길동' },
    { label: '이메일', key: 'email', type: 'email', placeholder: 'pharmacy@email.com' },
    { label: '비밀번호', key: 'password', type: 'password', placeholder: '6자 이상' },
    { label: '비밀번호 확인', key: 'passwordConfirm', type: 'password', placeholder: '비밀번호 재입력' },
    { label: '약국 상호명', key: 'pharmacyName', type: 'text', placeholder: '○○약국' },
    { label: '약국 주소', key: 'address', type: 'text', placeholder: '서울시 강남구 역삼동 ...' },
    { label: '전화번호 (선택)', key: 'phone', type: 'tel', placeholder: '02-1234-5678', required: false },
  ];

  return (
    <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'linear-gradient(135deg, rgba(83,58,253,0.06), #f8fafc)' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ background: 'white', borderRadius: 28, padding: '40px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 52, height: 52, margin: '0 auto 16px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: '0 4px 16px rgba(83,58,253,0.3)' }}>🏥</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-ink)', marginBottom: 6 }}>약국 등록 신청</h1>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>관리자 승인 후 서비스 이용이 가능합니다</p>
          </div>

          <form onSubmit={handleSubmit}>
            {fields.map(({ label, key, type, placeholder, required = true }) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 7 }}>{label}</label>
                <input
                  type={type} required={required}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            ))}

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#dc2626', marginBottom: 18 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, color: 'white',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))', border: 'none', borderRadius: 12,
              cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
              boxShadow: '0 4px 16px rgba(83,58,253,0.3)',
            }}>
              {loading ? '처리 중...' : '가입 신청하기'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
          일반 사용자이신가요?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary-deep)', fontWeight: 600, textDecoration: 'none' }}>일반 회원가입</Link>
        </p>
      </div>
    </div>
  );
}
