import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import {
  getAnalyticsSummary,
  getAnalyticsRawEvents,
  type AnalyticsExportRow,
} from '@/lib/analytics';

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

function toCsv(rows: AnalyticsExportRow[]): string {
  const headers = ['created_at', 'event_name', 'page_path', 'event_id', 'entry_id', 'session_id', 'metadata'];
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(
      [r.created_at, r.event_name, r.page_path, r.event_id, r.entry_id, r.session_id, r.metadata]
        .map(csvCell)
        .join(',')
    );
  }
  return lines.join('\n');
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

  if (format === 'csv') {
    const rows = await getAnalyticsRawEvents(range);
    return new NextResponse(toCsv(rows), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="analytics_${stamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  const [summary, events] = await Promise.all([
    getAnalyticsSummary(range),
    getAnalyticsRawEvents(range),
  ]);

  const body = {
    generatedAt: new Date().toISOString(),
    range: { from: fromDate, to: toDate },
    note: 'Operator-only analytics export for AI analysis. Excludes user identity (no user_id). Times are UTC.',
    summary,
    eventCount: events.length,
    events,
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
