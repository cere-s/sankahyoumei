import Link from 'next/link';
import type { Event } from '@/types';
import { formatDate, parseHashtags } from '@/lib/utils';

interface Props {
  event: Event;
  /** 今日(YYYY-MM-DD)。渡すと過去イベントに「終了」バッジを表示 */
  today?: string;
  /** 参加表明数 */
  count?: number;
}

export function EventCard({ event, today, count }: Props) {
  const isPast = Boolean(today && event.date < today);
  return (
    <Link
      href={`/events/${event.id}`}
      className="block h-full"
      data-analytics="event_card_clicked"
      data-analytics-event-id={event.id}
    >
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
              {event.status === 'pending' ? (
                <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-bold shrink-0">
                  運営確認待ち
                </span>
              ) : (
                event.createdBy && (
                  <span className="text-[10px] bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded font-medium shrink-0">
                    ユーザー投稿
                  </span>
                )
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
        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            参加表明 <span className="font-bold text-gray-700">{count ?? 0}</span> 人
          </span>
          <span className="text-xs text-violet-600 font-medium shrink-0">参加者を見る →</span>
        </div>
      </div>
    </Link>
  );
}
