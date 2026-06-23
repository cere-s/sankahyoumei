import Link from 'next/link';
import type { Event } from '@/types';
import { formatDate } from '@/lib/utils';

interface Props {
  event: Event;
}

export function EventCard({ event }: Props) {
  return (
    <Link href={`/events/${event.id}`} className="block h-full">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-violet-100 transition-all h-full flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-gray-900 text-base">{event.name}</h3>
              {event.isImported && (
                <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-medium shrink-0">
                  外部取得
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{formatDate(event.date)}</p>
            <p className="text-sm text-gray-500">{event.location}</p>
          </div>
          {event.hashtag && (
            <span className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-full shrink-0 font-medium">
              #{event.hashtag}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{event.description}</p>
        <p className="mt-auto pt-3 text-xs text-violet-600 font-medium">参加者を見る →</p>
      </div>
    </Link>
  );
}
