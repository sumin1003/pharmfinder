import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { isOpenNow } from '../utils/businessHours';

// 공공데이터 약국 상세 — 비가입 약국은 기본 정보만, 가입+연결된 약국은 재고 목록·영업시간·즐겨찾기도 표시
export default function PublicPharmacyDetailPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const [pharmacy, setPharmacy] = useState(state?.pharmacy || null);
  const [loading, setLoading] = useState(!state?.pharmacy);
  const [favorited, setFavorited] = useState(false);
  const [loginMsg, setLoginMsg] = useState(false);
  const [favoriteError, setFavoriteError] = useState('');
  // URL의 :id가 실제 public_pharmacies 행과 일치함이 API로 확인된 경우에만 true.
  // 지도에서 카카오-DB 매칭에 실패한 약국은 이 확인이 영영 실패하므로(카카오 장소ID로는 조회 불가),
  // 미가입 약국의 즐겨찾기 가능 여부를 이 값으로 판단한다
  const [verified, setVerified] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // 지도에서 state로 넘어온 값은 카카오 응답 기반이라 재고 목록이 없으므로,
  // 화면은 바로 보여주되 백그라운드에서 전체 상세(재고 포함)를 다시 조회해 덮어씀
  useEffect(() => {
    api.get(`/pharmacies/public/${id}`)
      .then((res) => { setPharmacy(res.data); setVerified(true); })
      .catch(() => { if (!state?.pharmacy) navigate('/map'); })
      .finally(() => setLoading(false));
  }, [id, navigate, state]);

  // 로그인 상태면 기존 즐겨찾기 여부를 조회해 별 표시 상태를 맞춤 (가입 약국은 pharmacy_id, 미가입 약국은 public_pharmacy_id 기준)
  useEffect(() => {
    if (!user || !pharmacy || (!pharmacy.linked_pharmacy_id && !verified)) return;
    api.get('/pharmacies/my/favorites')
      .then((res) => setFavorited(res.data.some((f) => (
        pharmacy.linked_pharmacy_id
          ? f.pharmacy_id === pharmacy.linked_pharmacy_id
          : f.public_pharmacy_id === pharmacy.id
      ))))
      .catch(() => {});
  }, [user, pharmacy, verified]);

  // 즐겨찾기 토글 처리 — 비로그인 시 안내 메시지, 매칭 안 된 미가입 약국이면 안내 메시지, 그 외엔 API 호출
  const handleFavorite = async () => {
    if (!user) {
      setLoginMsg(true);
      setTimeout(() => setLoginMsg(false), 3000);
      return;
    }
    if (!pharmacy.linked_pharmacy_id && !verified) {
      setFavoriteError('이 약국은 아직 공공데이터와 매칭되지 않아 즐겨찾기를 지원하지 않습니다.');
      setTimeout(() => setFavoriteError(''), 4000);
      return;
    }
    try {
      const url = pharmacy.linked_pharmacy_id
        ? `/pharmacies/${pharmacy.linked_pharmacy_id}/favorite`
        : `/pharmacies/public/${pharmacy.id}/favorite`;
      const res = await api.post(url);
      setFavorited(res.data.favorited);
    } catch {
      setFavoriteError('즐겨찾기 처리에 실패했습니다. 잠시 후 다시 시도해주세요.');
      setTimeout(() => setFavoriteError(''), 4000);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="animate-spin" style={{ width: 32, height: 32, border: '2px solid var(--color-primary-subdued)', borderTopColor: 'var(--color-primary-deep)', borderRadius: '50%' }} />
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
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 8 }}>{pharmacy.name}</h1>
            {pharmacy.is_registered ? (
              <span style={{ fontSize: 12, background: 'rgba(83,58,253,0.14)', color: 'var(--color-primary-deep)', padding: '4px 10px', borderRadius: 999, fontWeight: 500, whiteSpace: 'nowrap' }}>
                PharmFinder 가입
              </span>
            ) : (
              <span style={{ fontSize: 12, background: '#f1f5f9', color: '#94a3b8', padding: '4px 10px', borderRadius: 999, fontWeight: 500, whiteSpace: 'nowrap' }}>
                공공데이터 약국
              </span>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <button
              onClick={handleFavorite}
              style={{
                width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer', fontSize: 18,
                background: favorited ? '#fef3c7' : '#f1f5f9',
                color: favorited ? '#f59e0b' : '#cbd5e1',
              }}
            >
              ★
            </button>
            {loginMsg && (
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, whiteSpace: 'nowrap' }}>
                로그인 후 이용 가능
              </p>
            )}
            {favoriteError && (
              <p style={{ fontSize: 11, color: '#f87171', marginTop: 4, maxWidth: 140, textAlign: 'right' }}>
                {favoriteError}
              </p>
            )}
          </div>
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
          {pharmacy.business_hours && (() => {
            const open = isOpenNow(pharmacy.business_hours);
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                  background: open ? 'rgba(83,58,253,0.14)' : '#f1f5f9',
                  color: open ? 'var(--color-primary-deep)' : '#64748b',
                }}>
                  {open ? '영업 중' : '영업 종료'}
                </span>
                <span style={{ fontSize: 13, color: '#64748b' }}>{pharmacy.business_hours}</span>
              </div>
            );
          })()}
          {!pharmacy.is_registered && pharmacy.business_hours && (
            <p style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>공공데이터 기준, 실제 영업시간과 다를 수 있어요</p>
          )}
        </div>
      </div>

      {/* 비가입 약국 안내 */}
      {!pharmacy.is_registered && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <p style={{ fontWeight: 600, color: 'var(--color-ink)', marginBottom: 8 }}>재고 정보가 제공되지 않는 약국입니다</p>
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
            <h2 style={{ fontWeight: 700, color: 'var(--color-ink)' }}>보유 재고</h2>
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
                    <p style={{ fontWeight: 500, color: 'var(--color-ink)', fontSize: 14 }}>{item.medicines?.name}</p>
                    {item.medicines?.category && (
                      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{item.medicines.category}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: item.quantity === 0 ? '#ef4444' : item.quantity <= item.min_quantity ? '#f59e0b' : 'var(--color-primary)' }}>
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
