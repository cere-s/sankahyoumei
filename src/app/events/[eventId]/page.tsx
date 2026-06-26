import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEventById } from '@/lib/events';
import { getEntriesByEventId } from '@/lib/entries';
import { ParticipantList } from '@/components/ParticipantList';
import { ParticipationNotice } from '@/components/ParticipationNotice';
import { formatDate, todayISO, parseHashtags } from '@/lib/utils';

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

  const hasDetails = Boolean(
    event.organizer || event.address || event.officialUrl || event.xUrl || (event.isImported && event.sourceUrl)
  );
  const isPast = event.date < todayISO();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* ヒーローカード */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-violet-500 text-white p-6 shadow-sm mb-5">
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {isPast && (
            <span className="text-[11px] bg-white text-gray-700 px-2 py-0.5 rounded-full font-bold">終了したイベント</span>
          )}
          {event.region && (
            <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-medium">{event.region}</span>
          )}
          {parseHashtags(event.hashtag).map((t) => (
            <span key={t} className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-medium">#{t}</span>
          ))}
          {event.isImported && (
            <span className="text-[11px] bg-amber-300/90 text-amber-900 px-2 py-0.5 rounded-full font-medium">外部取得</span>
          )}
        </div>

        <h1 className="text-2xl font-bold leading-snug mb-3">{event.name}</h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-violet-50">
          <span className="inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
            {formatDate(event.date)}
          </span>
          <span className="inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
            {event.location}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 mt-5">
          <p className="text-sm text-violet-50">
            参加表明 <span className="text-xl font-bold text-white">{entries.length}</span> 件
          </p>
          <Link
            href={`/events/${event.id}/entries/new`}
            className="bg-white text-violet-700 rounded-xl px-5 py-2.5 font-bold text-sm shadow-sm hover:bg-violet-50 transition-colors"
          >
            参加表明する
          </Link>
        </div>
      </div>

      {/* 詳細・注意（折りたたみで軽く） */}
      {(hasDetails || event.isImported) && (
        <details className="group mb-5 bg-white rounded-xl border border-gray-100 shadow-sm">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm text-gray-600 flex items-center justify-between">
            <span>イベントの詳細・ご注意</span>
            <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </summary>
          <div className="px-4 pb-4 pt-1 border-t border-gray-50">
            <dl className="space-y-1.5 text-sm text-gray-600">
              {event.organizer && (
                <div className="flex gap-2"><dt className="text-gray-400 shrink-0 w-14">主催</dt><dd>{event.organizer}</dd></div>
              )}
              {event.address && (
                <div className="flex gap-2"><dt className="text-gray-400 shrink-0 w-14">住所</dt><dd>{event.address}</dd></div>
              )}
              {event.officialUrl && (
                <div className="flex gap-2"><dt className="text-gray-400 shrink-0 w-14">公式</dt>
                  <dd><a href={event.officialUrl} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline break-all">{event.officialUrl}</a></dd>
                </div>
              )}
              {event.xUrl && (
                <div className="flex gap-2"><dt className="text-gray-400 shrink-0 w-14">X</dt>
                  <dd><a href={event.xUrl} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline break-all">{event.xUrl}</a></dd>
                </div>
              )}
              {event.isImported && event.sourceUrl && (
                <div className="flex gap-2"><dt className="text-gray-400 shrink-0 w-14">取得元</dt>
                  <dd><a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline break-all">cos-cam.work で確認 →</a></dd>
                </div>
              )}
            </dl>
            {event.isImported && (
              <p className="mt-3 text-xs text-amber-700 leading-relaxed">
                ※ このイベントは外部サイトから自動取得した候補情報です。日程・会場・参加条件は変わる場合があるため、参加前に必ず公式情報をご確認ください。
              </p>
            )}
          </div>
        </details>
      )}

      <ParticipationNotice className="mb-4" />

      <ParticipantList entries={entries} eventId={eventId} />
    </div>
  );
}
