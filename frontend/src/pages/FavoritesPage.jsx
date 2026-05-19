import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const s = {
  page: { maxWidth: 800, margin: '0 auto', padding: '40px 24px', minHeight: '100vh' },
  heading: { fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 32 },
  grid: { display: 'grid', gap: 16 },
  card: {
    background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '20px 24px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  cardLeft: { flex: 1, minWidth: 0 },
  name: { fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4, textDecoration: 'none' },
  address: { fontSize: 13, color: '#64748b', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  phone: { fontSize: 13, color: '#94a3b8' },
  removeBtn: {
    flexShrink: 0, marginLeft: 16, padding: '6px 14px',
    background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3',
    borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer',
  },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#94a3b8' },
  empty: { textAlign: 'center', padding: '80px 0' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#94a3b8', marginBottom: 24 },
  ctaBtn: {
    display: 'inline-block', padding: '12px 28px', borderRadius: 12,
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white', fontWeight: 600, fontSize: 14, textDecoration: 'none',
    boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
  },
  count: { fontSize: 14, color: '#64748b', marginBottom: 20 },
};

// 즐겨찾기 약국 목록 — 해제 버튼 클릭 시 즉시 목록에서 제거
export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    api.get('/pharmacies/my/favorites')
      .then((res) => setFavorites(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 즐겨찾기 해제 — 토글 API 호출 후 목록에서 즉시 제거
  const handleRemove = async (pharmacyId) => {
    setRemovingId(pharmacyId);
    try {
      await api.post(`/pharmacies/${pharmacyId}/favorite`);
      setFavorites((prev) => prev.filter((f) => f.pharmacies?.id !== pharmacyId));
    } catch {
      // 실패 시 그대로 유지
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) return <div style={s.center}>로딩 중...</div>;

  return (
    <div style={s.page}>
      <h1 style={s.heading}>즐겨찾기 약국</h1>

      {favorites.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>★</div>
          <p style={s.emptyTitle}>즐겨찾기한 약국이 없습니다</p>
          <p style={s.emptyDesc}>약국 상세 페이지에서 즐겨찾기를 추가해보세요.</p>
          <Link to="/map" style={s.ctaBtn}>약국 찾기</Link>
        </div>
      ) : (
        <>
          <p style={s.count}>총 {favorites.length}개</p>
          <div style={s.grid}>
            {favorites.map((fav) => {
              const p = fav.pharmacies;
              if (!p) return null;
              return (
                <div key={fav.id} style={s.card}>
                  <div style={s.cardLeft}>
                    <Link to={`/pharmacies/${p.id}`} style={s.name}>{p.name}</Link>
                    <p style={s.address}>{p.address}</p>
                    {p.phone && <p style={s.phone}>{p.phone}</p>}
                  </div>
                  <button
                    style={{ ...s.removeBtn, opacity: removingId === p.id ? 0.5 : 1 }}
                    disabled={removingId === p.id}
                    onClick={() => handleRemove(p.id)}
                  >
                    해제
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
