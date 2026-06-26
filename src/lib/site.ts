/** 文字列を絶対URLに正規化する。不正なら null */
function normalizeUrl(raw: string): string | null {
  let s = raw.trim().replace(/\/+$/, '');
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    // ホストにドットが無い（例: "NEXT_PUBLIC_SITE_URL" のような誤設定）は不正扱い
    if (!u.hostname.includes('.')) return null;
    return s;
  } catch {
    return null;
  }
}

/** サイトの起点URLを返す（OGP・sitemap・共有URL・編集URL生成で使用） */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL ? normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL) : null;
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}
