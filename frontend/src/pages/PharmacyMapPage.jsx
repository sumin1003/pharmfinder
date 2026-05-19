import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

// 약국 지도 페이지 — 현재 위치 기반으로 주변 약국을 카카오맵에 마커로 표시하고 목록을 사이드바에 나열
export default function PharmacyMapPage() {
  const [pharmacies, setPharmacies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [kakaoError, setKakaoError] = useState('');
  const [myLocation, setMyLocation] = useState(null);
  const [kakaoLoaded, setKakaoLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const medicineId = searchParams.get('medicine');

  // 카카오맵 SDK 동적 로드 — onerror로 401/네트워크 실패 감지
  useEffect(() => {
    if (window.kakao?.maps) {
      setKakaoLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_MAP_APP_KEY}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = () => {
      try {
        window.kakao.maps.load(() => setKakaoLoaded(true));
      } catch {
        setKakaoError('카카오맵 초기화에 실패했습니다. API 키 또는 도메인 설정을 확인하세요.');
      }
    };
    script.onerror = () => {
      setKakaoError('카카오맵을 불러오지 못했습니다. 카카오 개발자 콘솔에서 localhost:5173 도메인이 등록됐는지 확인하세요.');
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setMyLocation({ lat: 37.5665, lng: 126.978 }),
    );
  }, []);

  // 현재 위치와 반경을 파라미터로 주변 약국 목록 API 호출 — medicineId가 있으면 재고 보유 약국만 필터링
  const fetchPharmacies = async () => {
    setLoading(true);
    try {
      const params = { lat: myLocation.lat, lng: myLocation.lng, radius: 3 };
      if (medicineId) params.medicineId = medicineId;
      const res = await api.get('/pharmacies/nearby', { params });
      setPharmacies(res.data);
    } catch {
      setError('약국 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 카카오맵 인스턴스 초기화 — 현재 위치를 중심으로 지도를 생성하고 내 위치를 파란 원으로 표시
  const initMap = () => {
    if (!window.kakao?.maps || !mapRef.current) return;
    const { kakao } = window;
    const center = new kakao.maps.LatLng(myLocation.lat, myLocation.lng);
    mapInstance.current = new kakao.maps.Map(mapRef.current, { center, level: 5 });

    const dot = document.createElement('div');
    dot.style.cssText = `
      width: 16px; height: 16px;
      background: #3b82f6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(59,130,246,0.6);
    `;
    new kakao.maps.CustomOverlay({
      position: center,
      content: dot,
      map: mapInstance.current,
      yAnchor: 0.5,
    });
  };

  useEffect(() => {
    if (!myLocation || !kakaoLoaded) return;
    fetchPharmacies();
    initMap();
  }, [myLocation, kakaoLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapInstance.current || pharmacies.length === 0) return;
    const { kakao } = window;

    pharmacies.forEach((p) => {
      if (!p.latitude || !p.longitude) return;
      const pos = new kakao.maps.LatLng(p.latitude, p.longitude);
      const marker = new kakao.maps.Marker({ position: pos, map: mapInstance.current });

      kakao.maps.event.addListener(marker, 'click', () => setSelected(p));
    });
  }, [pharmacies]);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* 사이드바 */}
      <div style={{
        width: 320,
        flexShrink: 0,
        background: 'white',
        borderRight: '1px solid #e2e8f0',
        overflowY: 'auto',
      }}>
        <div style={{ padding: 16, borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontWeight: 700, color: '#0f172a' }}>
            {medicineId ? '재고 있는 약국' : '주변 약국'}
            <span style={{ marginLeft: 8, fontSize: 14, color: '#94a3b8', fontWeight: 400 }}>
              {pharmacies.length}곳
            </span>
          </h2>
        </div>

        {loading && (
          <p style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>검색 중...</p>
        )}
        {error && (
          <p style={{ padding: 16, textAlign: 'center', color: '#f87171', fontSize: 14 }}>{error}</p>
        )}

        <div>
          {pharmacies.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelected(p)}
              style={{
                padding: 16,
                borderBottom: '1px solid #f1f5f9',
                cursor: 'pointer',
                background: selected?.id === p.id ? '#f0fdf4' : 'white',
                borderLeft: selected?.id === p.id ? '4px solid #10b981' : '4px solid transparent',
              }}
            >
              <h3 style={{ fontWeight: 500, color: '#0f172a', marginBottom: 4 }}>{p.name}</h3>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{p.address}</p>
              {p.distance !== undefined && (
                <span style={{ fontSize: 12, color: '#10b981' }}>{p.distance.toFixed(1)}km</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 지도 영역 */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {kakaoError && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            padding: 32,
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🗺️</div>
            <p style={{ color: '#dc2626', fontSize: 14, fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>
              카카오맵 로드 실패
            </p>
            <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>
              {kakaoError}
            </p>
          </div>
        )}
        {!kakaoLoaded && !kakaoError && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f1f5f9',
            color: '#64748b',
            fontSize: 14,
          }}>
            지도를 불러오는 중입니다...
          </div>
        )}

        {/* 선택된 약국 팝업 */}
        {selected && (
          <div style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            borderRadius: 20,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            padding: 20,
            width: 320,
            zIndex: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <h3 style={{ fontWeight: 700, color: '#0f172a' }}>{selected.name}</h3>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 16,
                  padding: 0,
                }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>{selected.address}</p>
            {selected.phone && (
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>{selected.phone}</p>
            )}
            <button
              onClick={() => navigate(`/pharmacies/${selected.id}`)}
              style={{
                width: '100%',
                padding: '10px 0',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
              }}
            >
              상세보기 / 재고 확인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
