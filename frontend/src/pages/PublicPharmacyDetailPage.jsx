import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

// 공공데이터 약국 상세 — 비가입 약국은 기본 정보만, 가입+연결된 약국은 재고 목록도 표시
export default function PublicPharmacyDetailPage() {
  const { id } = useParams();
  const [pharmacy, setPharmacy] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/pharmacies/public/${id}`)
      .then((res) => setPharmacy(res.data))
      .catch(() => navigate('/map'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="animate-spin" style={{ width: 32, height: 32, border: '2px solid #a7f3d0', borderTopColor: '#059669', borderRadius: '50%' }} />
    </div>
  );

  if (!pharmacy) return null;

  const inventory = pharmacy.inventory || [];
  const lowStock = inventory.filter((i) => i.quantity > 0 && i.quantity <= i.min_quantity);
  const outOfStock = inventory.filter((i) => i.quantity === 0);

  return (
    <div style={{ maxWidth: 672, margin: '0 auto', padding: '40px 24px' }}>
      <button
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', fontSize: 14, color: '#94a3b8', cursor: 'pointer', marginBottom: 24, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        ← 뒤로
      </button>

      {/* 약국 기본 정보 */}
      <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>{pharmacy.name}</h1>
          {pharmacy.is_registered ? (
            <span style={{ fontSize: 12, background: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: 999, fontWeight: 500, whiteSpace: 'nowrap' }}>
              PharmFinder 가입
            </span>
          ) : (
            <span style={{ fontSize: 12, background: '#f1f5f9', color: '#94a3b8', padding: '4px 10px', borderRadius: 999, fontWeight: 500, whiteSpace: 'nowrap' }}>
              공공데이터 약국
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {pharmacy.address && (
            <p style={{ fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📍</span>{pharmacy.address}
            </p>
          )}
          {pharmacy.phone && (
            <p style={{ fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📞</span>{pharmacy.phone}
            </p>
          )}
        </div>
      </div>

      {/* 비가입 약국 안내 */}
      {!pharmacy.is_registered && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>재고 정보가 제공되지 않는 약국입니다</p>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
            이 약국은 PharmFinder에 등록되지 않아 실시간 재고 정보를 확인할 수 없습니다.
            <br />방문 전 전화로 재고를 확인해 보세요.
          </p>
        </div>
      )}

      {/* 가입 약국: 재고 섹션 */}
      {pharmacy.is_registered && (
        <>
          {outOfStock.length > 0 && (
            <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 16, padding: '16px', marginBottom: 16, fontSize: 14, color: '#dc2626', display: 'flex', gap: 8 }}>
              <span>🚫</span>
              <span>품절: {outOfStock.map((i) => i.medicines?.name).join(', ')}</span>
            </div>
          )}
          {lowStock.length > 0 && (
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 16, padding: '16px', marginBottom: 16, fontSize: 14, color: '#d97706', display: 'flex', gap: 8 }}>
              <span>⚠️</span>
              <span>재고 부족: {lowStock.map((i) => i.medicines?.name).join(', ')}</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontWeight: 700, color: '#0f172a' }}>보유 재고</h2>
            <span style={{ fontSize: 14, color: '#94a3b8' }}>{inventory.length}종</span>
          </div>

          {inventory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', background: 'white', borderRadius: 20, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
              <p style={{ color: '#64748b', fontWeight: 500 }}>등록된 재고 정보가 없습니다</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {inventory.map((item) => (
                <div key={item.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontWeight: 500, color: '#0f172a', fontSize: 14 }}>{item.medicines?.name}</p>
                    {item.medicines?.category && (
                      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{item.medicines.category}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: item.quantity === 0 ? '#ef4444' : item.quantity <= item.min_quantity ? '#f59e0b' : '#10b981' }}>
                      {item.quantity}
                    </span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>개</span>
                    {item.quantity === 0 && (
                      <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 500 }}>품절</span>
                    )}
                    {item.quantity > 0 && item.quantity <= item.min_quantity && (
                      <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 500 }}>부족</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
