import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { getAnalyticsSummary, type CountRow, type AvgRow } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'アクセス解析',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ from?: string; to?: string }>;
}

/** YYYY-MM-DD の妥当性チェック（不正なら null） */
function normalizeDate(v: string | undefined): string | null {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : v;
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
    </div>
  );
}

function CountTable({ title, rows, keyLabel, unit = '' }: { title: string; rows: CountRow[]; keyLabel: string; unit?: string }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold text-gray-800">{title}</h2>
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-400">
              <th className="px-3 py-2 text-left font-medium">{keyLabel}</th>
              <th className="px-3 py-2 text-right font-medium w-24">件数</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-3 py-6 text-center text-gray-400">
                  データがありません
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.key} className="border-b border-gray-50 last:border-0">
                  <td className="px-3 py-2 text-gray-700 break-all">{r.key}</td>
                  <td className="px-3 py-2 text-right font-bold tabular-nums text-violet-700">
                    {r.count}
                    {unit}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AvgTable({ title, rows, unit }: { title: string; rows: AvgRow[]; unit: string }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold text-gray-800">{title}</h2>
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-400">
              <th className="px-3 py-2 text-left font-medium">ページ</th>
              <th className="px-3 py-2 text-right font-medium w-28">平均</th>
              <th className="px-3 py-2 text-right font-medium w-24">対象数</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-gray-400">
                  データがありません
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.key} className="border-b border-gray-50 last:border-0">
                  <td className="px-3 py-2 text-gray-700 break-all">{r.key}</td>
                  <td className="px-3 py-2 text-right font-bold tabular-nums text-violet-700">
                    {r.avg}
                    {unit}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-500">{r.samples}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function AdminAnalyticsPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  // 運営以外にはページの存在を見せない（サーバー側で判定）
  if (!user || !isAdmin(user.id)) notFound();

  const sp = await searchParams;
  const fromDate = normalizeDate(sp.from) ?? daysAgoISO(7);
  const toDate = normalizeDate(sp.to) ?? daysAgoISO(0);

  const summary = await getAnalyticsSummary({
    from: `${fromDate}T00:00:00.000Z`,
    to: `${toDate}T23:59:59.999Z`,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-1 text-xl font-bold text-gray-900">アクセス解析（運営）</h1>
      <p className="mb-4 text-sm text-gray-500">
        運営者のみ閲覧できます。ユーザー向け画面には数値を表示していません。
      </p>

      {/* AI分析用エクスポート（現在の期間で書き出し。誰が見たかは含めない） */}
      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-violet-100 bg-violet-50/40 p-3">
        <span className="text-xs font-bold text-gray-700">AI分析用エクスポート</span>
        <a
          href={`/api/admin/analytics/export?from=${fromDate}&to=${toDate}&format=json`}
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700"
        >
          JSON（集計＋生ログ）
        </a>
        <a
          href={`/api/admin/analytics/export?from=${fromDate}&to=${toDate}&format=csv`}
          className="rounded-lg border border-violet-300 bg-white px-3 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-50"
        >
          CSV（生ログ）
        </a>
        <span className="text-[11px] text-gray-400">個人特定情報（user_id）は含めません</span>
      </div>

      {/* 期間フィルター */}
      <form method="get" className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <label className="flex flex-col text-xs text-gray-500">
          開始日
          <input type="date" name="from" defaultValue={fromDate} className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800" />
        </label>
        <label className="flex flex-col text-xs text-gray-500">
          終了日
          <input type="date" name="to" defaultValue={toDate} className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800" />
        </label>
        <button type="submit" className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-bold text-white hover:bg-violet-700">
          適用
        </button>
        <span className="ml-auto self-center text-xs text-gray-400">
          {fromDate} 〜 {toDate}（総イベント {summary.totalEvents} 件）
        </span>
      </form>

      {/* サマリー */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="イベント詳細クリック" value={summary.eventDetailClicks} />
        <StatCard label="参加表明詳細クリック" value={summary.entryDetailClicks} />
        <StatCard label="Xプロフィールクリック" value={summary.xProfileClicks} />
        <StatCard label="作例クリック" value={summary.portfolioClicks} />
        <StatCard label="共有クリック" value={summary.shareClicks} />
      </div>

      <div className="space-y-6">
        <CountTable title="ページ別PV" rows={summary.pageViews} keyLabel="ページ" unit="" />
        <AvgTable title="平均アクティブ滞在時間" rows={summary.avgActiveSecondsByPage} unit="秒" />
        <AvgTable title="平均スクロール率" rows={summary.avgScrollDepthByPage} unit="%" />
        <CountTable title="参加表明ごとの閲覧数" rows={summary.perEntryViews} keyLabel="参加表明ID" unit="" />
        <CountTable title="参加表明ごとのXクリック数" rows={summary.perEntryXClicks} keyLabel="参加表明ID" unit="" />
      </div>
    </div>
  );
}
