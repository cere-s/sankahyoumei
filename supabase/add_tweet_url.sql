-- ============================================================
-- participation_entries に埋め込みツイートURL列を追加
-- schema.sql 実行済みの場合はこちらを別途実行してください
-- ============================================================

ALTER TABLE participation_entries
  ADD COLUMN IF NOT EXISTS tweet_url TEXT;
