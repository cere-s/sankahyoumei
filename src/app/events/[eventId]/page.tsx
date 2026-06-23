import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEventById } from '@/lib/events';
import { getEntriesByEventId } from '@/lib/entries';
import { ParticipantList } from '@/components/ParticipantList';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ eventId: string }>;
}

export default async function EventDetailPage({ params }: Props) {
  const { eventId } = await params;
  const [event, entries] = await Promise.all([
    getEventById(eventId),
    getEntriesByEventId(eventId).catch(() => []),
  ]);

  if (!event) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* イベント情報 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h1 className="text-xl font-bold text-gray-900">{event.name}</h1>
          {event.hashtag && (
            <span className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-full shrink-0 font-medium">
              #{event.hashtag}
            </span>
          )}
        </div>
        <dl className="space-y-1.5 text-sm text-gray-600 mb-4">
          <div className="flex gap-2">
            <dt className="text-gray-400 shrink-0 w-14">開催日</dt>
            <dd>{formatDate(event.date)}</dd>
          </div>
          {event.organizer && (
            <div className="flex gap-2">
              <dt className="text-gray-400 shrink-0 w-14">主催</dt>
              <dd>{event.organizer}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="text-gray-400 shrink-0 w-14">会場</dt>
            <dd>{event.location}</dd>
          </div>
          {event.address && (
            <div className="flex gap-2">
              <dt className="text-gray-400 shrink-0 w-14">住所</dt>
              <dd>{event.address}</dd>
            </div>
          )}
          {event.officialUrl && (
            <div className="flex gap-2">
              <dt className="text-gray-400 shrink-0 w-14">公式</dt>
              <dd>
                <a href={event.officialUrl} target="_blank" rel="noopener noreferrer"
                  className="text-violet-600 hover:underline break-all">
                  {event.officialUrl}
                </a>
              </dd>
            </div>
          )}
          {event.xUrl && (
            <div className="flex gap-2">
              <dt className="text-gray-400 shrink-0 w-14">X</dt>
              <dd>
                <a href={event.xUrl} target="_blank" rel="noopener noreferrer"
                  className="text-violet-600 hover:underline break-all">
                  {event.xUrl}
                </a>
              </dd>
            </div>
          )}
          {event.sourceUrl && event.isImported && (
            <div className="flex gap-2">
              <dt className="text-gray-400 shrink-0 w-14">取得元</dt>
              <dd>
                <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer"
                  className="text-violet-600 hover:underline break-all">
                  cos-cam.work で確認 →
                </a>
              </dd>
            </div>
          )}
        </dl>
        {event.isImported && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 text-xs text-amber-800 space-y-0.5">
            <p className="font-medium">このイベントは外部サイトから自動取得した情報です</p>
            <p>・イベント情報は取得元・公式サイトを確認してください</p>
            <p>・日程・会場・参加条件は変更される場合があります</p>
            <p>・参加前に必ず公式情報を確認してください</p>
          </div>
        )}
        <Link href={`/events/${event.id}/entries/new`}
          className="block w-full bg-violet-600 text-white text-center rounded-xl py-3 font-bold text-sm hover:bg-violet-700 transition-colors">
          参加表明する
        </Link>
      </div>

      <ParticipantList entries={entries} eventId={eventId} />
    </div>
  );
}
