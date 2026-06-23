import { Suspense } from 'react';
import { getAllEvents } from '@/lib/events';
import { EventCard } from '@/components/EventCard';
import { EventSearch } from '@/components/EventSearch';

export const dynamic = 'force-dynamic';

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, '');
}

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function EventsPage({ searchParams }: Props) {
  const { q = '' } = await searchParams;
  const events = await getAllEvents();
  const hasImported = events.some((e) => e.isImported);

  const filtered = q
    ? events.filter((e) => {
        const query = normalize(q);
        return (
          normalize(e.name).includes(query) ||
          normalize(e.location).includes(query) ||
          normalize(e.hashtag ?? '').includes(query) ||
          normalize(e.organizer ?? '').includes(query)
        );
      })
    : events;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">イベント一覧</h1>
      <p className="text-sm text-gray-500 mb-4">参加表明したいイベントを選んでください</p>

      <Suspense>
        <EventSearch defaultValue={q} />
      </Suspense>

      {hasImported && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5 text-xs text-amber-800">
          <p className="font-medium mb-0.5">「外部取得」バッジのイベントについて</p>
          <p>外部サイトから自動取得した候補情報です。日程・会場・参加条件は変更される場合があります。参加前に必ず公式情報をご確認ください。</p>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">
          {q ? `「${q}」に一致するイベントがありません` : 'イベントデータがありません'}
        </p>
      ) : (
        <>
          {q && (
            <p className="text-xs text-gray-500 mb-3">{filtered.length} 件見つかりました</p>
          )}
          <div className="space-y-3">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
