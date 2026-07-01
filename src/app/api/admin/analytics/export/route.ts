import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import {
  getAnalyticsSummary,
  getAnalyticsRawEvents,
  type AnalyticsExportRow,
} from '@/lib/analytics';
import { getEntriesByIds } from '@/lib/entries';
import { getEventsByIds } from '@/lib/events';
import { getEntryPlans, getEntryTargets } from '@/lib/utils';
import type { ParticipationEntry } from '@/types';

interface EntryRef {
  displayName: string;
  xId: string;
  type: string;
  works: string[];
}
interface EventRef {
  name: string;
  date: string;
  location: string;
}

/** 参加表明から作品/キャラの短い説明配列を作る（AIが人物と作品を対応づけられるように） */
function worksOf(e: ParticipationEntry): string[] {
  const plans = getEntryPlans(e).map((p) =>
    [p.workTitle, p.characterName].filter(Boolean).join(' / ')
  );
  const targets = getEntryTargets(e).map((t) =>
    [t.workTitle, t.characterName].filter(Boolean).join(' / ')
  );
  return [...plans, ...targets].filter(Boolean).slice(0, 6);
}

/**
 * 解析データのエクスポート（運営者専用・読み取り）。
 * AI に渡して分析させることを想定。
 * - 管理者以外は 403（サーバー側判定）
 * - user_id（誰が見たか）は一切出さない
 * - format=json（既定, サマリー＋生イベント） / csv（生イベント）
 */

function normalizeDate(v: string | null): string | null {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  return Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()) ? null : v;
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** CSV セル1つを安全にクオートする */
function csvCell(v: unknown): string {
  const s =
    v === null || v === undefined
      ? ''
      : typeof v === 'object'
        ? JSON.stringify(v)
        : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(
  rows: AnalyticsExportRow[],
  entries: Map<string, EntryRef>,
  events: Map<string, EventRef>
): string {
  const headers = [
    'created_at', 'event_name', 'page_path',
    'event_id', 'event_label', 'entry_id', 'entry_label',
    'session_id', 'metadata',
  ];
  const lines = [headers.join(',')];
  for (const r of rows) {
    const eventLabel = r.event_id ? events.get(r.event_id)?.name ?? '' : '';
    const entryRef = r.entry_id ? entries.get(r.entry_id) : undefined;
    const entryLabel = entryRef ? [entryRef.displayName, entryRef.works[0]].filter(Boolean).join(' / ') : '';
    lines.push(
      [
        r.created_at, r.event_name, r.page_path,
        r.event_id, eventLabel, r.entry_id, entryLabel,
        r.session_id, r.metadata,
      ]
        .map(csvCell)
        .join(',')
    );
  }
  return lines.join('\n');
}

/** 生イベントに現れる entry_id / event_id の参照辞書を作る */
async function buildReferences(rows: AnalyticsExportRow[]): Promise<{
  entries: Map<string, EntryRef>;
  events: Map<string, EventRef>;
}> {
  const entryIds = [...new Set(rows.map((r) => r.entry_id).filter((v): v is string => !!v))];
  const eventIds = [...new Set(rows.map((r) => r.event_id).filter((v): v is string => !!v))];

  const [entryMap, eventMap] = await Promise.all([
    entryIds.length ? getEntriesByIds(entryIds) : Promise.resolve(new Map()),
    eventIds.length ? getEventsByIds(eventIds) : Promise.resolve(new Map()),
  ]);

  const entries = new Map<string, EntryRef>();
  for (const [id, e] of entryMap) {
    entries.set(id, { displayName: e.displayName, xId: e.xId, type: e.participationType, works: worksOf(e) });
  }
  const events = new Map<string, EventRef>();
  for (const [id, ev] of eventMap) {
    events.set(id, { name: ev.name, date: ev.date, location: ev.location });
  }
  return { entries, events };
}

/** Map を JSON に載せられる普通のオブジェクトへ */
function mapToObject<V>(m: Map<string, V>): Record<string, V> {
  const o: Record<string, V> = {};
  for (const [k, v] of m) o[k] = v;
  return o;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.id)) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const fromDate = normalizeDate(sp.get('from')) ?? daysAgoISO(7);
  const toDate = normalizeDate(sp.get('to')) ?? daysAgoISO(0);
  const format = sp.get('format') === 'csv' ? 'csv' : 'json';

  const range = { from: `${fromDate}T00:00:00.000Z`, to: `${toDate}T23:59:59.999Z` };
  const stamp = `${fromDate}_${toDate}`;

  const rows = await getAnalyticsRawEvents(range);
  const refs = await buildReferences(rows);

  if (format === 'csv') {
    return new NextResponse(toCsv(rows, refs.entries, refs.events), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="analytics_${stamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  const summary = await getAnalyticsSummary(range);

  const body = {
    generatedAt: new Date().toISOString(),
    range: { from: fromDate, to: toDate },
    note:
      'Operator-only analytics export for AI analysis. Excludes user identity (no user_id). ' +
      'Times are UTC. Use "references" to map event_id/entry_id to human-readable names/works.',
    summary,
    references: {
      entries: mapToObject(refs.entries),
      events: mapToObject(refs.events),
    },
    eventCount: rows.length,
    events: rows,
  };

  return new NextResponse(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="analytics_${stamp}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
