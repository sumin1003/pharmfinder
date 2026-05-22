import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const S = {
  hero: {
    width: '100%',
    background: 'linear-gradient(135deg, #0f172a 0%, #064e3b 50%, #0f172a 100%)',
    padding: '96px 32px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
    borderRadius: 999, padding: '6px 16px', marginBottom: 28,
  },
  dot: { width: 8, height: 8, borderRadius: '50%', backgroundColor: '#34d399' },
  heroTitle: { fontSize: 52, fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 16 },
  heroSub: { fontSize: 18, color: '#94a3b8', marginBottom: 40, lineHeight: 1.7 },
  tabWrap: { display: 'inline-flex', background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 4, marginBottom: 24, border: '1px solid rgba(255,255,255,0.1)' },
  tabActive: { padding: '10px 22px', borderRadius: 10, fontSize: 14, fontWeight: 600, background: 'white', color: '#0f172a', cursor: 'pointer', border: 'none' },
  tabInactive: { padding: '10px 22px', borderRadius: 10, fontSize: 14, fontWeight: 500, background: 'transparent', color: '#94a3b8', cursor: 'pointer', border: 'none' },
  searchWrap: { display: 'flex', gap: 12, maxWidth: 600, margin: '0 auto' },
  searchInput: {
    flex: 1, padding: '16px 22px', fontSize: 15,
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 14, color: 'white', outline: 'none',
  },
  searchBtn: {
    padding: '16px 28px', background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white', border: 'none', borderRadius: 14, fontSize: 15,
    fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
    boxShadow: '0 4px 15px rgba(16,185,129,0.4)',
  },
};

