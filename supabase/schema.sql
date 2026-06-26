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
  region       TEXT,
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
  -- 画像（Cloudflare R2）
  image_key        TEXT,
  image_alt        TEXT,
  image_width      INTEGER,
  image_height     INTEGER,
  image_updated_at TIMESTAMPTZ,
  -- OGP画像（R2に静的ホスティング）
  og_image_url     TEXT,
  og_image_key     TEXT,
  tweet_url TEXT,
  comment   TEXT,
  note      TEXT,

  -- セキュリティ（ハッシュのみ保存）
  edit_token_hash     TEXT,
  delete_password_hash TEXT,

  -- Xログイン連携
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- Xログインユーザー
  x_user_id          TEXT,                       -- X provider user id（スナップショット）
  x_username_snapshot TEXT,                       -- 作成時点のXユーザー名
  auth_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (auth_status IN ('verified_x', 'unverified', 'legacy_token', 'hidden')),
  is_verified_x BOOLEAN DEFAULT FALSE,            -- 旧ツイート照合フラグ（互換のため残置）
  is_hidden   BOOLEAN DEFAULT FALSE,              -- 削除フラグ（物理削除の代替）

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ---- インデックス ----
CREATE INDEX IF NOT EXISTS idx_entries_event_id ON participation_entries(event_id);
CREATE INDEX IF NOT EXISTS idx_entries_is_hidden ON participation_entries(is_hidden);
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON participation_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_x_id ON participation_entries(x_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

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

-- participation_entries: ログインユーザーは自分名義（user_id = auth.uid()）の参加表明を作成可能
CREATE POLICY "entries_auth_insert"
  ON participation_entries FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- participation_entries: ログインユーザーは自分の参加表明のみ更新可能
CREATE POLICY "entries_owner_update"
  ON participation_entries FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 旧トークン方式の作成・編集・削除は service_role でサーバー側検証後に実行する（RLSバイパス）

-- ============================================================
-- profiles（Xログインユーザー情報）
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  x_user_id      TEXT UNIQUE,
  x_username     TEXT,
  x_display_name TEXT,
  x_avatar_url   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- profiles: 公開表示に必要な情報のみ全員が読み取り可能
--（保持しているのは公開Xプロフィール項目のみ。トークン等の秘密情報は保存しない）
CREATE POLICY "profiles_public_select"
  ON profiles FOR SELECT
  USING (true);

-- profiles: 本人のみ作成・更新可能
CREATE POLICY "profiles_owner_insert"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_owner_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);
