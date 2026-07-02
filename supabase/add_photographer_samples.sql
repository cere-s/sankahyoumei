-- ============================================================
-- カメラマンの作例（プロフィール共通・最大4件）マイグレーション
-- 既存DBに対して Supabase SQL Editor で実行してください
-- 既存カラムには一切変更を加えないため、既存データへの影響はありません
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS photographer_samples JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 各要素: { "url": string, "key": string, "subjectXId"?: string }
-- url/key は R2 上の画像、subjectXId は被写体のXアカウント（任意・撮影者による自己申告）
-- 件数上限（4件）とURL/キー形式の検証はアプリ側（サーバー）で行う
