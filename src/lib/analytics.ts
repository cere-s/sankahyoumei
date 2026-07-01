import { createAdminClient } from './supabase/server';
import { DEMO } from './demo';

/**
 * 記録する解析イベント名の許可リスト。
 * ここに無いイベント名は API 側で拒否する（任意の文字列を溜めない）。
 */
export const ANALYTICS_EVENT_NAMES = [
  'page_view',
  'page_engagement',
  'scroll_depth',
  'event_card_clicked',
  'entry_card_clicked',
  'entry_detail_view',
  'x_profile_clicked',
  'portfolio_clicked',
  'share_clicked',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export function isAnalyticsEventName(v: unknown): v is AnalyticsEventName {
  return typeof v === 'string' && (ANALYTICS_EVENT_NAMES as readonly string[]).includes(v);
}

export interface AnalyticsEventInput {
  eventName: AnalyticsEventName;
  pagePath?: string | null;
  eventId?: string | null;
  entryId?: string | null;
  /** サーバー側セッションから付与する。クライアント値は信用しない。 */
  userId?: string | null;
  sessionId?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface AnalyticsRow {
  event_name: string;
  page_path: string | null;
  event_id: string | null;
  entry_id: string | null;
  user_id: string | null;
  session_id: string | null;
  metadata: Record<string, unknown> | null;
}

function toRow(e: AnalyticsEventInput): AnalyticsRow {
  return {
    event_name: e.eventName,
    page_path: e.pagePath ?? null,
    event_id: e.eventId ?? null,
    entry_id: e.entryId ?? null,
    user_id: e.userId ?? null,
    session_id: e.sessionId ?? null,
    metadata: e.metadata ?? null,
  };
}

/**
 * 解析イベントをまとめて記録する（service role・RLSバイパス）。
 * DEMO モードでは DB を持たないので何もしない。
 * 追記専用のテレメトリなので、失敗しても呼び出し側の処理は止めない。
 */
export async function recordAnalyticsEvents(events: AnalyticsEventInput[]): Promise<void> {
  if (DEMO || events.length === 0) return;
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('analytics_events').insert(events.map(toRow));
    if (error) console.error('analytics insert failed:', error.message);
  } catch (e) {
    console.error('analytics insert threw:', e);
  }
}

// ============================================================
// 集計（運営者ページ専用。呼び出し側で必ず管理者判定してから使う）
// ============================================================

const MAX_ROWS = 100_000;

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export interface CountRow {
  key: string;
  count: number;
}
export interface AvgRow {
  key: string;
  avg: number;
  samples: number;
}

export interface AnalyticsSummary {
  from: string;
  to: string;
  totalEvents: number;
  pageViews: CountRow[];
  avgActiveSecondsByPage: AvgRow[];
  avgScrollDepthByPage: AvgRow[];
  eventDetailClicks: number;
  entryDetailClicks: number;
  xProfileClicks: number;
  portfolioClicks: number;
  shareClicks: number;
  perEntryViews: CountRow[];
  perEntryXClicks: CountRow[];
}

interface RawRow {
  event_name: string;
  page_path: string | null;
  entry_id: string | null;
  session_id: string | null;
  metadata: Record<string, unknown> | null;
}

/** 期間内の解析ログを集計する。集計は JS 側で行う（テスト規模の想定）。 */
export async function getAnalyticsSummary(range: { from: string; to: string }): Promise<AnalyticsSummary> {
  const empty: AnalyticsSummary = {
    from: range.from,
    to: range.to,
    totalEvents: 0,
    pageViews: [],
    avgActiveSecondsByPage: [],
    avgScrollDepthByPage: [],
    eventDetailClicks: 0,
    entryDetailClicks: 0,
    xProfileClicks: 0,
    portfolioClicks: 0,
    shareClicks: 0,
    perEntryViews: [],
    perEntryXClicks: [],
  };
  if (DEMO) return empty;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('analytics_events')
    .select('event_name, page_path, entry_id, session_id, metadata')
    .gte('created_at', range.from)
    .lte('created_at', range.to)
    .order('created_at', { ascending: false })
    .limit(MAX_ROWS);

  if (error) {
    console.error('analytics summary query failed:', error.message);
    return empty;
  }
  const rows = (data ?? []) as RawRow[];

  const pageViews = new Map<string, number>();
  const eventCount = (name: string) => rows.filter((r) => r.event_name === name).length;
  const perEntryViews = new Map<string, number>();
  const perEntryXClicks = new Map<string, number>();

  // アクティブ滞在・スクロールは page_engagement を (session, page) 単位で最大値に畳んでから平均する。
  // 15秒ごとの送信は累積値なので、最大＝そのページでの最終的な滞在/到達を表す。
  const activeBySessionPage = new Map<string, { page: string; seconds: number; scroll: number }>();

  for (const r of rows) {
    switch (r.event_name) {
      case 'page_view':
        if (r.page_path) pageViews.set(r.page_path, (pageViews.get(r.page_path) ?? 0) + 1);
        break;
      case 'entry_detail_view':
        if (r.entry_id) perEntryViews.set(r.entry_id, (perEntryViews.get(r.entry_id) ?? 0) + 1);
        break;
      case 'x_profile_clicked':
        if (r.entry_id) perEntryXClicks.set(r.entry_id, (perEntryXClicks.get(r.entry_id) ?? 0) + 1);
        break;
      case 'page_engagement': {
        const page = r.page_path ?? '(unknown)';
        const key = `${r.session_id ?? 'anon'}::${page}`;
        const seconds = num(r.metadata?.duration_seconds) ?? 0;
        const scroll = num(r.metadata?.max_scroll_depth) ?? 0;
        const prev = activeBySessionPage.get(key);
        if (!prev) {
          activeBySessionPage.set(key, { page, seconds, scroll });
        } else {
          prev.seconds = Math.max(prev.seconds, seconds);
          prev.scroll = Math.max(prev.scroll, scroll);
        }
        break;
      }
    }
  }

  // (session,page) 集約から、ページごとの平均を出す
  const secByPage = new Map<string, number[]>();
  const scrByPage = new Map<string, number[]>();
  const push = (m: Map<string, number[]>, k: string, v: number) => {
    const arr = m.get(k);
    if (arr) arr.push(v);
    else m.set(k, [v]);
  };
  for (const { page, seconds, scroll } of activeBySessionPage.values()) {
    push(secByPage, page, seconds);
    push(scrByPage, page, scroll);
  }

  const toCountRows = (m: Map<string, number>): CountRow[] =>
    [...m.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);

  const toAvgRows = (m: Map<string, number[]>): AvgRow[] =>
    [...m.entries()]
      .map(([key, vals]) => ({
        key,
        samples: vals.length,
        avg: vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.samples - a.samples);

  return {
    from: range.from,
    to: range.to,
    totalEvents: rows.length,
    pageViews: toCountRows(pageViews),
    avgActiveSecondsByPage: toAvgRows(secByPage),
    avgScrollDepthByPage: toAvgRows(scrByPage),
    eventDetailClicks: eventCount('event_card_clicked'),
    entryDetailClicks: eventCount('entry_card_clicked'),
    xProfileClicks: eventCount('x_profile_clicked'),
    portfolioClicks: eventCount('portfolio_clicked'),
    shareClicks: eventCount('share_clicked'),
    perEntryViews: toCountRows(perEntryViews),
    perEntryXClicks: toCountRows(perEntryXClicks),
  };
}
