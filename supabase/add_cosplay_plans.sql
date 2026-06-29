-- ============================================================
-- 1イベントに複数の作品・キャラ予定を登録できるようにする
-- cosplay_plans(JSONB配列) を追加し、既存の work_name/character_name を1件目として移行
-- Supabase SQL Editor で実行してください
-- ============================================================

ALTER TABLE participation_entries
  ADD COLUMN IF NOT EXISTS cosplay_plans jsonb;

-- 既存のコスプレ参加表明（work_name あり）を 1件目の予定として後方移行
UPDATE participation_entries
  SET cosplay_plans = jsonb_build_array(
    jsonb_build_object('workTitle', work_name, 'characterName', COALESCE(character_name, ''))
  )
  WHERE participation_type = 'cosplay'
    AND work_name IS NOT NULL AND work_name <> ''
    AND (cosplay_plans IS NULL OR jsonb_array_length(cosplay_plans) = 0);
