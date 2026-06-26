import { getAllEvents } from '@/lib/events';
import { EventsBrowser } from '@/components/EventsBrowser';
import { todayISO } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ q?: string; region?: string }>;
}

export default async function EventsPage({ searchParams }: Props) {
  const { q = '', region = '' } = await searchParams;
  const events = await getAllEvents();
  const hasImported = events.some((e) => e.isImported);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">イベント一覧</h1>
      <p className="text-sm text-gray-500 mb-4">参加表明したいイベントを選んでください</p>

      <EventsBrowser events={events} hasImported={hasImported} today={todayISO()} initialQ={q} initialRegion={region} />
    </div>
  );
}
