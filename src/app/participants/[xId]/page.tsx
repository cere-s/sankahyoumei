import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEntriesByXId } from '@/lib/entries';
import { getEventById } from '@/lib/events';
import {
  PARTICIPATION_TYPE_LABELS,
  PARTICIPATION_TYPE_COLORS,
  COSPLAY_SHOOTING_STATUS_LABELS,
  COSPLAY_STATUS_COLORS,
  formatDate,
} from '@/lib/utils';
import type { Event } from '@/types';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ xId: string }>;
}

export default async function ParticipantPage({ params }: Props) {
  const { xId } = await params;
  const decodedXId = decodeURIComponent(xId);
  const entries = await getEntriesByXId(decodedXId);

  if (entries.length === 0) notFound();

  const eventIds = [...new Set(entries.map((e) => e.eventId))];
  const eventResults = await Promise.all(eventIds.map((id) => getEventById(id)));
  const eventMap = Object.fromEntries(
    eventResults.filter((e): e is Event => e !== null).map((e) => [e.id, e]),
  );

  const displayName = entries[0].displayName;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <p className="text-sm text-gray-400 mb-1">参加者</p>
        <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
        <a
          href={`https://x.com/${decodedXId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-violet-600 hover:underline"
        >
          @{decodedXId}
        </a>
      </div>

      <p className="text-xs text-gray-500 mb-4">{entries.length} 件の参加表明</p>

      <div className="space-y-3">
        {entries.map((entry) => {
          const event = eventMap[entry.eventId];
          return (
            <Link
              key={entry.id}
              href={`/events/${entry.eventId}/entries/${entry.id}`}
              className="block"
            >
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-violet-100 transition-all">
                {event && (
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-bold text-gray-900">{event.name}</p>
                    <span className="text-xs text-gray-400 shrink-0">{formatDate(event.date)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PARTICIPATION_TYPE_COLORS[entry.participationType]}`}>
                    {PARTICIPATION_TYPE_LABELS[entry.participationType]}
                  </span>
                  {entry.cosplayInfo && (
                    <>
                      <span className="text-xs text-gray-600">{entry.cosplayInfo.workName}</span>
                      <span className="text-xs text-gray-400">/</span>
                      <span className="text-xs text-gray-600">{entry.cosplayInfo.characterName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COSPLAY_STATUS_COLORS[entry.cosplayInfo.shootingStatus]}`}>
                        {COSPLAY_SHOOTING_STATUS_LABELS[entry.cosplayInfo.shootingStatus]}
                      </span>
                    </>
                  )}
                </div>
                {entry.comment && (
                  <p className="mt-2 text-xs text-gray-500 line-clamp-1">{entry.comment}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
