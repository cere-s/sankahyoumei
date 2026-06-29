-- ============================================================
-- ステップ式参加表明フォーム用のフィールド追加
--  - shooting_targets: カメラマンの「撮りたい作品・キャラ」配列（cosplay_plans と対）
--  - time_band       : 参加時間帯（morning/noon/evening/night/allday/undecided）
--  - greeting_level  : 挨拶歓迎度（welcome/mutual/acquaintance/quiet）
--  - shooting_policy : 撮影相談可否（ok/mutual/acquaintance/no）
--  - liked_works / want_works : 一般・未定向けの「好きな作品 / 会いたい作品」
-- Supabase SQL Editor で実行してください
-- ============================================================

ALTER TABLE participation_entries
  ADD COLUMN IF NOT EXISTS shooting_targets jsonb,
  ADD COLUMN IF NOT EXISTS time_band       text,
  ADD COLUMN IF NOT EXISTS greeting_level  text,
  ADD COLUMN IF NOT EXISTS shooting_policy text,
  ADD COLUMN IF NOT EXISTS liked_works     text,
  ADD COLUMN IF NOT EXISTS want_works      text;
