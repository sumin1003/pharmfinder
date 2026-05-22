import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { isOpenNow } from '../utils/businessHours';

// 약국 상세 페이지 — 약국 기본 정보와 재고 목록을 함께 불러와 품절·부족 상태를 시각적으로 표시
export default function PharmacyDetailPage() {
  const { id } = useParams();
  const [pharmacy, setPharmacy] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginMsg, setLoginMsg] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get(`/pharmacies/${id}`), api.get(`/pharmacies/${id}/inventory`)])
      .then(([pharmRes, invRes]) => { setPharmacy(pharmRes.data); setInventory(invRes.data); })
      .catch(() => navigate('/map'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // 즐겨찾기 토글 처리 — 비로그인 시 안내 메시지 표시, 로그인 상태면 즐겨찾기 API 호출
  const handleFavorite = async () => {
    if (!user) {
      setLoginMsg(true);
      setTimeout(() => setLoginMsg(false), 3000);
      return;
    }
    try {
      const res = await api.post(`/pharmacies/${id}/favorite`);
      setFavorited(res.data.favorited);
    } catch { /* 즐겨찾기 실패 시 무시 */ }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div
        className="animate-spin"
        style={{
          width: 32,
          height: 32,
          border: '2px solid #a7f3d0',
          borderTopColor: '#059669',
          borderRadius: '50%',
        }}
      />
    </div>
  );

  if (!pharmacy) return null;
  const lowStock = inventory.filter((i) => i.quantity > 0 && i.quantity <= i.min_quantity);
  const outOfStock = inventory.filter((i) => i.quantity === 0);

  return (
    <div style={{ maxWidth: 672, margin: '0 auto', padding: '40px 24px' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'none',
          border: 'none',
          fontSize: 14,
          color: '#94a3b8',
          cursor: 'pointer',
          marginBottom: 24,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        ← 뒤로
      </button>

      {/* 약국 정보 카드 */}
      <div style={{
        background: 'white',
        borderRadius: 20,
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        padding: '24px',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
              {pharmacy.name}
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={{ fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📍</span>{pharmacy.address}
              </p>
              {pharmacy.phone && (
                <p style={{ fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📞</span>{pharmacy.phone}
                </p>
              )}
              {pharmacy.business_hours && (() => {
                const open = isOpenNow(pharmacy.business_hours);
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                      background: open ? '#dcfce7' : '#f1f5f9',
                      color: open ? '#16a34a' : '#64748b',
                    }}>
                      {open ? '영업 중' : '영업 종료'}
                    </span>
                    <span style={{ fontSize: 13, color: '#64748b' }}>{pharmacy.business_hours}</span>
                  </div>
                );
              })()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <button
              onClick={handleFavorite}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                background: favorited ? '#fef3c7' : '#f1f5f9',
                color: favorited ? '#f59e0b' : '#cbd5e1',
                fontSize: 18,
              }}
            >
              ★
            </button>
            {loginMsg && (
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, whiteSpace: 'nowrap' }}>
                로그인 후 이용 가능
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 알림 */}
      {outOfStock.length > 0 && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: 16,
          padding: '16px',
          marginBottom: 16,
          fontSize: 14,
          color: '#dc2626',
          display: 'flex',
          gap: 8,
        }}>
          <span>🚫</span>
          <span>품절: {outOfStock.map((i) => i.medicines?.name).join(', ')}</span>
        </div>
      )}
      {lowStock.length > 0 && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: 16,
          padding: '16px',
          marginBottom: 16,
          fontSize: 14,
          color: '#d97706',
          display: 'flex',
          gap: 8,
        }}>
          <span>⚠️</span>
          <span>재고 부족: {lowStock.map((i) => i.medicines?.name).join(', ')}</span>
        </div>
      )}

      {/* 재고 목록 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontWeight: 700, color: '#0f172a' }}>보유 재고</h2>
        <span style={{ fontSize: 14, color: '#94a3b8' }}>{inventory.length}종</span>
      </div>

      {inventory.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '64px 0',
          background: 'white',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
          <p style={{ color: '#64748b', fontWeight: 500 }}>등록된 재고 정보가 없습니다</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {inventory.map((item) => (
            <div key={item.id} style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontWeight: 500, color: '#0f172a', fontSize: 14 }}>{item.medicines?.name}</p>
                {item.medicines?.category && (
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{item.medicines.category}</p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: item.quantity === 0 ? '#ef4444' : item.quantity <= item.min_quantity ? '#f59e0b' : '#10b981',
                }}>
                  {item.quantity}
                </span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>개</span>
                {item.quantity === 0 && (
                  <span style={{
                    background: '#fee2e2',
                    color: '#dc2626',
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 500,
                  }}>
                    품절
                  </span>
                )}
                {item.quantity > 0 && item.quantity <= item.min_quantity && (
                  <span style={{
                    background: '#fef3c7',
                    color: '#d97706',
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 500,
                  }}>
                    부족
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
