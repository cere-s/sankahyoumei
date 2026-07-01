-- ============================================================
-- アクセス解析（運営者のみ閲覧）
-- ページ閲覧・滞在・スクロール・各種クリックを追記専用で記録する。
-- 「誰が見たか」を一般ユーザーに見せる用途ではない（運営の集計専用）。
-- 書き込み・読み取りはすべて service_role（サーバー側 /api/analytics 経由）で行う。
-- anon / authenticated からの直接アクセスはポリシー未定義＝拒否。
-- Supabase SQL Editor で実行してください。
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name  TEXT NOT NULL,
  page_path   TEXT,
  -- イベント/参加表明への参照。解析ログは追記専用で「取りこぼさない」ことを優先し、
  -- 外部キー制約は張らない（対象が消えてもログは残す。ID は文字列として保持）。
  event_id    TEXT,
  entry_id    TEXT,
  -- ログイン中に記録された場合のみ。クライアント値ではなくサーバー側セッションから付与する。
  user_id     UUID,
  -- 匿名の来訪を束ねるためのセッションID（クライアント生成の不透明値）。
  session_id  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_entry_id   ON analytics_events(entry_id);
CREATE INDEX IF NOT EXISTS idx_analytics_page_path  ON analytics_events(page_path);
-- 平均アクティブ滞在の集計（セッション×ページ単位）で使う
CREATE INDEX IF NOT EXISTS idx_analytics_session    ON analytics_events(session_id);

-- ============================================================
-- Row Level Security
-- ポリシーを一切定義しない＝ anon / authenticated は SELECT も INSERT も不可。
-- service_role のみが RLS をバイパスして読み書きできる。
-- ============================================================
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
