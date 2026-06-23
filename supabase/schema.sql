-- ============================================================
-- コスプレ参加表明サービス スキーマ
-- Supabase SQL Editor で実行してください
-- ============================================================

-- ---- イベント ----
CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  date        DATE NOT NULL,
  location    TEXT NOT NULL,
  official_url TEXT,
  hashtag     TEXT NOT NULL DEFAULT '',
  description TEXT,
  -- 外部取得管理
  source_site  TEXT,
  source_url   TEXT,
  external_id  TEXT,
  imported_at  TIMESTAMPTZ,
  is_imported  BOOLEAN NOT NULL DEFAULT FALSE,
  organizer    TEXT,
  address      TEXT,
  x_url        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 重複登録防止ユニーク制約
ALTER TABLE events
  ADD CONSTRAINT events_source_external_id_unique
  UNIQUE (source_site, external_id);

-- ---- 参加表明 ----
CREATE TABLE IF NOT EXISTS participation_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- 基本情報
  display_name TEXT NOT NULL,
  x_id         TEXT NOT NULL,
  participation_type TEXT NOT NULL
    CHECK (participation_type IN ('cosplay', 'photographer', 'general', 'undecided')),
  participation_day DATE NOT NULL,

  -- コスプレ情報
  work_name       TEXT,
  character_name  TEXT,
  shooting_status TEXT,

  -- カメラマン情報
  photographer_target_works  TEXT,
  photographer_available_time TEXT,
  photographer_availability  TEXT,
  portfolio_url              TEXT,
  shooting_style             TEXT[],

  -- 共通任意
  image_url TEXT,
  comment   TEXT,
  note      TEXT,

  -- セキュリティ（ハッシュのみ保存）
  edit_token_hash     TEXT,
  delete_password_hash TEXT,

  -- 将来の拡張用
  user_id     UUID,                      -- 将来ログイン機能追加時に使用
  is_verified_x BOOLEAN DEFAULT FALSE,   -- X本人確認（将来実装）
  is_hidden   BOOLEAN DEFAULT FALSE,     -- 削除フラグ（物理削除の代替）

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ---- インデックス ----
CREATE INDEX IF NOT EXISTS idx_entries_event_id ON participation_entries(event_id);
CREATE INDEX IF NOT EXISTS idx_entries_is_hidden ON participation_entries(is_hidden);

-- ---- updated_at 自動更新トリガー ----
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_entries_updated_at
  BEFORE UPDATE ON participation_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE participation_entries ENABLE ROW LEVEL SECURITY;

-- events: 全員が読み取り可能
CREATE POLICY "events_public_select"
  ON events FOR SELECT
  USING (true);

-- participation_entries: 非非表示行は全員が読み取り可能
CREATE POLICY "entries_public_select"
  ON participation_entries FOR SELECT
  USING (is_hidden = false);

-- participation_entries: 全員が新規作成可能（ログインなしMVP）
CREATE POLICY "entries_public_insert"
  ON participation_entries FOR INSERT
  WITH CHECK (true);

-- UPDATE / DELETE は RLS では許可しない
-- → サーバーサイドで edit_token_hash を検証してから service_role で実行する
