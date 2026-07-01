import Link from 'next/link';
import { getAllEvents } from '@/lib/events';
import { getRecentEntries, getEntryCountsByEvent } from '@/lib/entries';
import { EntryCard } from '@/components/EntryCard';
import { formatDate, todayISO, parseHashtags } from '@/lib/utils';

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
  const totalEntries = Object.values(entryCounts).reduce((a, b) => a + b, 0);

  // 参加人数ランキング（開催予定のうち、参加表明が1件以上ある順）
  const ranking = upcomingAll
    .map((e) => ({ event: e, count: entryCounts[e.id] ?? 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count || a.event.date.localeCompare(b.event.date))
    .slice(0, 5);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-100 via-purple-50 to-violet-50 px-4 py-14">
        <div className="max-w-2xl mx-auto text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="コスいく" className="w-20 h-20 mx-auto mb-4 drop-shadow-sm" />
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">コスいく</span>
          </h1>
          <p className="text-pink-600 text-sm font-medium mb-5">★ 好きでつながる、コスプレ参加表明サイト ★</p>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug mb-3">
            次のイベント、
            <br className="sm:hidden" />
            誰が来るか先に見える。
          </h2>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-7">
            コスプレ・カメラマンの参加表明を一覧でチェック。
            <br />
            誰がどの作品・キャラで来るかが、当日より前に分かります。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/events"
              className="bg-gradient-to-r from-pink-500 to-violet-500 text-white px-7 py-3 rounded-xl font-bold text-sm shadow-sm hover:opacity-90 active:opacity-100 transition-opacity">
              イベントを探す
            </Link>
            <Link href="/events"
              className="bg-white text-violet-700 border border-violet-200 px-7 py-3 rounded-xl font-bold text-sm hover:bg-violet-50 transition-colors">
              参加表明する
            </Link>
          </div>
          <div className="mt-4">
            <Link href="/search" className="text-sm text-violet-600 font-medium hover:underline">
              作品・キャラで探す →
            </Link>
          </div>
          <div className="flex items-center justify-center gap-5 mt-7 text-xs text-gray-500">
            <span><span className="font-bold text-gray-800">{upcomingAll.length}</span> 開催予定</span>
            <span className="w-px h-3 bg-gray-300" />
            <span><span className="font-bold text-gray-800">{totalEntries}</span> 参加表明</span>
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
                        {parseHashtags(event.hashtag)[0] && (
                          <span className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-full shrink-0">
                            #{parseHashtags(event.hashtag)[0]}
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
