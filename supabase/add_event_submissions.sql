-- ============================================================
-- ユーザーによるイベント登録（仮登録 → 運営確認 → 本登録）
--
-- 方針:
-- - 登録直後から一覧・検索・集計に表示する（即シェア・即参加表明できる）
-- - ただし運営が確認するまでは「運営確認待ち」状態（status='pending'）
-- - 運営が確認したら status='published'（確認済み）に昇格
-- - スパム・公式詐称などは status='removed' で論理削除（参加表明は消さない）
-- Supabase SQL Editor で実行してください。
-- ============================================================

-- 既存イベント（インポート・運営追加）は 'published' として扱う
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('pending', 'published', 'removed'));

-- 登録者（Xログインユーザー）。NULL = インポート/運営追加
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_status     ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- ---- RLS の更新 ----

-- 公開読み取りは removed を除外（pending は表示する）
DROP POLICY IF EXISTS "events_public_select" ON events;
CREATE POLICY "events_public_select"
  ON events FOR SELECT
  USING (status <> 'removed');

-- ログインユーザーは「自分名義の仮登録イベント」だけ作成できる
DROP POLICY IF EXISTS "events_user_insert" ON events;
CREATE POLICY "events_user_insert"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = created_by AND status = 'pending');

-- 編集・確認・取り下げは service_role（運営確認後）で行う（RLSバイパス）。
-- 登録者による「参加表明ゼロの自分の仮登録イベントの取り下げ」も service_role でサーバー検証後に実行する。
