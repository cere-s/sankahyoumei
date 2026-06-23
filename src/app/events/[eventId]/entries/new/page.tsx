import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEventById } from '@/lib/events';
import { EntryForm } from '@/components/EntryForm';

interface Props {
  params: Promise<{ eventId: string }>;
}

export const dynamic = 'force-dynamic';

export default async function NewEntryPage({ params }: Props) {
  const { eventId } = await params;
  const event = await getEventById(eventId);
  if (!event) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/events/${event.id}`} className="text-sm text-gray-400 hover:text-gray-600">
          ← {event.name}
        </Link>
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">参加表明フォーム</h1>
      <EntryForm eventId={event.id} eventName={event.name} defaultDate={event.date} />
    </div>
  );
}
