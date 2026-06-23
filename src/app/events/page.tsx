import { getAllEvents } from '@/lib/events';
import { EventCard } from '@/components/EventCard';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const events = await getAllEvents();
  const hasImported = events.some((e) => e.isImported);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">イベント一覧</h1>
      <p className="text-sm text-gray-500 mb-4">参加表明したいイベントを選んでください</p>
      {hasImported && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5 text-xs text-amber-800">
          <p className="font-medium mb-0.5">「外部取得」バッジのイベントについて</p>
          <p>外部サイトから自動取得した候補情報です。日程・会場・参加条件は変更される場合があります。参加前に必ず公式情報をご確認ください。</p>
        </div>
      )}
      {events.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">
          イベントデータがありません。supabase/seed.sql を実行してください。
        </p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
