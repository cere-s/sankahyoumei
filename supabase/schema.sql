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
  -- ユーザー登録イベント（仮登録→運営確認→本登録）
  status       TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('pending', 'published', 'removed')),
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_status     ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

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

  -- コスプレ情報（work_name/character_name は cosplay_plans の1件目との後方互換用）
  work_name       TEXT,
  character_name  TEXT,
  shooting_status TEXT,
  cosplay_plans   JSONB,   -- 当日の予定キャラ配列 [{workTitle,characterName,costumeLabel,timeSlot,planMemo,imageUrl}]

  -- カメラマン情報
  photographer_target_works  TEXT,
  photographer_available_time TEXT,
  photographer_availability  TEXT,
  portfolio_url              TEXT,
  shooting_style             TEXT[],
  shooting_targets           JSONB,   -- 撮りたい作品・キャラ配列 [{workTitle,characterName,timeSlot,memo}]

  -- ステップフォーム：見つけてもらう設定
  time_band       TEXT,   -- 参加時間帯 morning/noon/evening/night/allday/undecided
  greeting_level  TEXT,   -- 挨拶歓迎度 welcome/mutual/acquaintance/quiet
  shooting_policy TEXT,   -- 撮影相談可否 ok/mutual/acquaintance/no
  liked_works     TEXT,   -- 一般・未定：好きな作品
  want_works      TEXT,   -- 一般・未定：会いたい作品

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

-- events: removed 以外は全員が読み取り可能（pending も表示する）
CREATE POLICY "events_public_select"
  ON events FOR SELECT
  USING (status <> 'removed');

-- events: ログインユーザーは自分名義の仮登録イベントを作成可能
CREATE POLICY "events_user_insert"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = created_by AND status = 'pending');

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

-- ============================================================
-- ユーザー同士の軽い交流（意思表示）機能
-- 詳細は add_interactions.sql を参照。書き込み・読み取りは service_role 経由。
-- ============================================================

CREATE TABLE IF NOT EXISTS interaction_intents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  from_user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_entry_id   UUID NOT NULL REFERENCES participation_entries(id) ON DELETE CASCADE,
  intent_type   TEXT NOT NULL
    CHECK (intent_type IN ('want_to_shoot', 'want_to_be_shot', 'want_to_meet')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_user_id, to_entry_id, intent_type)
);

CREATE INDEX IF NOT EXISTS idx_intents_to_user   ON interaction_intents(to_user_id);
CREATE INDEX IF NOT EXISTS idx_intents_from_user ON interaction_intents(from_user_id);
CREATE INDEX IF NOT EXISTS idx_intents_event     ON interaction_intents(event_id);
CREATE INDEX IF NOT EXISTS idx_intents_to_entry  ON interaction_intents(to_entry_id);

CREATE TABLE IF NOT EXISTS interaction_hides (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_intent_id  UUID NOT NULL REFERENCES interaction_intents(id) ON DELETE CASCADE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, interaction_intent_id)
);

CREATE INDEX IF NOT EXISTS idx_hides_user ON interaction_hides(user_id);

CREATE TABLE IF NOT EXISTS user_blocks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id         UUID REFERENCES events(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (blocker_user_id, blocked_user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON user_blocks(blocker_user_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON user_blocks(blocked_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS user_blocks_global_unique
  ON user_blocks(blocker_user_id, blocked_user_id)
  WHERE event_id IS NULL;

CREATE TRIGGER trg_intents_updated_at
  BEFORE UPDATE ON interaction_intents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE interaction_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_hides    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks          ENABLE ROW LEVEL SECURITY;
