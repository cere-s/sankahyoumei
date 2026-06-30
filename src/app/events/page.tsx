import Link from 'next/link';
import { getAllEvents } from '@/lib/events';
import { getEntryCountsByEvent } from '@/lib/entries';
import { EventsBrowser } from '@/components/EventsBrowser';
import { todayISO } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ q?: string; region?: string }>;
}

export default async function EventsPage({ searchParams }: Props) {
  const { q = '', region = '' } = await searchParams;
  const [events, counts] = await Promise.all([getAllEvents(), getEntryCountsByEvent()]);
  const hasImported = events.some((e) => e.isImported);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">イベント一覧</h1>
          <p className="text-sm text-gray-500">参加表明したいイベントを選んでください</p>
        </div>
        <Link
          href="/events/new"
          className="shrink-0 inline-flex items-center gap-1 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          イベントを登録
        </Link>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        見つからないイベントは
        <Link href="/events/new" className="text-violet-600 hover:underline">自分で登録</Link>
        できます。
      </p>

      <EventsBrowser events={events} counts={counts} hasImported={hasImported} today={todayISO()} initialQ={q} initialRegion={region} />
    </div>
  );
}
