-- ============================================================
-- ユーザー同士の軽い交流（意思表示）機能
-- 「撮りたい / 撮られたい / 交流したい」をワンタップで送れる仕組み。
-- DM・自由入力メッセージは扱わない。
-- Supabase SQL Editor で実行してください。
-- ============================================================

-- ---- 意思表示 ----
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
  -- 同じ相手・同じ参加表明・同じ種別の重複登録を防ぐ
  UNIQUE (from_user_id, to_entry_id, intent_type)
);

CREATE INDEX IF NOT EXISTS idx_intents_to_user   ON interaction_intents(to_user_id);
CREATE INDEX IF NOT EXISTS idx_intents_from_user ON interaction_intents(from_user_id);
CREATE INDEX IF NOT EXISTS idx_intents_event     ON interaction_intents(event_id);
CREATE INDEX IF NOT EXISTS idx_intents_to_entry  ON interaction_intents(to_entry_id);

-- ---- 非表示（届いた意思表示を自分の画面から隠す。相手には通知しない・データは消さない） ----
CREATE TABLE IF NOT EXISTS interaction_hides (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_intent_id  UUID NOT NULL REFERENCES interaction_intents(id) ON DELETE CASCADE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, interaction_intent_id)
);

CREATE INDEX IF NOT EXISTS idx_hides_user ON interaction_hides(user_id);

-- ---- ブロック（相手からの意思表示を表示しない／相互に意思表示できない） ----
CREATE TABLE IF NOT EXISTS user_blocks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id         UUID REFERENCES events(id) ON DELETE CASCADE,  -- NULL = サービス全体のブロック
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (blocker_user_id, blocked_user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON user_blocks(blocker_user_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON user_blocks(blocked_user_id);

-- event_id が NULL（全体ブロック）の場合、UNIQUE 制約は NULL を区別してしまうため
-- 部分ユニークインデックスで重複を防ぐ
CREATE UNIQUE INDEX IF NOT EXISTS user_blocks_global_unique
  ON user_blocks(blocker_user_id, blocked_user_id)
  WHERE event_id IS NULL;

-- ---- updated_at 自動更新トリガー ----
CREATE TRIGGER trg_intents_updated_at
  BEFORE UPDATE ON interaction_intents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security
-- 書き込み・読み取りはすべて service_role（サーバー側で本人確認後）で行う。
-- anon / authenticated からの直接アクセスはポリシー未定義＝拒否。
-- ============================================================

ALTER TABLE interaction_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_hides    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks          ENABLE ROW LEVEL SECURITY;
