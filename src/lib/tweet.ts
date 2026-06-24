/**
 * 埋め込みツイートのURL検証ユーティリティ。
 * 「ツイートの投稿者 = 参加表明のX ID」であることを担保する。
 */

export interface TweetRef {
  /** URLパスに含まれる投稿者ハンドル（@なし） */
  handle: string;
  /** ツイートID（数値文字列） */
  id: string;
  /** 正規化したURL（https://x.com/{handle}/status/{id}） */
  normalizedUrl: string;
}

/** ツイートURLを解析する。X / Twitter / mobile / クエリ付きに対応 */
export function parseTweetUrl(raw: string): TweetRef | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return null;
  }

  const host = u.hostname.replace(/^www\./, '').replace(/^mobile\./, '');
  if (host !== 'x.com' && host !== 'twitter.com') return null;

  // /{handle}/status/{id}
  const m = u.pathname.match(/^\/([A-Za-z0-9_]{1,15})\/status(?:es)?\/(\d+)/);
  if (!m) return null;

  const handle = m[1];
  const id = m[2];
  return {
    handle,
    id,
    normalizedUrl: `https://x.com/${handle}/status/${id}`,
  };
}

export type TweetVerifyResult =
  | { ok: true; normalizedUrl: string }
  | { ok: false; error: string };

/**
 * ツイートURLが指定のX IDの投稿であることを検証する。
 * 1) URLパスのハンドルが xId と一致すること（必須）
 * 2) 可能なら Twitter oEmbed で実際の投稿者を確認し、一致しなければ拒否（best-effort）
 */
export async function verifyTweetForXId(
  tweetUrl: string,
  xId: string
): Promise<TweetVerifyResult> {
  const ref = parseTweetUrl(tweetUrl);
  if (!ref) {
    return { ok: false, error: 'ツイートのURLが正しくありません（例: https://x.com/あなたのID/status/...）' };
  }

  const normalizedXId = xId.trim().replace(/^@/, '').toLowerCase();
  if (ref.handle.toLowerCase() !== normalizedXId) {
    return {
      ok: false,
      error: `ツイートの投稿者（@${ref.handle}）とX ID（@${normalizedXId}）が一致しません。ご自身のツイートのURLを入力してください。`,
    };
  }

  // best-effort: oEmbed で実際の投稿者を確認（落ちていてもパス一致で許可）
  try {
    const res = await fetch(
      `https://publish.twitter.com/oembed?omit_script=1&url=${encodeURIComponent(ref.normalizedUrl)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const data = (await res.json()) as { author_url?: string };
      const authorMatch = data.author_url?.match(/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})/i);
      const realHandle = authorMatch?.[1]?.toLowerCase();
      if (realHandle && realHandle !== normalizedXId) {
        return {
          ok: false,
          error: `ツイートの実際の投稿者（@${realHandle}）とX IDが一致しません。`,
        };
      }
    }
  } catch {
    // oEmbed不達時はパス一致のみで通す
  }

  return { ok: true, normalizedUrl: ref.normalizedUrl };
}
