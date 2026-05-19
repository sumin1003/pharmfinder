-- OAuth 소셜 로그인 지원을 위한 스키마 변경
-- Supabase 대시보드 SQL 에디터에서 실행하세요
-- https://supabase.com/dashboard/project/mrwsngaxugnxdbvjqabo/sql/new

-- 1. password 컬럼 NOT NULL 해제 (소셜 계정은 비밀번호 없음)
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- 2. 소셜 로그인 제공자 (kakao / google / naver / local)
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'local';

-- 3. 제공자별 고유 사용자 ID
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id TEXT;

-- 4. provider + provider_id 복합 유니크 인덱스 (NULL 제외)
CREATE UNIQUE INDEX IF NOT EXISTS users_provider_id_idx
  ON users (provider, provider_id)
  WHERE provider_id IS NOT NULL;
