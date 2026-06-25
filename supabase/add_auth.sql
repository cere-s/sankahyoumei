-- ============================================================
-- Xログイン（Supabase Auth）対応マイグレーション
-- 既存DBに対して Supabase SQL Editor で実行してください
-- ============================================================

-- 1) participation_entries にXログインカラムをADD
ALTER TABLE participation_entries
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS x_user_id TEXT,
  ADD COLUMN IF NOT EXISTS x_username_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS auth_status TEXT NOT NULL DEFAULT 'unverified';

-- 2) profiles テーブル
CREATE TABLE IF NOT EXISTS profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  x_user_id      TEXT UNIQUE,
  x_username     TEXT,
  x_display_name TEXT,
  x_avatar_url   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at トリガー（update_updated_at は schema.sql で定義済み）
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3) RLS

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_public_select" ON profiles;
CREATE POLICY "profiles_public_select"
  ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_owner_insert" ON profiles;
CREATE POLICY "profiles_owner_insert"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_owner_update" ON profiles;
CREATE POLICY "profiles_owner_update"
  ON profiles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);

-- participation_entries: 旧「全員INSERT可」を廃止し、ログイン本人INSERT/UPDATEに置き換え
DROP POLICY IF EXISTS "entries_public_insert" ON participation_entries;

DROP POLICY IF EXISTS "entries_auth_insert" ON participation_entries;
CREATE POLICY "entries_auth_insert"
  ON participation_entries FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "entries_owner_update" ON participation_entries;
CREATE POLICY "entries_owner_update"
  ON participation_entries FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- 4) 既存行の auth_status を補正
--    user_id があれば verified_x、編集トークンがあれば legacy_token、その他は unverified
UPDATE participation_entries
  SET auth_status = CASE
    WHEN user_id IS NOT NULL THEN 'verified_x'
    WHEN edit_token_hash IS NOT NULL THEN 'legacy_token'
    ELSE 'unverified'
  END
  WHERE auth_status = 'unverified';
