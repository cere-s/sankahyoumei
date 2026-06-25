import type { NextRequest } from 'next/server';

/**
 * 簡易レート制限（固定ウィンドウ・インメモリ）。
 * サーバーレスではインスタンスごとの計測になるため厳密ではないが、
 * 連投・スパムへの基本的な抑止として機能する。
 */
const buckets = new Map<string, { count: number; reset: number }>();

export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/** 許可なら true、超過なら false */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  // たまに期限切れを掃除してメモリ肥大を防ぐ
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
  }

  const entry = buckets.get(key);
  if (!entry || now > entry.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}
