import ReactGA from 'react-ga4';

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// 프로덕션 빌드이고 측정 ID가 설정된 경우에만 GA 활성화
const isEnabled = () => import.meta.env.PROD && Boolean(GA_ID);

// GA4 초기화 — 앱 최초 마운트 시 1회 호출
export const initGA = () => {
  if (isEnabled()) {
    ReactGA.initialize(GA_ID);
  }
};

// 현재 경로를 pageview 이벤트로 GA4에 전송
export const trackPageView = (path) => {
  if (isEnabled()) {
    ReactGA.send({ hitType: 'pageview', page: path });
  }
};
