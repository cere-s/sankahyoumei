import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import {
  isAnalyticsEventName,
  recordAnalyticsEvents,
  type AnalyticsEventInput,
} from '@/lib/analytics';

/**
 * 解析イベントの取り込み口（書き込み専用）。
 * - 匿名の来訪も記録するため未ログインでも受け付ける
 * - user_id はサーバー側セッションからのみ付与（クライアント値は信用しない）
 * - navigator.sendBeacon からの text/plain ボディにも対応
 * - このエンドポイントは解析データを一切返さない
 */

const MAX_BATCH = 30;

function str(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
}

/** 未知キーや巨大値を溜めないよう metadata を軽くサニタイズする */
function cleanMetadata(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const out: Record<string, unknown> = {};
  let n = 0;
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (n >= 20) break;
    if (typeof val === 'string') out[k] = val.slice(0, 500);
    else if (typeof val === 'number' && Number.isFinite(val)) out[k] = val;
    else if (typeof val === 'boolean') out[k] = val;
    else continue;
    n++;
  }
  return Object.keys(out).length ? out : null;
}

export async function POST(request: NextRequest) {
  // 取り込みは軽量なので緩め。ページ遷移や15秒ごとの送信を許容する上限。
  if (!rateLimit(`analytics:${getClientIp(request)}`, 120, 60_000)) {
    return new NextResponse(null, { status: 429 });
  }

  let payload: unknown;
  try {
    // sendBeacon は Content-Type を text/plain 等で送ってくるため、まず本文を読んで JSON.parse する
    const text = await request.text();
    if (!text) return new NextResponse(null, { status: 204 });
    payload = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const rawEvents: unknown[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { events?: unknown[] })?.events)
      ? (payload as { events: unknown[] }).events
      : [payload];

  if (rawEvents.length === 0) return new NextResponse(null, { status: 204 });

  // user_id はサーバー側セッションからのみ決める（なりすまし防止）
  const user = await getCurrentUser();
  const userId = user?.id ?? null;

  const events: AnalyticsEventInput[] = [];
  for (const raw of rawEvents.slice(0, MAX_BATCH)) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    if (!isAnalyticsEventName(r.event_name)) continue;
    events.push({
      eventName: r.event_name,
      pagePath: str(r.page_path, 512),
      eventId: str(r.event_id, 128),
      entryId: str(r.entry_id, 128),
      sessionId: str(r.session_id, 128),
      userId,
      metadata: cleanMetadata(r.metadata),
    });
  }

  if (events.length > 0) await recordAnalyticsEvents(events);

  // 常に本文なしで返す（解析データは返さない）
  return new NextResponse(null, { status: 204 });
}
