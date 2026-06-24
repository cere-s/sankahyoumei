import Link from 'next/link';
import { getAllEvents } from '@/lib/events';
import { getRecentEntries, getEntryCountsByEvent } from '@/lib/entries';
import { EntryCard } from '@/components/EntryCard';
import { formatDate, todayISO } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function TopPage() {
  const [events, recentEntries, entryCounts] = await Promise.all([
    getAllEvents(),
    getRecentEntries(10).catch(() => []),
    getEntryCountsByEvent().catch((): Record<string, number> => ({})),
  ]);
  const today = todayISO();
  const upcomingAll = events.filter((e) => e.date >= today);
  const upcomingEvents = upcomingAll.slice(0, 3);

  // 参加人数ランキング（開催予定のうち、参加表明が1件以上ある順）
  const ranking = upcomingAll
    .map((e) => ({ event: e, count: entryCounts[e.id] ?? 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count || a.event.date.localeCompare(b.event.date))
    .slice(0, 5);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-violet-50 to-purple-50 px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-violet-500 text-sm font-medium mb-2">コスプレイベント参加表明サービス</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">コスプレ参加表明</h1>
          <p className="text-gray-600 text-sm leading-relaxed mb-8">
            イベントへの参加を表明して、同じイベントに行く人を探しましょう。
            <br />
            誰がどのキャラで来るかが一目でわかります。
          </p>
          <div className="flex justify-center">
            <Link href="/events"
              className="bg-violet-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-violet-700 transition-colors">
              イベントを探す
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8 grid gap-8 lg:grid-cols-3">
        {/* Recent Entries */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800">新着の参加表明</h2>
          </div>
          {recentEntries.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">まだ参加表明がありません</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {recentEntries.map((entry) => {
                const event = events.find((e) => e.id === entry.eventId);
                return (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    eventId={entry.eventId}
                    eventName={event?.name}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Upcoming Events + Ranking */}
        <section className="lg:col-span-1 space-y-8">
          {/* 直近のイベント */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-800">開催予定のイベント</h2>
              <Link href="/events" className="text-sm text-violet-600 hover:underline">すべて見る →</Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                開催予定のイベントはありません
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <Link key={event.id} href={`/events/${event.id}`} className="block">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-violet-100 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{event.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDate(event.date)} · {event.location}
                          </p>
                        </div>
                        {event.hashtag && (
                          <span className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-full shrink-0">
                            #{event.hashtag}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 参加人数ランキング */}
          <div>
            <h2 className="text-base font-bold text-gray-800 mb-4">参加人数ランキング</h2>
            {ranking.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                まだ参加表明がありません
              </p>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-xs">
                      <th className="text-center font-medium py-2 w-10">順位</th>
                      <th className="text-left font-medium py-2">イベント</th>
                      <th className="text-right font-medium py-2 pr-4 w-16">人数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map(({ event, count }, i) => (
                      <tr key={event.id} className="border-b border-gray-50 last:border-0 hover:bg-violet-50/40 transition-colors">
                        <td className="text-center py-2.5">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            i === 0 ? 'bg-amber-100 text-amber-700'
                            : i === 1 ? 'bg-gray-200 text-gray-600'
                            : i === 2 ? 'bg-orange-100 text-orange-700'
                            : 'text-gray-400'
                          }`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <Link href={`/events/${event.id}`} className="text-gray-800 hover:text-violet-600 hover:underline line-clamp-1">
                            {event.name}
                          </Link>
                          <p className="text-xs text-gray-400">{formatDate(event.date)}</p>
                        </td>
                        <td className="text-right py-2.5 pr-4 font-bold text-violet-700 tabular-nums">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
