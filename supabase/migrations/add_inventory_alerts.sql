-- 재고 부족 알림 중복 발송 방지 쿨다운 테이블
-- Supabase 대시보드 SQL 에디터에서 실행하세요

CREATE TABLE IF NOT EXISTS inventory_alerts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id  INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  medicine_id  INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  alerted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_alerts_daily
  ON inventory_alerts (pharmacy_id, medicine_id, (alerted_at::date));
