/**
 * 全参加表明の OGP 画像を一括で再生成するスクリプト。
 *
 * 生成は R2 環境のあるデプロイ先（Vercel）で実行する必要があるため、
 * このスクリプトは Supabase からID一覧を取得し、デプロイ済みの
 * 管理用エンドポイント /api/admin/refresh-og を1件ずつ叩く。
 *
 * 使い方:
 *   npm run refresh:og                       # 全件
 *   npm run refresh:og -- --limit=5          # 先頭5件だけ
 *   npm run refresh:og -- --site=https://... # 対象サイトを上書き
 *
 * 必要な環境変数 (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_SITE_URL        … 対象サイト（--site で上書き可）
 *   OG_REFRESH_SECRET           … 管理エンドポイントの秘密キー（Vercelと同じ値）
 */

import { createClient } from '@supabase/supabase-js';

const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity;
const siteArg = process.argv.find((a) => a.startsWith('--site='));

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const site = (siteArg ? siteArg.split('=')[1] : process.env.NEXT_PUBLIC_SITE_URL)?.replace(/\/$/, '');
  const secret = process.env.OG_REFRESH_SECRET;

  if (!supabaseUrl || !serviceKey) throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です');
  if (!site) throw new Error('NEXT_PUBLIC_SITE_URL（または --site）が未設定です');
  if (!secret) throw new Error('OG_REFRESH_SECRET が未設定です');

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from('participation_entries')
    .select('id')
    .eq('is_hidden', false)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`ID取得エラー: ${error.message}`);

  const ids = (data as { id: string }[]).map((r) => r.id).slice(0, isFinite(limit) ? limit : undefined);
  console.log(`対象: ${ids.length} 件 / 送信先: ${site}/api/admin/refresh-og`);

  let ok = 0;
  let ng = 0;
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    try {
      const res = await fetch(`${site}/api/admin/refresh-og`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ id }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`);
      ok++;
      process.stdout.write(`  [${i + 1}/${ids.length}] ✓ ${id}\n`);
    } catch (e) {
      ng++;
      console.warn(`  [${i + 1}/${ids.length}] ⚠️ ${id}: ${e}`);
    }
    await delay(400);
  }

  console.log(`\n完了: 成功 ${ok} / 失敗 ${ng}`);
}

main().catch((err) => {
  console.error('予期しないエラー:', err);
  process.exit(1);
});
