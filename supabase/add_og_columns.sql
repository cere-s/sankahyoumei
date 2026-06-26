-- ============================================================
-- OGP画像をR2に静的ホスティングするためのカラム
-- Supabase SQL Editor で実行してください
-- ============================================================

ALTER TABLE participation_entries
  ADD COLUMN IF NOT EXISTS og_image_url TEXT,
  ADD COLUMN IF NOT EXISTS og_image_key TEXT;
