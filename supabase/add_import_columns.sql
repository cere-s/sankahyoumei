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
  ADD COLUMN IF NOT EXISTS x_url         TEXT;

-- 重複登録防止ユニーク制約（外部IDがある場合のみ）
CREATE UNIQUE INDEX IF NOT EXISTS events_source_external_id_unique
  ON events (source_site, external_id)
  WHERE external_id IS NOT NULL;
