import Link from 'next/link';
import type { Event } from '@/types';
import { formatDate, parseHashtags } from '@/lib/utils';

interface Props {
  event: Event;
  /** 今日(YYYY-MM-DD)。渡すと過去イベントに「終了」バッジを表示 */
  today?: string;
}

export function EventCard({ event, today }: Props) {
  const isPast = Boolean(today && event.date < today);
  return (
    <Link href={`/events/${event.id}`} className="block h-full">
      <div className={`rounded-xl border shadow-sm p-4 transition-all h-full flex flex-col ${isPast ? 'bg-gray-50 border-gray-200 hover:border-gray-300' : 'bg-white border-gray-100 hover:shadow-md hover:border-violet-100'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isPast && (
                <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold shrink-0">
                  終了
                </span>
              )}
              {event.region && (
                <span className="text-[10px] bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded font-medium shrink-0">
                  {event.region}
                </span>
              )}
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
          {parseHashtags(event.hashtag).length > 0 && (
            <div className="flex flex-col items-end gap-1 shrink-0">
              {parseHashtags(event.hashtag).slice(0, 2).map((t) => (
                <span key={t} className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-full font-medium">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{event.description}</p>
        <p className="mt-auto pt-3 text-xs text-violet-600 font-medium">参加者を見る →</p>
      </div>
    </Link>
  );
}
