import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEventById } from '@/lib/events';
import { getEntryById } from '@/lib/entries';
import { ShareTextButton } from '@/components/ShareTextButton';
import { ReportButton } from '@/components/ReportButton';
import { TweetEmbed } from '@/components/TweetEmbed';
import {
  PARTICIPATION_TYPE_LABELS,
  PARTICIPATION_TYPE_COLORS,
  COSPLAY_SHOOTING_STATUS_LABELS,
  COSPLAY_STATUS_COLORS,
  PHOTOGRAPHER_FIRST_MEET_LABELS,
  PHOTOGRAPHER_SHOOTING_STYLE_LABELS,
  formatDate,
} from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ eventId: string; entryId: string }>;
}

export default async function EntryDetailPage({ params }: Props) {
  const { eventId, entryId } = await params;
  const [event, entry] = await Promise.all([
    getEventById(eventId),
    getEntryById(entryId),
  ]);

  if (!event || !entry) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/events/${event.id}`} className="text-sm text-gray-400 hover:text-gray-600">
          ← {event.name}
        </Link>
      </div>

      {/* 参加表明カード */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h1 className="text-lg font-bold text-gray-900">{entry.displayName}</h1>
          <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
            PARTICIPATION_TYPE_COLORS[entry.participationType]
          }`}>
            {PARTICIPATION_TYPE_LABELS[entry.participationType]}
          </span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <a
            href={`https://x.com/${entry.xId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-400 hover:text-violet-500 hover:underline"
          >
            @{entry.xId}
          </a>
          <Link
            href={`/participants/${encodeURIComponent(entry.xId)}`}
            className="text-xs text-violet-500 hover:underline"
          >
            参加イベント一覧 →
          </Link>
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-gray-400 shrink-0 w-20">イベント</dt>
            <dd className="text-gray-700">{event.name}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-gray-400 shrink-0 w-20">参加日</dt>
            <dd className="text-gray-700">{formatDate(entry.participationDate)}</dd>
          </div>

          {entry.cosplayInfo && (
            <>
              <div className="flex gap-2">
                <dt className="text-gray-400 shrink-0 w-20">作品</dt>
                <dd className="text-gray-700">{entry.cosplayInfo.workName}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-400 shrink-0 w-20">キャラ</dt>
                <dd className="text-gray-700">{entry.cosplayInfo.characterName}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-400 shrink-0 w-20">撮影・交流</dt>
                <dd>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    COSPLAY_STATUS_COLORS[entry.cosplayInfo.shootingStatus]
                  }`}>
                    {COSPLAY_SHOOTING_STATUS_LABELS[entry.cosplayInfo.shootingStatus]}
                  </span>
                </dd>
              </div>
            </>
          )}

          {entry.photographerInfo && (
            <>
              {entry.photographerInfo.targetWorks && (
                <div className="flex gap-2">
                  <dt className="text-gray-400 shrink-0 w-20">対象作品</dt>
                  <dd className="text-gray-700">{entry.photographerInfo.targetWorks}</dd>
                </div>
              )}
              {entry.photographerInfo.availableHours && (
                <div className="flex gap-2">
                  <dt className="text-gray-400 shrink-0 w-20">撮影時間</dt>
                  <dd className="text-gray-700">{entry.photographerInfo.availableHours}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="text-gray-400 shrink-0 w-20">初対面</dt>
                <dd className="text-gray-700">
                  {PHOTOGRAPHER_FIRST_MEET_LABELS[entry.photographerInfo.firstMeetStatus]}
                </dd>
              </div>
              {entry.photographerInfo.portfolioUrl && (
                <div className="flex gap-2">
                  <dt className="text-gray-400 shrink-0 w-20">作例</dt>
                  <dd>
                    <a href={entry.photographerInfo.portfolioUrl} target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-600 hover:underline text-sm break-all">
                      {entry.photographerInfo.portfolioUrl}
                    </a>
                  </dd>
                </div>
              )}
              {entry.photographerInfo.shootingStyles.length > 0 && (
                <div className="flex gap-2">
                  <dt className="text-gray-400 shrink-0 w-20">スタイル</dt>
                  <dd className="flex flex-wrap gap-1">
                    {entry.photographerInfo.shootingStyles.map((s) => (
                      <span key={s} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        {PHOTOGRAPHER_SHOOTING_STYLE_LABELS[s]}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </>
          )}

          {entry.comment && (
            <div className="flex gap-2 pt-1">
              <dt className="text-gray-400 shrink-0 w-20">コメント</dt>
              <dd className="text-gray-700 leading-relaxed">{entry.comment}</dd>
            </div>
          )}

          {entry.imageUrl && (
            <div className="flex gap-2">
              <dt className="text-gray-400 shrink-0 w-20">画像</dt>
              <dd>
                <a href={entry.imageUrl} target="_blank" rel="noopener noreferrer"
                  className="text-violet-600 hover:underline text-sm break-all">
                  {entry.imageUrl}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* 埋め込みツイート */}
      {entry.tweetUrl && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3">本人のツイート</h2>
          <TweetEmbed url={entry.tweetUrl} />
        </div>
      )}

      {/* X投稿テキスト */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Xに投稿する</h2>
        <ShareTextButton entry={entry} event={event} />
      </div>

      <Link href={`/events/${event.id}`}
        className="block w-full border border-gray-200 text-gray-600 text-center rounded-xl py-3 text-sm hover:bg-gray-50 transition-colors">
        {event.name} の参加者一覧に戻る
      </Link>

      <div className="mt-6 text-center">
        <ReportButton entryId={entry.id} displayName={entry.displayName} />
      </div>
    </div>
  );
}
