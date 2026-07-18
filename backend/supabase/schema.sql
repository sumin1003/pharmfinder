-- 참고: 이 파일은 이전 작업에서 실제 스키마 대신 쿼리 실행 결과 문구("Success. No rows returned")만
-- 남아있었습니다. 전체 스키마 히스토리를 알 수 없어 아래부터는 마이그레이션 단위로 이력을 남깁니다.
-- 실제 스키마 원본은 Supabase 대시보드(Table Editor / SQL Editor)를 기준으로 확인하세요.

-- ========================================
-- Migration: 비밀번호 재설정(forgot-password) 토큰 컬럼 추가
-- Date: 2026-07-15
-- ========================================

-- users 테이블에 비밀번호 재설정 토큰·만료시각 컬럼 추가
-- reset_token: POST /api/auth/forgot-password 에서 발급, POST /api/auth/reset-password 에서 검증 후 NULL로 초기화
-- reset_token_expires_at: 발급 시점 + 30분 (authService.js REQUEST_TOKEN_TTL_MS 기준)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_token TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;

-- 토큰으로 사용자를 조회하는 조회(WHERE reset_token = ...)가 빈번하므로 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;

-- ========================================
-- Migration: 공공데이터 약국 요일별 영업시간(E-Gen 연동) 컬럼 추가
-- Date: 2026-07-15
-- ========================================

-- public_pharmacies에 국립중앙의료원(E-Gen) API 동기화 결과인 요일별 영업시간을 저장
-- business_hours_weekly 예시: {"mon":"09:00-18:00", ..., "sun":null, "holiday":null}
ALTER TABLE public_pharmacies
  ADD COLUMN IF NOT EXISTS business_hours_weekly JSONB,
  ADD COLUMN IF NOT EXISTS business_hours_synced_at TIMESTAMPTZ;

-- ========================================
-- Migration: 배치 작업 진행 상태 저장 테이블 (E-Gen 영업시간 동기화용)
-- Date: 2026-07-15
-- ========================================

-- E-Gen 지역필터(Q0/Q1)가 실제로는 동작하지 않아 전국 데이터를 페이지 단위로 나눠 순회하는 방식으로 전환.
-- job_name='egen_business_hours' 1행만 사용해 "다음에 어느 페이지부터 시작할지"를 기억한다.
CREATE TABLE IF NOT EXISTS sync_progress (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name    TEXT UNIQUE NOT NULL,
  next_page   INTEGER NOT NULL DEFAULT 1,
  total_count INTEGER,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
