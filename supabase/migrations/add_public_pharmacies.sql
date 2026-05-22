-- 공공데이터(건강보험심사평가원) 기반 전국 약국 캐시 테이블
-- Supabase 대시보드 SQL 에디터에서 실행하세요
-- https://supabase.com/dashboard/project/mrwsngaxugnxdbvjqabo/sql/new

CREATE TABLE IF NOT EXISTS public_pharmacies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hpid                TEXT UNIQUE NOT NULL,
  name                TEXT NOT NULL,
  address             TEXT,
  phone               TEXT,
  latitude            DOUBLE PRECISION,
  longitude           DOUBLE PRECISION,
  linked_pharmacy_id  UUID REFERENCES pharmacies(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_pharmacies_linked ON public_pharmacies(linked_pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_public_pharmacies_location ON public_pharmacies(latitude, longitude) WHERE latitude IS NOT NULL;
