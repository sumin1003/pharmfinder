import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { isOpenNow } from '../utils/businessHours';

// 마커 색상: 재고 관리 중(green) / 가입 약국(yellow) / 공공데이터만(gray)
const MARKER_COLORS = {
  active: '#10b981',
  registered: '#f59e0b',
  public: '#94a3b8',
};

function makeMarkerEl(color) {
  const el = document.createElement('div');
  el.style.cssText = `
    width: 20px; height: 20px;
    background: ${color};
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    cursor: pointer;
  `;
  return el;
}

// 약국 지도 페이지 — 공공데이터 기반 전체 약국을 지도에 표시, 가입+재고 약국은 녹색으로 구분
export default function PharmacyMapPage() {
  const [pharmacies, setPharmacies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [kakaoError, setKakaoError] = useState('');
  const [myLocation, setMyLocation] = useState(null);
  const [kakaoLoaded, setKakaoLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'list' (모바일 전용)
  // 카카오 실시간 검색은 좌표+이름 매칭이 실패하면 가입 약국도 놓칠 수 있어,
  // 매칭에 의존하지 않는 "가입 약국만" 목록(DB 직접 조회)을 별도로 제공
  const [registeredOnly, setRegisteredOnly] = useState(false);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const overlaysRef = useRef([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const medicineId = searchParams.get('medicine');

  // 화면 너비 변경 감지
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    if (window.kakao?.maps) { setKakaoLoaded(true); return; }
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_MAP_APP_KEY}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = () => {
      try { window.kakao.maps.load(() => setKakaoLoaded(true)); }
      catch { setKakaoError('카카오맵 초기화에 실패했습니다. API 키 또는 도메인 설정을 확인하세요.'); }
    };
    script.onerror = () => setKakaoError('카카오맵을 불러오지 못했습니다. 카카오 개발자 콘솔에서 도메인을 확인하세요.');
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setMyLocation({ lat: 37.5665, lng: 126.978 }),
    );
  }, []);

  const fetchPharmacies = async () => {
    setLoading(true);
    try {
      const params = { lat: myLocation.lat, lng: myLocation.lng, radius: 3 };
      if (medicineId) params.medicineId = medicineId;
      if (registeredOnly) {
        // 가입 약국 전용 조회 — pharmacies 테이블을 직접 조회하므로 카카오 매칭 실패와 무관하게 항상 정확함
        const res = await api.get('/pharmacies/nearby', { params });
        setPharmacies(res.data.map((p) => ({ ...p, is_registered: true, linked_pharmacy_id: p.id })));
      } else {
        const res = await api.get('/pharmacies/public/nearby', { params });
        setPharmacies(res.data);
      }
    } catch {
      setError('약국 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const initMap = () => {
    if (!window.kakao?.maps || !mapRef.current) return;
    const { kakao } = window;
    const center = new kakao.maps.LatLng(myLocation.lat, myLocation.lng);
    mapInstance.current = new kakao.maps.Map(mapRef.current, { center, level: 5 });

    const dot = document.createElement('div');
    dot.style.cssText = `
      width: 16px; height: 16px;
      background: #3b82f6; border: 3px solid white; border-radius: 50%;
      box-shadow: 0 2px 8px rgba(59,130,246,0.6);
    `;
    new kakao.maps.CustomOverlay({ position: center, content: dot, map: mapInstance.current, yAnchor: 0.5 });
  };

  useEffect(() => {
    if (!myLocation || !kakaoLoaded) return;
    fetchPharmacies();
    initMap();
  }, [myLocation, kakaoLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // "가입 약국만 보기" 토글 시 재조회
  useEffect(() => {
    if (!myLocation) return;
    fetchPharmacies();
  }, [registeredOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapInstance.current || pharmacies.length === 0) return;
    const { kakao } = window;

    // 이전 마커 제거
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    pharmacies.forEach((p) => {
      if (!p.latitude || !p.longitude) return;
      const pos = new kakao.maps.LatLng(p.latitude, p.longitude);

      let color = MARKER_COLORS.public;
      if (p.is_registered && p.has_inventory) color = MARKER_COLORS.active;
      else if (p.is_registered) color = MARKER_COLORS.registered;

      const el = makeMarkerEl(color);
      el.addEventListener('click', () => setSelected(p));

      const overlay = new kakao.maps.CustomOverlay({
        position: pos,
        content: el,
        map: mapInstance.current,
        yAnchor: 0.5,
      });
      overlaysRef.current.push(overlay);
    });
  }, [pharmacies]);

  // 약국 클릭 시 이동 경로 결정: 가입 약국이면 기존 상세 페이지, 아니면 공공약국 상세 페이지
  // public_pharmacy_id(실제 DB UUID)가 있으면 그걸로 이동해야 상세 페이지에서 재조회·즐겨찾기가 정상 동작함
  // (카카오 장소ID는 DB 조회 키로 쓸 수 없어, 매칭 실패 시에만 부득이하게 폴백으로 사용)
  const handleDetail = (p) => {
    if (p.is_registered && p.linked_pharmacy_id) navigate(`/pharmacies/${p.linked_pharmacy_id}`);
    else navigate(`/pharmacies/public/${p.public_pharmacy_id || p.id}`, { state: { pharmacy: p } });
  };

  const markerLegend = [
    { color: MARKER_COLORS.active, label: '재고 관리 중' },
    { color: MARKER_COLORS.registered, label: '가입 약국' },
    { color: MARKER_COLORS.public, label: '일반 약국' },
  ];

  const TAB_H = 48; // 모바일 탭 바 높이
  const HEADER_H = 64 + 32; // 헤더 + 배너 높이 (배너 약 32px)
  const mobileContentH = `calc(100vh - ${HEADER_H + TAB_H}px)`;
  const desktopH = `calc(100vh - ${HEADER_H}px)`;

  // 약국 목록 패널 (사이드바 / 모바일 목록 탭)
  // display 속성으로 숨김 — mapRef DOM 언마운트 방지를 위해 && 대신 사용
  const listPanel = (
    <div style={{
      width: isMobile ? '100%' : 320,
      flexShrink: 0,
      background: 'white',
      borderRight: isMobile ? 'none' : '1px solid #e2e8f0',
      overflowY: 'auto',
      display: (!isMobile || activeTab === 'list') ? 'flex' : 'none',
      flexDirection: 'column',
      height: isMobile ? mobileContentH : desktopH,
    }}>
      <div style={{ padding: 16, borderBottom: '1px solid #f1f5f9' }}>
        <h2 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
          {medicineId ? '재고 있는 약국' : '주변 약국'}
          <span style={{ marginLeft: 8, fontSize: 14, color: '#94a3b8', fontWeight: 400 }}>{pharmacies.length}곳</span>
        </h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
          {markerLegend.map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              <span style={{ fontSize: 11, color: '#64748b' }}>{label}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setRegisteredOnly((v) => !v)}
          style={{
            fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
            border: registeredOnly ? 'none' : '1px solid #e2e8f0',
            background: registeredOnly ? '#059669' : 'white',
            color: registeredOnly ? 'white' : '#64748b',
          }}
        >
          {registeredOnly ? '✓ 가입 약국만 보는 중' : '가입 약국만 보기'}
        </button>
      </div>

      {loading && <p style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>검색 중...</p>}
      {error && <p style={{ padding: 16, textAlign: 'center', color: '#f87171', fontSize: 14 }}>{error}</p>}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {pharmacies.map((p) => (
          <div
            key={p.id}
            onClick={() => {
              setSelected(p);
              if (isMobile) setActiveTab('map');
            }}
            style={{
              padding: 16,
              borderBottom: '1px solid #f1f5f9',
              cursor: 'pointer',
              background: selected?.id === p.id ? '#f0fdf4' : 'white',
              borderLeft: `4px solid ${selected?.id === p.id ? '#10b981' : 'transparent'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: p.is_registered && p.has_inventory ? MARKER_COLORS.active : p.is_registered ? MARKER_COLORS.registered : MARKER_COLORS.public,
              }} />
              <h3 style={{ fontWeight: 500, color: '#0f172a', fontSize: 14 }}>{p.name}</h3>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4, paddingLeft: 14 }}>{p.address}</p>
            <div style={{ paddingLeft: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {p.distance !== undefined && (
                <span style={{ fontSize: 12, color: '#10b981' }}>{p.distance.toFixed(1)}km</span>
              )}
              {p.is_registered && p.has_inventory && (
                <span style={{ fontSize: 11, background: '#dcfce7', color: '#16a34a', padding: '1px 6px', borderRadius: 999 }}>재고 관리 중</span>
              )}
              {p.is_registered && !p.has_inventory && (
                <span style={{ fontSize: 11, background: '#fef3c7', color: '#d97706', padding: '1px 6px', borderRadius: 999 }}>가입 약국</span>
              )}
              {p.business_hours && isOpenNow(p.business_hours) === true && (
                <span style={{ fontSize: 11, background: '#dcfce7', color: '#16a34a', padding: '1px 6px', borderRadius: 999 }}>영업 중</span>
              )}
              {p.business_hours && isOpenNow(p.business_hours) === false && (
                <span style={{ fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '1px 6px', borderRadius: 999 }}>영업 종료</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 지도 패널 — display 속성으로 숨김으로써 mapRef DOM을 항상 유지
  const mapPanel = (
    <div style={{ flex: 1, position: 'relative', height: isMobile ? mobileContentH : desktopH, display: (!isMobile || activeTab === 'map') ? 'block' : 'none' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {kakaoError && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🗺️</div>
          <p style={{ color: '#dc2626', fontSize: 14, fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>카카오맵 로드 실패</p>
          <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>{kakaoError}</p>
        </div>
      )}
      {!kakaoLoaded && !kakaoError && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#64748b', fontSize: 14 }}>
          지도를 불러오는 중입니다...
        </div>
      )}

      {/* 선택된 약국 팝업 */}
      {selected && (
        <div style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'white', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          padding: 20, width: 'min(320px, calc(100vw - 32px))', zIndex: 10,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <h3 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{selected.name}</h3>
              {selected.is_registered && selected.has_inventory && (
                <span style={{ fontSize: 12, background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 999 }}>재고 관리 중</span>
              )}
              {selected.is_registered && !selected.has_inventory && (
                <span style={{ fontSize: 12, background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 999 }}>가입 약국</span>
              )}
              {!selected.is_registered && (
                <span style={{ fontSize: 12, background: '#f1f5f9', color: '#94a3b8', padding: '2px 8px', borderRadius: 999 }}>공공데이터 약국</span>
              )}
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16, padding: 0, marginLeft: 8 }}>✕</button>
          </div>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>{selected.address}</p>
          {selected.phone && <p style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>{selected.phone}</p>}
          {selected.business_hours && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>{selected.business_hours}</span>
                {isOpenNow(selected.business_hours) === true && (
                  <span style={{ fontSize: 11, background: '#dcfce7', color: '#16a34a', padding: '2px 7px', borderRadius: 999, fontWeight: 600 }}>영업 중</span>
                )}
                {isOpenNow(selected.business_hours) === false && (
                  <span style={{ fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '2px 7px', borderRadius: 999, fontWeight: 600 }}>영업 종료</span>
                )}
              </div>
              {!selected.is_registered && (
                <p style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>공공데이터 기준, 실제 영업시간과 다를 수 있어요</p>
              )}
            </div>
          )}
          {!selected.business_hours && selected.phone && <div style={{ marginBottom: 8 }} />}
          {!selected.business_hours && !selected.phone && <div style={{ marginBottom: 12 }} />}
          <button
            onClick={() => handleDetail(selected)}
            style={{ width: '100%', padding: '10px 0', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}
          >
            {selected.is_registered ? '상세보기 / 재고 확인' : '약국 정보 보기'}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
      {/* 모바일 탭 바 */}
      {isMobile && (
        <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid #e2e8f0', height: TAB_H }}>
          {[
            { id: 'map', label: '🗺️ 지도' },
            { id: 'list', label: `📋 목록 (${pharmacies.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? '#059669' : '#64748b',
                borderBottom: `2px solid ${activeTab === tab.id ? '#10b981' : 'transparent'}`,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* 두 패널 항상 렌더링 — 각 패널 내부 display 속성으로 표시/숨김 */}
      {listPanel}
      {mapPanel}
    </div>
  );
}
