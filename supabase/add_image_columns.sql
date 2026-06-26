-- ============================================================
-- 参加表明への画像（Cloudflare R2）用カラム追加
-- image_url は既存。残りを追加する。
-- Supabase SQL Editor で実行してください
-- ============================================================

ALTER TABLE participation_entries
  ADD COLUMN IF NOT EXISTS image_key        TEXT,
  ADD COLUMN IF NOT EXISTS image_alt        TEXT,
  ADD COLUMN IF NOT EXISTS image_width      INTEGER,
  ADD COLUMN IF NOT EXISTS image_height     INTEGER,
  ADD COLUMN IF NOT EXISTS image_updated_at TIMESTAMPTZ;
