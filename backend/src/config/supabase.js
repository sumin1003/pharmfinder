const { createClient } = require('@supabase/supabase-js');

// 싱글턴 클라이언트 인스턴스 캐시
let _client = null;

// 환경 변수 검증 후 Supabase 클라이언트를 지연 생성하는 팩토리
const getClient = () => {
  if (!_client) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
      throw new Error('SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 .env에 설정되지 않았습니다.');
    _client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return _client;
};

// Proxy를 통해 클라이언트를 직접 노출하되, 첫 접근 시 지연 초기화
module.exports = new Proxy({}, { get: (_, prop) => getClient()[prop] });
