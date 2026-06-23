import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEventById } from '@/lib/events';
import { getEntryById, getCosplaySuggestions } from '@/lib/entries';
import { EditEntryForm } from '@/components/EditEntryForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ eventId: string; entryId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function EditEntryPage({ params, searchParams }: Props) {
  const { eventId, entryId } = await params;
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-2xl mb-3">🔒</p>
        <h1 className="text-lg font-bold text-gray-900 mb-2">編集URLが無効です</h1>
        <p className="text-sm text-gray-500 mb-6">
          参加表明作成時に発行された編集URLからアクセスしてください。
        </p>
        <Link href={`/events/${eventId}`}
          className="text-sm text-violet-600 hover:underline">
          ← イベントページへ戻る
        </Link>
      </div>
    );
  }

  const [event, entry, suggestions] = await Promise.all([
    getEventById(eventId),
    getEntryById(entryId),
    getCosplaySuggestions().catch(() => ({ works: [], charactersByWork: {}, allCharacters: [] })),
  ]);

  if (!event || !entry) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/events/${event.id}/entries/${entry.id}`}
          className="text-sm text-gray-400 hover:text-gray-600">
          ← {entry.displayName} の参加表明
        </Link>
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">参加表明を編集</h1>
      <p className="text-sm text-gray-500 mb-6">
        {event.name} — {entry.displayName}
      </p>
      <EditEntryForm entry={entry} event={event} editToken={token} suggestions={suggestions} />
    </div>
  );
}
