require('dotenv').config();
const cron = require('node-cron');
const app = require('./app');
const { syncFromPublicApi, syncBusinessHoursFromEgen } = require('./services/publicPharmacyService');

const PORT = process.env.PORT || 3000;

// 지정된 포트에서 Express 서버 시작
app.listen(PORT, () => {
  console.log(`PharmFinder API server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// 매일 새벽 3시(KST) = UTC 18:00에 주요 지역 공공약국 데이터 자동 동기화
// KST는 UTC+9이므로 UTC 18:00 = KST 03:00
cron.schedule('0 18 * * *', async () => {
  const targets = [
    { siNm: '서울특별시', sigunguNm: '' },
    { siNm: '경기도',     sigunguNm: '' },
    { siNm: '부산광역시', sigunguNm: '' },
    { siNm: '인천광역시', sigunguNm: '' },
    { siNm: '대구광역시', sigunguNm: '' },
  ];

  console.log('[cron] 공공약국 자동 동기화 시작');
  for (const target of targets) {
    try {
      const result = await syncFromPublicApi(target);
      console.log(`[cron] ${target.siNm} 동기화 완료 — synced: ${result.synced}`);
    } catch (err) {
      console.error(`[cron] ${target.siNm} 동기화 실패:`, err.message);
    }
  }
  console.log('[cron] 공공약국 자동 동기화 완료');

  // EGEN_API_KEY 미설정 시(선택 기능) 조용히 건너뜀
  if (!process.env.EGEN_API_KEY) return;

  // 지역필터가 동작하지 않아 전국 데이터를 배치 단위로 순회 — 매일 1회 호출로 다음 배치만큼 진행
  try {
    const result = await syncBusinessHoursFromEgen();
    console.log(`[cron] 영업시간(E-Gen) 배치 동기화 완료 — processed:${result.processed} matched:${result.matched} unmatched:${result.unmatched} nextPage:${result.nextPage} isComplete:${result.isComplete}`);
  } catch (err) {
    console.error('[cron] 영업시간(E-Gen) 배치 동기화 실패:', err.message);
  }
});
