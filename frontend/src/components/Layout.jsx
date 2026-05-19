import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// 공통 레이아웃 — 헤더(네비게이션)·본문·푸터를 렌더링하고 역할에 따라 메뉴를 조건부 노출
export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 현재 경로와 비교해 활성 네비게이션 링크 여부를 반환
  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* 헤더 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2e8f0',
        width: '100%',
      }}>
        <div className="max-w-screen-xl mx-auto px-8" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

          <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link to="/map" style={{
              padding: '8px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: 'none',
              color: isActive('/map') ? '#059669' : '#64748b',
              backgroundColor: isActive('/map') ? '#ecfdf5' : 'transparent',
            }}>약국 찾기</Link>

            {user?.role === 'admin' && (
              <>
                <Link to="/admin" style={{
                  padding: '8px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: 'none',
                  color: isActive('/admin') ? '#059669' : '#64748b',
                  backgroundColor: isActive('/admin') ? '#ecfdf5' : 'transparent',
                }}>관리자</Link>
                <Link to="/admin/overview" style={{
                  padding: '8px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: 'none',
                  color: isActive('/admin/overview') ? '#059669' : '#64748b',
                  backgroundColor: isActive('/admin/overview') ? '#ecfdf5' : 'transparent',
                }}>전체현황</Link>
              </>
            )}
            {user?.role === 'pharmacy' && (
              <Link to="/pharmacy/dashboard" style={{
                padding: '8px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: 'none',
                color: isActive('/pharmacy/dashboard') ? '#059669' : '#64748b',
                backgroundColor: isActive('/pharmacy/dashboard') ? '#ecfdf5' : 'transparent',
              }}>재고 관리</Link>
            )}
            {user && user.role !== 'admin' && (
              <Link to="/favorites" style={{
                padding: '8px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: 'none',
                color: isActive('/favorites') ? '#059669' : '#64748b',
                backgroundColor: isActive('/favorites') ? '#ecfdf5' : 'transparent',
              }}>즐겨찾기</Link>
            )}

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #a7f3d0, #6ee7b7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: '#065f46',
                  }}>{user.name[0]}</div>
                  <span style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>{user.name}</span>
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
        </div>
      </header>

      {/* 본문 */}
      <main style={{ flex: 1, width: '100%' }}>
        {children}
      </main>

      {/* 푸터 */}
      <footer style={{ backgroundColor: 'white', borderTop: '1px solid #e2e8f0', padding: '32px 0' }}>
        <div className="max-w-screen-xl mx-auto px-8" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
