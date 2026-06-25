-- ============================================================
-- RLS パフォーマンス最適化
-- auth.uid() を (SELECT auth.uid()) で包み、行ごとの再評価を避ける
-- 既存DBに対して Supabase SQL Editor で実行してください
-- （ポリシーの中身を入れ替えるだけ。挙動は同じ）
-- ============================================================

-- participation_entries
DROP POLICY IF EXISTS "entries_auth_insert" ON participation_entries;
CREATE POLICY "entries_auth_insert"
  ON participation_entries FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "entries_owner_update" ON participation_entries;
CREATE POLICY "entries_owner_update"
  ON participation_entries FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- profiles
DROP POLICY IF EXISTS "profiles_owner_insert" ON profiles;
CREATE POLICY "profiles_owner_insert"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_owner_update" ON profiles;
CREATE POLICY "profiles_owner_update"
  ON profiles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);
