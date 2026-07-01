import Link from 'next/link';
import { getAllEvents } from '@/lib/events';
import { getRecentEntries, getEntryCountsByEvent } from '@/lib/entries';
import { EntryCard } from '@/components/EntryCard';
import { SearchFilterBar } from '@/components/SearchFilterBar';
import { formatDate, formatDateBadge, todayISO, parseHashtags } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function TopPage() {
  const [events, recentEntries, entryCounts] = await Promise.all([
    getAllEvents(),
    getRecentEntries(10).catch(() => []),
    getEntryCountsByEvent().catch((): Record<string, number> => ({})),
  ]);
  const today = todayISO();
  const upcomingAll = events.filter((e) => e.date >= today);
  const upcomingEvents = upcomingAll.slice(0, 4);
  const totalEntries = Object.values(entryCounts).reduce((a, b) => a + b, 0);

  // 参加人数ランキング（開催予定のうち、参加表明が1件以上ある順）
  const ranking = upcomingAll
    .map((e) => ({ event: e, count: entryCounts[e.id] ?? 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count || a.event.date.localeCompare(b.event.date))
    .slice(0, 5);

  return (
    <div>
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-100 via-purple-50 to-violet-50">
        {/* 背景の光の玉（装飾） */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-pink-200/40 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-violet-200/40 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-5xl items-center gap-8 px-4 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          {/* 左：コピー＋CTA */}
          <div>
            <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-pink-600 shadow-sm backdrop-blur">
              ★ 好きでつながる、コスプレ参加表明サイト
            </p>
            <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-gray-900 sm:text-5xl">
              次のイベント、
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">誰が来るか</span>
              先に見える。
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-gray-600 sm:text-base">
              コスプレイヤーもカメラマンも、イベント前に参加表明をチェック。
              会いたい人に出会えて、撮りたい作品がきっと見つかる。
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/events"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-7 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                </svg>
                イベントを探す
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-7 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 3.5l5 5M4 20l1-4L16.5 4.5a2.12 2.12 0 013 3L8 19l-4 1z" />
                </svg>
                参加表明する
              </Link>
            </div>

            {/* 統計カード */}
            <div className="mt-6 grid max-w-md grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="text-pink-500" aria-hidden="true">📅</span> 開催予定
                </p>
                <p className="mt-0.5 text-2xl font-bold text-gray-900 tabular-nums">
                  {upcomingAll.length}
                  <span className="ml-1 text-sm font-medium text-gray-400">件</span>
                </p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="text-violet-500" aria-hidden="true">👥</span> 参加表明
                </p>
                <p className="mt-0.5 text-2xl font-bold text-gray-900 tabular-nums">
                  {totalEntries}
                  <span className="ml-1 text-sm font-medium text-gray-400">件</span>
                </p>
              </div>
            </div>
          </div>

          {/* 右：装飾ブロック（イラストの代わり）— PCのみ */}
          <div className="relative hidden lg:block" aria-hidden="true">
            <div className="relative mx-auto aspect-square max-w-sm rounded-[2rem] bg-gradient-to-br from-pink-200/70 via-fuchsia-200/60 to-violet-300/70 shadow-inner">
              {/* 吹き出しカード */}
              <div className="absolute left-6 top-10 w-60 rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur">
                <p className="text-sm font-bold leading-relaxed text-gray-800">
                  イベント前に、
                  <br />
                  誰に会えるか・何を撮れるかが
                  <br />
                  見える場所。
                </p>
                <div className="mt-3 flex gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600">📷</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-pink-600">♥</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">✓</span>
                </div>
              </div>
              {/* グラデ帯 */}
              <div className="absolute inset-x-6 bottom-8 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-4 py-3 text-center text-sm font-bold text-white shadow-lg">
                好きでつながる、コスプレ参加表明サイト
              </div>
            </div>
          </div>
        </div>

        {/* 検索バー（ヒーロー下端に重ねる） */}
        <div className="relative mx-auto max-w-3xl px-4 pb-10">
          <SearchFilterBar />
          <div className="mt-2 text-right">
            <Link href="/search" className="text-xs font-medium text-violet-600 hover:underline">
              作品・キャラの一覧から探す →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 新着の参加表明（横スクロール） ===== */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">新着の参加表明</h2>
          <Link href="/events" className="text-sm text-violet-600 hover:underline">
            すべて見る →
          </Link>
        </div>
        {recentEntries.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
            まだ参加表明がありません
          </p>
        ) : (
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
            {recentEntries.map((entry) => {
              const event = events.find((e) => e.id === entry.eventId);
              return (
                <div key={entry.id} className="w-72 shrink-0 snap-start">
                  <EntryCard entry={entry} eventId={entry.eventId} eventName={event?.name} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== 開催予定のイベント（日付バッジ・写真なし） ===== */}
      <section className="mx-auto max-w-5xl px-4 pb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">開催予定のイベント</h2>
          <Link href="/events" className="text-sm text-violet-600 hover:underline">
            すべて見る →
          </Link>
        </div>
        {upcomingEvents.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
            開催予定のイベントはありません
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {upcomingEvents.map((event) => {
              const badge = formatDateBadge(event.date);
              const tag = parseHashtags(event.hashtag)[0];
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-100 hover:shadow-md"
                >
                  {/* 日付バッジ帯 */}
                  <div className="relative flex h-24 items-center justify-center bg-gradient-to-br from-violet-500 to-pink-500 text-white">
                    {badge && (
                      <div className="text-center leading-none">
                        <p className="text-3xl font-bold tabular-nums">
                          {badge.month}.{badge.day}
                        </p>
                        <p className="mt-1 text-xs font-medium opacity-90">（{badge.dow}）</p>
                      </div>
                    )}
                    {event.region && (
                      <span className="absolute right-2 top-2 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold backdrop-blur">
                        {event.region}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <p className="line-clamp-2 text-sm font-bold text-gray-900">{event.name}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-gray-500">📍 {event.location}</p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <span className="text-xs text-gray-500">
                        参加表明 <span className="font-bold text-violet-600">{entryCounts[event.id] ?? 0}</span> 人
                      </span>
                      {tag && (
                        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                          #{tag}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== 参加人数ランキング ===== */}
      <section id="ranking" className="mx-auto max-w-5xl scroll-mt-20 px-4 pb-16">
        <h2 className="mb-4 text-lg font-bold text-gray-900">参加人数ランキング</h2>
        {ranking.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
            まだ参加表明がありません
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <ul className="divide-y divide-gray-50">
              {ranking.map(({ event, count }, i) => (
                <li key={event.id}>
                  <Link
                    href={`/events/${event.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-violet-50/50"
                  >
                    <span
                      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        i === 0
                          ? 'bg-amber-100 text-amber-700'
                          : i === 1
                            ? 'bg-gray-200 text-gray-600'
                            : i === 2
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-50 text-gray-400'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-800">{event.name}</span>
                      <span className="text-xs text-gray-400">{formatDate(event.date)}</span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-violet-700 tabular-nums">{count}人</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