// 홈 페이지 — 증상 기반 AI 추천 또는 약 이름 검색을 선택해 실행하는 메인 랜딩 화면
export default function HomePage() {
  const [mode, setMode] = useState('symptom');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 검색 폼 제출 처리 — 약 이름 모드면 검색 페이지로 이동, 증상 모드면 AI 추천 API 호출
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (mode === 'medicine') {
      navigate(`/medicines/search?q=${encodeURIComponent(query)}`);
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post('/medicines/recommend', { symptom: query });
      setResult(res.data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      setError(err.response?.data?.message || '추천 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const resultRef = useRef(null);

  return (
    <div style={{ width: '100%' }}>

      {/* ─── Hero ─── */}
      <section style={S.hero}>
        {/* 배경 글로우 */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 400, height: 400, background: 'radial-gradient(circle, rgba(5,150,105,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
          <div style={S.heroBadge}>
            <span style={S.dot} className="animate-pulse" />
            <span style={{ fontSize: 13, fontWeight: 500, color: '#34d399' }}>실시간 약국 재고 확인</span>
          </div>

          <h1 style={S.heroTitle}>
            필요한 약,<br />
            <span style={{ background: 'linear-gradient(90deg, #34d399, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              지금 바로 찾아드려요
            </span>
          </h1>

          <p style={S.heroSub}>
            증상을 입력하면 AI가 약을 추천하고<br />주변 약국 재고를 바로 확인해드려요
          </p>

          {/* 탭 */}
          <div style={{ marginBottom: 20 }}>
            <div style={S.tabWrap}>
              <button style={mode === 'symptom' ? S.tabActive : S.tabInactive} onClick={() => { setMode('symptom'); setQuery(''); setResult(null); setError(''); }}>
                🩺 증상으로 찾기
              </button>
              <button style={mode === 'medicine' ? S.tabActive : S.tabInactive} onClick={() => { setMode('medicine'); setQuery(''); setResult(null); setError(''); }}>
                💊 약 이름으로 찾기
              </button>
            </div>
          </div>

          {/* 검색창 */}
          <form onSubmit={handleSearch} style={S.searchWrap}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mode === 'symptom' ? '예) 두통이 심하고 열이 나요' : '예) 타이레놀, 게보린'}
              style={S.searchInput}
            />
            <button type="submit" disabled={loading} style={{ ...S.searchBtn, opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} className="animate-spin" />
                  분석 중
                </span>
              ) : '검색'}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 18px', color: '#fca5a5', fontSize: 14 }}>
              {error}
            </div>
          )}
        </div>
      </section>

      {/* ─── AI 추천 결과 ─── */}
      {result && (
        <section ref={resultRef} style={{ padding: '60px 32px', scrollMarginTop: 80 }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
              <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                🤖
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 18, color: '#0f172a' }}>AI 추천 결과</p>
                <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>{result.summary}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
              {result.medicines?.map((med, i) => (
                <div key={i} style={{
                  background: 'white', borderRadius: 20, padding: '24px',
                  border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                }}>
                  {/* 헤더 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        width: 30, height: 30, background: '#ecfdf5', color: '#059669',
                        borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, flexShrink: 0,
                      }}>{i + 1}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 17, color: '#0f172a' }}>{med.name}</span>
                        {med.db_id && (
                          <span style={{ fontSize: 11, background: '#dcfce7', color: '#16a34a', padding: '2px 7px', borderRadius: 999, fontWeight: 600 }}>
                            DB 등록
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        med.db_id
                          ? navigate(`/medicines/${med.db_id}`)
                          : navigate(`/medicines/search?q=${encodeURIComponent(med.name)}`)
                      }
                      style={{ fontSize: 13, color: '#059669', background: '#ecfdf5', border: 'none', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' }}
                    >
                      {med.db_id ? '상세 보기 →' : '종류 보기 →'}
                    </button>
                  </div>

                  {/* 추천 이유 */}
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#059669', marginBottom: 4 }}>추천 이유</p>
                    <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>{med.reason}</p>
                  </div>

                  {/* 복용법 */}
                  {med.usage && (
                    <div style={{ marginBottom: 10, background: '#f8fafc', borderRadius: 10, padding: '10px 14px' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', marginBottom: 3 }}>💊 복용 방법</p>
                      <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{med.usage}</p>
                    </div>
                  )}

                  {/* 주의사항 + 부작용 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ background: '#fffbeb', borderRadius: 10, padding: '10px 14px' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#d97706', marginBottom: 3 }}>⚠ 주의사항</p>
                      <p style={{ fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>{med.caution}</p>
                    </div>
                    {med.side_effects && (
                      <div style={{ background: '#fff1f2', borderRadius: 10, padding: '10px 14px' }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#e11d48', marginBottom: 3 }}>🔴 부작용</p>
                        <p style={{ fontSize: 13, color: '#9f1239', lineHeight: 1.6 }}>{med.side_effects}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {result.advice && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 16, padding: '16px 20px', display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 18 }}>💡</span>
                <p style={{ fontSize: 14, color: '#1d4ed8', lineHeight: 1.6 }}>{result.advice}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── 기능 소개 ─── */}
      {!result && (
        <>
          <section style={{ padding: '80px 32px', backgroundColor: 'white' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 56 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#10b981', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>서비스 소개</p>
                <h2 style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  약국 방문 전에<br />미리 확인하세요
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                {[
                  { icon: '🗺️', tag: '위치 기반', title: '주변 약국 지도', desc: '현재 위치에서 가까운 약국을 지도에서 한눈에 찾고, 거리와 운영 정보를 바로 확인하세요.', link: '/map', cta: '지도 보기', color: '#3b82f6', bg: '#eff6ff' },
                  { icon: '🤖', tag: 'AI 추천', title: 'AI 증상 분석', desc: '증상을 입력하면 AI가 적합한 일반의약품 3가지를 즉시 추천해드려요. 로그인 없이 바로 사용 가능.', link: null, cta: null, color: '#10b981', bg: '#ecfdf5' },
                  { icon: '📦', tag: '실시간', title: '재고 바로 확인', desc: '방문 전에 약국별 보유 재고를 미리 확인해 헛걸음을 없애고 시간을 아끼세요.', link: '/map', cta: '확인하기', color: '#8b5cf6', bg: '#f5f3ff' },
                ].map((item) => (
                  <div
                    key={item.title}
                    onClick={() => item.link && navigate(item.link)}
                    style={{
                      background: 'white', borderRadius: 24, padding: '32px 28px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                      cursor: item.link ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => item.link && (e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)')}
                    onMouseLeave={(e) => item.link && (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)')}
                  >
                    <div style={{ width: 52, height: 52, background: item.bg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 20 }}>
                      {item.icon}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: item.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{item.tag}</div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>{item.title}</h3>
                    <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>{item.desc}</p>
                    {item.cta && (
                      <span style={{ fontSize: 14, fontWeight: 600, color: item.color }}>
                        {item.cta} →
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── 약국 CTA ─── */}
          <section style={{ padding: '80px 32px', background: '#f8fafc' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div style={{
                background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
                borderRadius: 28, padding: '56px 64px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32,
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#6ee7b7', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>약국 파트너</p>
                  <h2 style={{ fontSize: 32, fontWeight: 800, color: 'white', lineHeight: 1.25, marginBottom: 12 }}>
                    약국을 운영하시나요?
                  </h2>
                  <p style={{ fontSize: 15, color: '#a7f3d0', lineHeight: 1.7 }}>
                    재고를 등록하고 더 많은 고객에게 약국을 알리세요.<br />
                    관리자 승인 후 서비스를 시작할 수 있습니다.
                  </p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <button
                    onClick={() => navigate('/register/pharmacy')}
                    style={{
                      padding: '16px 36px', background: 'white', color: '#065f46',
                      border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700,
                      cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    약국 등록하기 →
                  </button>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
