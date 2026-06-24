import { Suspense } from 'react';
import { getAllEvents } from '@/lib/events';
import { EventCard } from '@/components/EventCard';
import { EventSearch } from '@/components/EventSearch';
import { EventRegionTabs } from '@/components/EventRegionTabs';

export const dynamic = 'force-dynamic';

// タブの表示順（未知の地方は末尾に出現順で追加）
const REGION_ORDER = ['関東', '東海', '関西'];

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, '');
}

interface Props {
  searchParams: Promise<{ q?: string; region?: string }>;
}

export default async function EventsPage({ searchParams }: Props) {
  const { q = '', region = '' } = await searchParams;
  const events = await getAllEvents();
  const hasImported = events.some((e) => e.isImported);

  // 地方タブ（件数つき）。存在する地方のみ、優先順で並べる
  const regionCounts = new Map<string, number>();
  for (const e of events) {
    if (e.region) regionCounts.set(e.region, (regionCounts.get(e.region) ?? 0) + 1);
  }
  const regionTabs = [...regionCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => {
      const ia = REGION_ORDER.indexOf(a.name);
      const ib = REGION_ORDER.indexOf(b.name);
      if (ia === -1 && ib === -1) return a.name.localeCompare(b.name, 'ja');
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

  const query = normalize(q);
  const filtered = events.filter((e) => {
    if (region && e.region !== region) return false;
    if (query) {
      const match =
        normalize(e.name).includes(query) ||
        normalize(e.location).includes(query) ||
        normalize(e.hashtag ?? '').includes(query) ||
        normalize(e.organizer ?? '').includes(query);
      if (!match) return false;
    }
    return true;
  });

  const hasFilter = Boolean(q || region);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">イベント一覧</h1>
      <p className="text-sm text-gray-500 mb-4">参加表明したいイベントを選んでください</p>

      <Suspense>
        <EventSearch defaultValue={q} />
      </Suspense>

      {regionTabs.length > 0 && (
        <Suspense>
          <EventRegionTabs regions={regionTabs} total={events.length} active={region} />
        </Suspense>
      )}

      {hasImported && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5 text-xs text-amber-800">
          <p className="font-medium mb-0.5">「外部取得」バッジのイベントについて</p>
          <p>外部サイトから自動取得した候補情報です。日程・会場・参加条件は変更される場合があります。参加前に必ず公式情報をご確認ください。</p>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">
          {hasFilter ? '条件に一致するイベントがありません' : 'イベントデータがありません'}
        </p>
      ) : (
        <>
          {hasFilter && (
            <p className="text-xs text-gray-500 mb-3">{filtered.length} 件見つかりました</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
