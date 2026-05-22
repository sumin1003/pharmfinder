require('dotenv').config();
const cron = require('node-cron');
const app = require('./app');
const { syncFromPublicApi } = require('./services/publicPharmacyService');

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
});
