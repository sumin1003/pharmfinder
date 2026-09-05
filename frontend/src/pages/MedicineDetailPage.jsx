import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

// 약품 상세 페이지 — URL의 id로 약품 정보를 불러와 효능·사용법·주의사항 등을 표시
export default function MedicineDetailPage() {
  const { id } = useParams();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/medicines/${id}`)
      .then((res) => setMedicine(res.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#94a3b8' }}>
      로딩 중...
    </div>
  );
  if (!medicine) return null;

  const sections = [
    { label: '효능·효과', value: medicine.efficacy },
    { label: '사용법', value: medicine.usage },
    { label: '주의사항', value: medicine.precautions },
    { label: '부작용', value: medicine.side_effects },
  ];

  return (
    <div style={{ maxWidth: 672, margin: '0 auto', padding: '40px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', fontSize: 14, color: '#94a3b8', cursor: 'pointer', padding: 0 }}
        >
          ← 뒤로
        </button>
        <button
          onClick={() => navigate(`/map?medicine=${id}`)}
          style={{
            padding: '9px 18px',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))',
            color: 'white', border: 'none', borderRadius: 10,
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(83,58,253,0.3)',
          }}
        >
          이 약 재고 있는 주변 약국 찾기 →
        </button>
      </div>

      {/* 약품 헤더 카드 */}
      <div style={{
        background: 'white',
        borderRadius: 20,
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        padding: '24px',
        marginBottom: 24,
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 8 }}>
          {medicine.name}
        </h1>
        {medicine.category && (
          <span style={{
            background: 'rgba(83,58,253,0.14)',
            color: 'var(--color-primary-deep)',
            padding: '2px 8px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 500,
          }}>
            {medicine.category}
          </span>
        )}
      </div>

      {/* 섹션 카드들 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sections.map(({ label, value }) =>
          value ? (
            <div key={label} style={{
              background: 'white',
              borderRadius: 20,
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              padding: '24px',
            }}>
              <h3 style={{ fontWeight: 700, color: '#334155', marginBottom: 8 }}>{label}</h3>
              <p style={{ fontSize: 14, color: '#64748b', whiteSpace: 'pre-line', lineHeight: 1.7 }}>{value}</p>
            </div>
          ) : null
        )}
      </div>

    </div>
  );
}
