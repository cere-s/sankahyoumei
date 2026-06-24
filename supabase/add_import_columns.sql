-- ============================================================
-- events テーブルへのインポート管理カラム追加
-- schema.sql 実行済みの場合はこちらを別途実行してください
-- ============================================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS source_site   TEXT,
  ADD COLUMN IF NOT EXISTS source_url    TEXT,
  ADD COLUMN IF NOT EXISTS external_id   TEXT,
  ADD COLUMN IF NOT EXISTS imported_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_imported   BOOLEAN NOT NULL DEFAULT FALSE,
  -- 詳細情報（外部取得イベント用）
  ADD COLUMN IF NOT EXISTS organizer     TEXT,
  ADD COLUMN IF NOT EXISTS address       TEXT,
  ADD COLUMN IF NOT EXISTS x_url         TEXT,
  ADD COLUMN IF NOT EXISTS region        TEXT;

-- 重複登録防止ユニーク制約
-- ※ 既にインデックスがある場合は先に DROP INDEX IF EXISTS events_source_external_id_unique; を実行
ALTER TABLE events
  ADD CONSTRAINT IF NOT EXISTS events_source_external_id_unique
  UNIQUE (source_site, external_id);
