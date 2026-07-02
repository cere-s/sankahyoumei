import Link from 'next/link';
import type { Event } from '@/types';
import { formatDateStub, parseHashtags } from '@/lib/utils';

interface Props {
  event: Event;
  /** 今日(YYYY-MM-DD)。渡すと過去イベントの日付半券をグレーにする */
  today?: string;
  /** 参加表明数 */
  count?: number;
}

export function EventCard({ event, today, count }: Props) {
  const isPast = Boolean(today && event.date < today);
  const stub = formatDateStub(event.date);
  const metaParts = [event.location, event.region].filter(Boolean);

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block h-full"
      data-analytics="event_card_clicked"
      data-analytics-event-id={event.id}
    >
      <div className="relative h-full flex overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm group-hover:shadow-md motion-safe:transition-all">
        {/* 日付の半券 */}
        <div className={`relative flex w-14 shrink-0 flex-col items-center justify-center py-2 ${isPast ? 'bg-gray-100' : 'bg-violet-50'}`}>
          {stub && (
            <>
              <span className={`text-[9px] font-bold ${isPast ? 'text-gray-400' : 'text-violet-600'}`}>{stub.month}</span>
              <span className="font-mono-data text-xl font-bold leading-none text-gray-900 my-0.5">{stub.day}</span>
              <span className="text-[9px] text-gray-400">{stub.weekday}</span>
            </>
          )}
        </div>
        <span aria-hidden className="w-0 border-l border-dashed border-gray-200" />

        <div className="min-w-0 flex-1 flex flex-col p-3">
          <h3 className="font-bold text-gray-900 text-[15px] leading-snug line-clamp-2">{event.name}</h3>
          {metaParts.length > 0 && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 line-clamp-1">
              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {metaParts.join(' ・ ')}
            </p>
          )}

          {(event.status === 'pending' || event.isImported || event.createdBy) && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {event.status === 'pending' && (
                <span className="text-[9px] font-bold text-amber-700 bg-amber-100 pl-1.5 pr-2.5 py-0.5 [clip-path:polygon(0_0,calc(100%-4px)_0,100%_50%,calc(100%-4px)_100%,0_100%)]">
                  運営確認待ち
                </span>
              )}
              {event.isImported && (
                <span className="text-[9px] font-bold text-amber-700 bg-amber-100 pl-1.5 pr-2.5 py-0.5 [clip-path:polygon(0_0,calc(100%-4px)_0,100%_50%,calc(100%-4px)_100%,0_100%)]">
                  外部取得
                </span>
              )}
              {event.status !== 'pending' && event.createdBy && (
                <span className="text-[9px] font-bold text-violet-700 bg-violet-50 pl-1.5 pr-2.5 py-0.5 [clip-path:polygon(0_0,calc(100%-4px)_0,100%_50%,calc(100%-4px)_100%,0_100%)]">
                  ユーザー投稿
                </span>
              )}
            </div>
          )}

          {parseHashtags(event.hashtag).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {parseHashtags(event.hashtag).slice(0, 3).map((t) => (
                <span key={t} className="text-[10px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {event.description && (
            <p className="mt-1.5 text-xs text-gray-500 line-clamp-2">{event.description}</p>
          )}

          <div className="mt-auto pt-2 flex items-center justify-between gap-2 border-t border-gray-50">
            <span className="text-xs text-gray-500">
              参加表明 <span className="font-mono-data font-bold text-gray-700">{count ?? 0}</span> 人
            </span>
            <span className="text-xs text-violet-600 font-medium shrink-0">参加者を見る →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
