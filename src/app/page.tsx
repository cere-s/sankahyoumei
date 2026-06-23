import Link from 'next/link';
import { getAllEvents } from '@/lib/events';
import { getRecentEntries } from '@/lib/entries';
import { EntryCard } from '@/components/EntryCard';
import { formatDate, todayISO } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function TopPage() {
  const [events, recentEntries] = await Promise.all([
    getAllEvents(),
    getRecentEntries(10).catch(() => []),
  ]);
  const today = todayISO();
  const upcomingEvents = events.filter((e) => e.date >= today).slice(0, 3);

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
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/events"
              className="bg-violet-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-violet-700 transition-colors">
              イベントを探す
            </Link>
            <Link href="/events"
              className="bg-white text-violet-600 border border-violet-200 px-6 py-3 rounded-xl font-bold text-sm hover:bg-violet-50 transition-colors">
              参加表明を作る
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

        {/* Upcoming Events */}
        <section className="lg:col-span-1">
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
        </section>
      </div>
    </div>
  );
}
