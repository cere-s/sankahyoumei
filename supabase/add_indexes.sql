-- ============================================================
-- パフォーマンス向上のためのインデックス追加＋制約強化
-- Supabase SQL Editor で実行してください
-- ============================================================

-- FK / 絞り込みに使う列へインデックス（フルスキャン回避）
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON participation_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_x_id    ON participation_entries(x_id);

-- イベント一覧は date 昇順で取得するため
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

-- auth_status の値を限定（不正値の混入防止）
ALTER TABLE participation_entries
  DROP CONSTRAINT IF EXISTS participation_entries_auth_status_check;
ALTER TABLE participation_entries
  ADD CONSTRAINT participation_entries_auth_status_check
  CHECK (auth_status IN ('verified_x', 'unverified', 'legacy_token', 'hidden'));
