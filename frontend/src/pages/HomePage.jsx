import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// 타이핑 애니메이션에 사용할 증상 예시 목록
const EXAMPLES = [
  '예) 두통이 심하고 열이 나요',
  '예) 소화가 안 되고 속이 더부룩해요',
  '예) 코가 막히고 콧물이 나요',
  '예) 눈이 가렵고 충혈됐어요',
];

// 증상 칩 버튼 목록
const CHIPS = ['두통·발열', '소화불량', '코막힘·콧물', '눈 가려움'];

const S = {
  hero: {
    width: '100%',
    background: 'var(--color-canvas)',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'var(--color-primary-subdued)', border: '1px solid rgba(83,58,253,0.2)',
    borderRadius: 999, padding: '6px 16px', marginBottom: 28,
  },
  dot: { width: 8, height: 8, borderRadius: '50%', backgroundColor: '#fef08a', boxShadow: '0 0 6px 2px rgba(254,240,138,0.8)' },
  heroSub: { fontSize: 18, color: 'var(--color-primary-deep)', marginBottom: 40, lineHeight: 1.6, fontWeight: 500 },
  tabWrap: { display: 'inline-flex', background: 'var(--color-canvas-soft)', borderRadius: 14, padding: 4, marginBottom: 24, border: '1px solid var(--color-hairline)' },
  tabActive: { padding: '10px 22px', borderRadius: 10, fontSize: 14, fontWeight: 500, background: 'var(--color-canvas)', color: 'var(--color-ink)', cursor: 'pointer', border: 'none', boxShadow: 'rgba(0,55,112,0.08) 0 1px 3px' },
  tabInactive: { padding: '10px 22px', borderRadius: 10, fontSize: 14, fontWeight: 400, background: 'transparent', color: 'var(--color-ink-mute)', cursor: 'pointer', border: 'none' },
  searchInput: {
    flex: 1, padding: '16px 22px', fontSize: 15,
    background: 'var(--color-canvas)', border: '1px solid var(--color-hairline-input)',
    borderRadius: 8, color: 'var(--color-ink)', outline: 'none', minWidth: 0,
  },
  searchBtn: {
    padding: '16px 28px', background: 'var(--color-primary)',
    color: 'var(--color-on-primary)', border: 'none', borderRadius: 999, fontSize: 16,
    fontWeight: 400, cursor: 'pointer', whiteSpace: 'nowrap',
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

  // 예시 문구 순환 인덱스
  const [exampleIdx, setExampleIdx] = useState(0);
  const typingRef = useRef(null);

  // 3초마다 예시 문구 교체 (symptom 모드이고 query가 없을 때만)
  useEffect(() => {
    if (mode === 'medicine' || query !== '') return;
    typingRef.current = setInterval(() => {
      setExampleIdx((i) => (i + 1) % EXAMPLES.length);
    }, 3000);
    return () => clearInterval(typingRef.current);
  }, [mode, query]);

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
      <section className="pf-hero-section" style={{ ...S.hero, padding: '96px 32px' }}>
        {/* 그라디언트 메쉬 배경 — 히어로 전체를 덮는 진한 파스텔~인디고 워시 */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(120deg, rgba(245,233,212,0.85) 0%, rgba(185,185,249,0.75) 30%, rgba(102,94,253,0.35) 55%, rgba(234,34,97,0.3) 78%, rgba(249,107,238,0.35) 100%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: -200, left: '-10%', width: 620, height: 620,
          background: 'radial-gradient(circle, rgba(245,233,212,0.95) 0%, transparent 70%)',
          filter: 'blur(50px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: -220, left: '25%', width: 700, height: 700,
          background: 'radial-gradient(circle, rgba(83,58,253,0.5) 0%, transparent 70%)',
          filter: 'blur(70px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: -260, right: '-5%', width: 680, height: 680,
          background: 'radial-gradient(circle, rgba(234,34,97,0.4) 0%, transparent 70%)',
          filter: 'blur(70px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: -40, right: '10%', width: 480, height: 480,
          background: 'radial-gradient(circle, rgba(249,107,238,0.35) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -180, left: '20%', width: 520, height: 520,
          background: 'radial-gradient(circle, rgba(102,94,253,0.3) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        {/* 본문 가독성 확보용 하단 화이트 페이드 */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, transparent 0%, transparent 55%, rgba(255,255,255,0.85) 100%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
          <div style={S.heroBadge}>
            <span style={S.dot} className="animate-pulse" />
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-primary-deep)' }}>실시간 약국 재고 확인</span>
          </div>

          <h1
            className="pf-hero-title"
            style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.96px', color: 'var(--color-ink)', lineHeight: 1.15, marginBottom: 16 }}
          >
            증상을 말하면<br />
            <span style={{ color: 'var(--color-primary)' }}>AI가</span>
            {' '}
            딱 맞는 약을 찾아드려요
          </h1>

          <p style={S.heroSub}>
            증상을 입력하면 AI가 약을 추천하고<br />주변 약국 재고를 바로 확인해드려요
          </p>

          {/* 신뢰 지표 row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 28, flexWrap: 'wrap' }}>
            {[
              { icon: '🤖', label: 'AI 즉시 분석' },
              { icon: '💊', label: '10만+ 약품 DB' },
              { icon: '🏥', label: '약국 재고 연동' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-ink-mute)' }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

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
          <form onSubmit={handleSearch} className="pf-search-wrap" style={{ display: 'flex', gap: 12, maxWidth: 600, margin: '0 auto' }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mode === 'symptom' ? EXAMPLES[exampleIdx] : '예) 타이레놀, 게보린'}
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

          {/* 증상 칩 버튼 — symptom 모드일 때만 노출 */}
          {mode === 'symptom' && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 }}>
              {CHIPS.map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setQuery(chip)}
                  className="pill-tag-soft"
                  style={{ fontSize: 13, cursor: 'pointer', border: 'none' }}
                >
                  #{chip}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div style={{ marginTop: 16, background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10, padding: '12px 18px', color: '#9f1239', fontSize: 14 }}>
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
              <div style={{ width: 44, height: 44, background: 'var(--color-primary-subdued)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                🤖
              </div>
              <div>
                <p style={{ fontWeight: 500, fontSize: 18, color: 'var(--color-ink)' }}>AI 추천 결과</p>
                <p style={{ fontSize: 14, color: 'var(--color-ink-mute)', marginTop: 2 }}>{result.summary}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
              {result.medicines?.map((med, i) => (
                <div key={i} style={{
                  background: 'var(--color-canvas)', borderRadius: 12, padding: '24px',
                  border: '1px solid var(--color-hairline)', boxShadow: 'rgba(0,55,112,0.08) 0 1px 3px',
                }}>
                  {/* 헤더 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        width: 30, height: 30, background: 'var(--color-primary-subdued)', color: 'var(--color-primary-deep)',
                        borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 500, flexShrink: 0,
                      }}>{i + 1}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 500, fontSize: 17, color: 'var(--color-ink)' }}>{med.name}</span>
                        {med.db_id && (
                          <span className="pill-tag-soft" style={{ fontSize: 11, fontWeight: 500 }}>
                            DB 등록
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/medicines/search?q=${encodeURIComponent(med.name)}`)}
                      style={{ fontSize: 13, color: 'var(--color-primary)', background: 'var(--color-canvas-soft)', border: 'none', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' }}
                    >
                      종류 보기 →
                    </button>
                  </div>

                  {/* 추천 이유 */}
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-ink-secondary)', marginBottom: 4 }}>추천 이유</p>
                    <p style={{ fontSize: 14, color: 'var(--color-ink-mute)', lineHeight: 1.65 }}>{med.reason}</p>
                  </div>

                  {/* 복용법 */}
                  {med.usage && (
                    <div style={{ marginBottom: 10, background: 'var(--color-canvas-soft)', borderRadius: 10, padding: '10px 14px' }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-ink-secondary)', marginBottom: 3 }}>💊 복용 방법</p>
                      <p style={{ fontSize: 13, color: 'var(--color-ink-mute)', lineHeight: 1.6 }}>{med.usage}</p>
                    </div>
                  )}

                  {/* 주의사항 + 부작용 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ background: '#fffbeb', borderRadius: 10, padding: '10px 14px' }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: '#d97706', marginBottom: 3 }}>⚠ 주의사항</p>
                      <p style={{ fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>{med.caution}</p>
                    </div>
                    {med.side_effects && (
                      <div style={{ background: '#fff1f2', borderRadius: 10, padding: '10px 14px' }}>
                        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-ruby)', marginBottom: 3 }}>🔴 부작용</p>
                        <p style={{ fontSize: 13, color: '#9f1239', lineHeight: 1.6 }}>{med.side_effects}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {result.advice && (
              <div style={{ background: 'var(--color-canvas-soft)', border: '1px solid var(--color-hairline)', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 18 }}>💡</span>
                <p style={{ fontSize: 14, color: 'var(--color-ink)', lineHeight: 1.6 }}>{result.advice}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── 기능 소개 ─── */}
      {!result && (
        <>
          <section className="pf-section-pad" style={{ padding: '80px 32px', backgroundColor: 'var(--color-canvas)' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>

              {/* AI 플로우 3단계 */}
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-primary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                  어떻게 동작하나요
                </p>
                <h2 style={{ fontSize: 30, fontWeight: 300, letterSpacing: '-0.3px', color: 'var(--color-ink)', marginBottom: 40 }}>
                  3단계로 완성되는 AI 약 추천
                </h2>
                <div className="pf-step-flow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap' }}>
                  {[
                    { step: '01', icon: '🗣️', title: '증상 입력', desc: '불편한 증상을\n자연어로 입력', highlight: false },
                    { step: '02', icon: '🤖', title: 'AI 분석', desc: 'AI가 증상을 분석해\n약품 3종 추천', highlight: true },
                    { step: '03', icon: '🏥', title: '약국 재고 확인', desc: '근처 약국의\n보유 재고 즉시 확인', highlight: false },
                  ].map((item, idx) => (
                    <span key={item.step} style={{ display: 'contents' }}>
                      <div className="pf-step-card" style={{
                        background: item.highlight ? 'var(--color-primary-subdued)' : 'var(--color-canvas)',
                        border: item.highlight ? '1px solid var(--color-primary-soft)' : '1px solid var(--color-hairline)',
                        borderRadius: 12, padding: '28px 24px', width: 180, textAlign: 'center',
                        boxShadow: item.highlight ? 'rgba(83,58,253,0.15) 0 4px 20px' : 'rgba(0,55,112,0.08) 0 1px 3px',
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 500, color: item.highlight ? 'var(--color-primary-deep)' : 'var(--color-ink-mute)', marginBottom: 10, letterSpacing: '0.05em' }}>STEP {item.step}</div>
                        <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
                        <div style={{ fontWeight: 500, fontSize: 15, color: 'var(--color-ink)', marginBottom: 6 }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-ink-mute)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{item.desc}</div>
                      </div>
                      {idx < 2 && (
                        <div className="pf-step-arrow" style={{ fontSize: 20, color: 'var(--color-hairline-input)', padding: '0 8px' }}>→</div>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* 서비스 소개 헤더 */}
              <div style={{ textAlign: 'center', marginBottom: 56 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-primary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>서비스 소개</p>
                <h2 style={{ fontSize: 36, fontWeight: 300, letterSpacing: '-0.64px', color: 'var(--color-ink)', lineHeight: 1.2 }}>
                  약국 방문 전에<br />미리 확인하세요
                </h2>
              </div>

              {/* 3개 기능 카드 — 모바일 1열, 데스크톱 3열 */}
              <div className="pf-grid-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                {[
                  { icon: '🗺️', tag: '위치 기반', title: '주변 약국 지도', desc: '현재 위치에서 가까운 약국을 지도에서 한눈에 찾고, 거리와 운영 정보를 바로 확인하세요.', link: '/map', cta: '지도 보기', color: 'var(--color-primary)', bg: 'var(--color-canvas-cream)' },
                  { icon: '🤖', tag: 'AI 추천', title: 'AI 증상 분석', desc: '증상을 입력하면 AI가 적합한 일반의약품 3가지를 즉시 추천해드려요. 로그인 없이 바로 사용 가능.', link: null, cta: null, color: 'var(--color-primary-deep)', bg: 'var(--color-primary-subdued)' },
                  { icon: '📦', tag: '실시간', title: '재고 바로 확인', desc: '방문 전에 약국별 보유 재고를 미리 확인해 헛걸음을 없애고 시간을 아끼세요.', link: '/map', cta: '확인하기', color: 'var(--color-ruby)', bg: 'rgba(234,34,97,0.08)' },
                ].map((item) => (
                  <div
                    key={item.title}
                    onClick={() => item.link && navigate(item.link)}
                    className="card-feature-light"
                    style={{
                      cursor: item.link ? 'pointer' : 'default',
                      transition: 'box-shadow 0.2s',
                      boxShadow: 'rgba(0,55,112,0.08) 0 1px 3px',
                    }}
                    onMouseEnter={(e) => item.link && (e.currentTarget.style.boxShadow = 'rgba(0,55,112,0.08) 0 8px 24px, rgba(0,55,112,0.04) 0 2px 6px')}
                    onMouseLeave={(e) => item.link && (e.currentTarget.style.boxShadow = 'rgba(0,55,112,0.08) 0 1px 3px')}
                  >
                    <div style={{ width: 52, height: 52, background: item.bg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 20 }}>
                      {item.icon}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: item.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{item.tag}</div>
                    <h3 style={{ fontSize: 20, fontWeight: 300, color: 'var(--color-ink)', marginBottom: 12 }}>{item.title}</h3>
                    <p style={{ fontSize: 14, color: 'var(--color-ink-mute)', lineHeight: 1.7, marginBottom: 20 }}>{item.desc}</p>
                    {item.cta && (
                      <span style={{ fontSize: 14, fontWeight: 500, color: item.color }}>
                        {item.cta} →
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── 약국 CTA ─── */}
          <section className="pf-section-pad" style={{ padding: '80px 32px', background: 'var(--color-canvas-soft)' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div className="pf-cta-wrap card-pricing-featured" style={{
                padding: '56px 64px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32,
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-primary-soft)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>약국 파트너</p>
                  <h2 style={{ fontSize: 32, fontWeight: 300, letterSpacing: '-0.64px', color: 'var(--color-on-primary)', lineHeight: 1.25, marginBottom: 12 }}>
                    약국을 운영하시나요?
                  </h2>
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, fontWeight: 300 }}>
                    재고를 등록하고 더 많은 고객에게 약국을 알리세요.<br />
                    관리자 승인 후 서비스를 시작할 수 있습니다.
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => navigate('/register/pharmacy')}
                    className="btn-primary-pill"
                    style={{ padding: '16px 36px', fontSize: 16, whiteSpace: 'nowrap' }}
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
