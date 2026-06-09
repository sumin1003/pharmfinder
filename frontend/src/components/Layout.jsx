import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// 공통 레이아웃 — 헤더(네비게이션)·본문·푸터를 렌더링하고 역할에 따라 메뉴를 조건부 노출
export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  // 라우트 변경 시 모바일 메뉴 자동 닫기
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/map', label: '약국 찾기', show: true },
    { to: '/admin', label: '관리자', show: user?.role === 'admin' },
    { to: '/admin/overview', label: '전체현황', show: user?.role === 'admin' },
    { to: '/pharmacy/dashboard', label: '재고 관리', show: user?.role === 'pharmacy' },
    { to: '/favorites', label: '즐겨찾기', show: user && user.role !== 'admin' },
  ].filter((l) => l.show);

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* 포트폴리오 면책 배너 */}
      <div style={{
        width: '100%', backgroundColor: '#fef3c7',
        borderBottom: '1px solid #fde68a',
        padding: '8px 16px', textAlign: 'center',
      }}>
        <p className="pf-banner-text" style={{ fontSize: 13, color: '#92400e', margin: 0 }}>
          📌 본 사이트는 <strong>개인 포트폴리오 목적</strong>으로 제작되었으며 상업적으로 운영되지 않습니다.
        </p>
      </div>

      {/* 헤더 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2e8f0',
        width: '100%',
      }}>
        <div className="max-w-screen-xl mx-auto" style={{ padding: '0 16px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 34, height: 34,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
            }}>
              <span style={{ color: 'white', fontSize: 18, lineHeight: 1 }}>+</span>
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>PharmFinder</span>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="pf-desktop-nav" style={{ alignItems: 'center', gap: 8 }}>
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} style={{
                padding: '8px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: 'none',
                color: isActive(link.to) ? '#059669' : '#64748b',
                backgroundColor: isActive(link.to) ? '#ecfdf5' : 'transparent',
              }}>{link.label}</Link>
            ))}

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #a7f3d0, #6ee7b7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: '#065f46',
                  }}>{user.name[0]}</div>
                  <Link to="/profile" style={{ fontSize: 14, color: '#334155', fontWeight: 500, textDecoration: 'none' }}>
                    {user.name}
                  </Link>
                </div>
                <button onClick={() => { logout(); navigate('/'); }} style={{
                  fontSize: 13, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer',
                  padding: '6px 10px', borderRadius: 8,
                }}>로그아웃</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                <Link to="/login" style={{
                  fontSize: 14, color: '#64748b', textDecoration: 'none',
                  padding: '8px 14px', borderRadius: 10,
                }}>로그인</Link>
                <Link to="/register/pharmacy" style={{
                  fontSize: 14, fontWeight: 600, color: 'white', textDecoration: 'none',
                  padding: '9px 18px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                }}>약국 등록</Link>
              </div>
            )}
          </nav>

          {/* 모바일 햄버거 버튼 */}
          <button
            className="pf-mobile-btn"
            onClick={() => setMenuOpen(true)}
            style={{ alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#334155', borderRadius: 8 }}
            aria-label="메뉴 열기"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* 모바일 드로어 */}
      {menuOpen && (
        <>
          {/* 배경 오버레이 */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 99,
              background: 'rgba(0,0,0,0.45)',
            }}
          />
          {/* 드로어 패널 */}
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 100,
            width: 260, background: 'white',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* 드로어 헤더 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <Link to="/" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontSize: 15 }}>+</span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>PharmFinder</span>
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 20, padding: 4 }}
                aria-label="메뉴 닫기"
              >✕</button>
            </div>

            {/* 네비게이션 링크 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'block', padding: '14px 24px', fontSize: 15, fontWeight: 500, textDecoration: 'none',
                    color: isActive(link.to) ? '#059669' : '#334155',
                    background: isActive(link.to) ? '#f0fdf4' : 'transparent',
                    borderLeft: `3px solid ${isActive(link.to) ? '#10b981' : 'transparent'}`,
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* 유저 섹션 */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9' }}>
              {user ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', padding: '8px 0' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #a7f3d0, #6ee7b7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#065f46', flexShrink: 0 }}>
                      {user.name[0]}
                    </div>
                    <span style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>{user.name}</span>
                  </Link>
                  <button
                    onClick={() => { logout(); navigate('/'); setMenuOpen(false); }}
                    style={{ padding: '11px', borderRadius: 10, background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Link to="/login" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '12px', borderRadius: 10, background: '#f1f5f9', color: '#334155', textDecoration: 'none', textAlign: 'center', fontSize: 14, fontWeight: 500 }}>
                    로그인
                  </Link>
                  <Link to="/register/pharmacy" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', textDecoration: 'none', textAlign: 'center', fontSize: 14, fontWeight: 600 }}>
                    약국 등록
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 본문 */}
      <main style={{ flex: 1, width: '100%' }}>
        {children}
      </main>

      {/* 푸터 */}
      <footer style={{ backgroundColor: 'white', borderTop: '1px solid #e2e8f0', padding: '24px 0' }}>
        <div className="max-w-screen-xl mx-auto" style={{ padding: '0 16px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 24, height: 24, background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'white', fontSize: 13 }}>+</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>PharmFinder</span>
          </div>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>© 2026 PharmFinder. 내 주변 약국을 쉽고 빠르게.</p>
        </div>
      </footer>
    </div>
  );
}
