import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

// 약 검색 페이지 — URL 쿼리 파라미터(q)를 기반으로 약품을 검색하고 결과 목록을 표시
export default function MedicineSearchPage() {
  const [searchParams] = useSearchParams();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const navigate = useNavigate();

  // 약품 검색 API 호출 — 검색어를 인코딩해 백엔드에 요청하고 결과를 상태에 저장
  const fetchMedicines = async (q) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/medicines/search?q=${encodeURIComponent(q)}`);
      setMedicines(res.data);
    } catch (err) {
      setError(err.response?.data?.message || '검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q) fetchMedicines(q);
  }, [searchParams]);

  // 검색 폼 제출 처리 — 쿼리 파라미터를 갱신해 URL을 변경하고 useEffect가 재검색하도록 유도
  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/medicines/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div style={{ maxWidth: 672, margin: '0 auto', padding: '40px 24px' }}>
      {/* 검색바 */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="약 이름으로 검색"
          style={{
            flex: 1,
            border: '1.5px solid #e2e8f0',
            borderRadius: 12,
            padding: '13px 16px',
            fontSize: 14,
            background: '#f8fafc',
            color: '#0f172a',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '13px 20px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
          }}
        >
          검색
        </button>
      </form>

      {/* 상태 */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
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
      )}
      {error && (
        <div style={{ textAlign: 'center', color: '#ef4444', padding: '32px 0', fontSize: 14 }}>
          {error}
        </div>
      )}
      {!loading && medicines.length === 0 && searchParams.get('q') && (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <p style={{ color: '#64748b', fontWeight: 500 }}>검색 결과가 없습니다</p>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>다른 검색어로 시도해보세요</p>
        </div>
      )}

      {/* 결과 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {medicines.map((med) => (
          <div
            key={med.id}
            onClick={() => navigate(`/medicines/${med.id}`)}
            style={{
              background: 'white',
              borderRadius: 20,
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              padding: '20px 24px',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 600, color: '#0f172a', marginBottom: 6, fontSize: 15 }}>
                  {med.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {med.category && (
                    <span style={{
                      background: '#dcfce7',
                      color: '#16a34a',
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 500,
                    }}>
                      {med.category}
                    </span>
                  )}
                </div>
                {med.efficacy && (
                  <p style={{
                    fontSize: 12,
                    color: '#94a3b8',
                    marginTop: 8,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {med.efficacy}
                  </p>
                )}
              </div>
              <span style={{ color: '#94a3b8', marginLeft: 16, fontSize: 18 }}>→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
