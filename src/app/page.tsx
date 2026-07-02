import Link from 'next/link';
import { getAllEvents } from '@/lib/events';
import { getRecentEntries, getEntryCountsByEvent, getPopularCosplayTags } from '@/lib/entries';
import { LatestEntryCard } from '@/components/LatestEntryCard';
import { SectionView } from '@/components/SectionView';
import { formatDate, todayISO } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const ANCHORS = [
  { id: 'featured-events', label: '注目イベント' },
  { id: 'character-search', label: '作品・キャラで探す' },
  { id: 'latest-entries', label: '新着参加表明' },
] as const;

function searchHref(kind: 'work' | 'character', name: string): string {
  return `/search?${kind}=${encodeURIComponent(name)}`;
}

export default async function TopPage() {
  const [events, recentEntries, entryCounts, popularTags] = await Promise.all([
    getAllEvents(),
    getRecentEntries(12).catch(() => []),
    getEntryCountsByEvent().catch((): Record<string, number> => ({})),
    getPopularCosplayTags(10).catch(() => ({ works: [], characters: [] })),
  ]);
  const today = todayISO();
  const upcomingAll = events.filter((e) => e.date >= today);
  const totalEntries = Object.values(entryCounts).reduce((a, b) => a + b, 0);

  // 注目イベント: 開催が近い順に2件 + 参加表明数が多い順に（重複除いて）最大4件まで
  const soonest = upcomingAll.slice(0, 2);
  const popularSorted = upcomingAll
    .filter((e) => (entryCounts[e.id] ?? 0) > 0)
    .sort((a, b) => (entryCounts[b.id] ?? 0) - (entryCounts[a.id] ?? 0) || a.date.localeCompare(b.date));

  const featuredMap = new Map<string, { event: (typeof events)[number]; soon: boolean; popular: boolean }>();
  for (const e of soonest) featuredMap.set(e.id, { event: e, soon: true, popular: false });
  for (const e of popularSorted) {
    const existing = featuredMap.get(e.id);
    if (existing) existing.popular = true;
    else if (featuredMap.size < 4) featuredMap.set(e.id, { event: e, soon: false, popular: true });
  }
  const featuredEvents = [...featuredMap.values()];

  const hasTags = popularTags.works.length > 0 || popularTags.characters.length > 0;

  return (
    <div>
      {/* Hero */}
      <SectionView eventName="home_hero_view">
        <section className="px-4 py-8 sm:py-10">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug mb-3">
              次のイベント、
              <br className="sm:hidden" />
              誰が来るか先に見える。
            </h1>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">
              コスプレ・カメラマンの参加表明を一覧でチェック。
              <br />
              誰がどの作品・キャラで来るかが、当日より前に分かります。
            </p>
            <div className="flex items-center justify-center gap-5 mb-5 text-sm text-gray-600">
              <span><span className="font-mono-data font-bold text-lg text-gray-900">{upcomingAll.length}</span> 開催予定</span>
              <span className="w-px h-3 bg-gray-300" />
              <span><span className="font-mono-data font-bold text-lg text-gray-900">{totalEntries}</span> 参加表明</span>
            </div>
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
          </div>
        </section>
      </SectionView>

      {/* 今見られるもの：アンカーナビ */}
      <nav aria-label="セクションへ移動" className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-2 overflow-x-auto py-2.5">
          <span className="text-xs text-gray-400 shrink-0">今見られるもの</span>
          {ANCHORS.map((a) => (
            <a
              key={a.id}
              href={`#${a.id}`}
              data-analytics="home_anchor_click"
              data-analytics-label={a.id}
              className="shrink-0 text-xs font-bold text-violet-700 bg-violet-50 border border-violet-100 rounded-full px-3.5 py-1.5 hover:bg-violet-100 transition-colors"
            >
              {a.label}
            </a>
          ))}
        </div>
      </nav>

      {/* 今週末の注目イベント */}
      <SectionView eventName="home_featured_events_view">
        <section id="featured-events" className="max-w-5xl mx-auto px-4 pt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800">今週末の注目イベント</h2>
            <Link href="/events" className="text-sm text-violet-600 hover:underline shrink-0">すべて見る →</Link>
          </div>
          {featuredEvents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">開催予定のイベントはありません</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {featuredEvents.map(({ event, soon, popular }) => (
                <div key={event.id} className="relative overflow-hidden bg-white rounded-xl border border-gray-100 shadow-sm p-4 pl-5">
                  <span aria-hidden className={`absolute left-0 top-0 bottom-0 w-1 ${soon ? 'bg-pink-500' : 'bg-amber-400'}`} />
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {soon && (
                      <span className="text-[11px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold">もうすぐ開催</span>
                    )}
                    {popular && (
                      <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">参加表明が多い</span>
                    )}
                  </div>
                  <p className="font-bold text-gray-900 text-sm line-clamp-1">{event.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(event.date)} · {event.location}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    参加表明 <span className="font-mono-data font-bold text-violet-700">{entryCounts[event.id] ?? 0}</span> 件
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Link
                      href={`/events/${event.id}#participants`}
                      data-analytics="home_featured_event_click"
                      data-analytics-event-id={event.id}
                      data-analytics-label="view_participants"
                      className="flex-1 text-center text-xs font-bold text-violet-700 bg-violet-50 border border-violet-100 rounded-lg py-2 hover:bg-violet-100 transition-colors"
                    >
                      参加者を見る
                    </Link>
                    <Link
                      href={`/events/${event.id}/entries/new`}
                      data-analytics="home_featured_event_click"
                      data-analytics-event-id={event.id}
                      data-analytics-label="new_entry"
                      className="flex-1 text-center text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-violet-500 rounded-lg py-2 hover:opacity-90 transition-opacity"
                    >
                      参加表明する
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </SectionView>

      {/* 作品・キャラで探す */}
      <SectionView eventName="home_character_search_view">
        <section id="character-search" className="max-w-5xl mx-auto px-4 pt-10">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-gray-800">作品・キャラで探す</h2>
            <Link href="/search" className="text-sm text-violet-600 hover:underline shrink-0">もっと見る →</Link>
          </div>
          <p className="text-xs text-gray-500 mb-3">気になる作品・キャラをタップすると、参加表明を絞り込めます</p>
          {!hasTags ? (
            <p className="text-sm text-gray-400 text-center py-8">まだ登録された作品・キャラがありません</p>
          ) : (
            <div className="space-y-2.5">
              {popularTags.works.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {popularTags.works.map((w) => (
                    <Link
                      key={`work-${w.name}`}
                      href={searchHref('work', w.name)}
                      data-analytics="home_character_search_click"
                      data-analytics-label={`work:${w.name}`}
                      className="inline-flex items-center gap-1 text-sm bg-white border border-gray-200 text-gray-700 rounded-full px-3.5 py-1.5 hover:border-violet-400 hover:text-violet-700 transition-colors"
                    >
                      {w.name}
                      <span className="text-xs text-gray-400">{w.count}</span>
                    </Link>
                  ))}
                </div>
              )}
              {popularTags.characters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {popularTags.characters.map((c) => (
                    <Link
                      key={`char-${c.name}`}
                      href={searchHref('character', c.name)}
                      data-analytics="home_character_search_click"
                      data-analytics-label={`character:${c.name}`}
                      className="inline-flex items-center gap-1 text-sm bg-violet-50 border border-violet-100 text-violet-700 rounded-full px-3.5 py-1.5 hover:bg-violet-100 transition-colors"
                    >
                      {c.name}
                      <span className="text-xs text-violet-400">{c.count}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </SectionView>

      {/* 新着の参加表明 */}
      <SectionView eventName="home_latest_entries_view">
        <section id="latest-entries" className="max-w-5xl mx-auto px-4 pt-10 pb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800">新着の参加表明</h2>
            <Link href="/events" className="text-sm text-violet-600 hover:underline shrink-0">イベントを見る →</Link>
          </div>
          {recentEntries.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">まだ参加表明がありません</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {recentEntries.map((entry) => {
                const event = events.find((e) => e.id === entry.eventId);
                return (
                  <LatestEntryCard
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
      </SectionView>
    </div>
  );
}
