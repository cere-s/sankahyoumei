import type { Metadata } from 'next';
import Link from 'next/link';
import { getEntriesByUserId } from '@/lib/entries';
import { getEventsByIds, getEventsByCreator } from '@/lib/events';
import { getCurrentAuth } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { formatDate } from '@/lib/utils';
import { getReceivedInteractions, getSentInteractions, getBlockedUsers } from '@/lib/interactions';
import { EntryCard } from '@/components/EntryCard';
import { InteractionInbox } from '@/components/InteractionInbox';
import { XLoginButton } from '@/components/auth/XLoginButton';
import { ParticipatingEventsExport, type ExportEvent } from '@/components/ParticipatingEventsExport';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'マイページ',
};

export default async function MyPage() {
  const { user, profile } = await getCurrentAuth();

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-xl font-bold text-gray-900 mb-4">マイページ</h1>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center space-y-4">
          <p className="text-sm text-gray-700">
            自分の参加表明を見るには <span className="font-bold">Xログイン</span> が必要です。
          </p>
          <div className="flex justify-center">
            <XLoginButton next="/mypage" />
          </div>
        </div>
      </div>
    );
  }

  const [entries, received, sent, blocked, myEvents] = await Promise.all([
    getEntriesByUserId(user.id),
    getReceivedInteractions(user.id).catch(() => []),
    getSentInteractions(user.id).catch(() => []),
    getBlockedUsers(user.id).catch(() => []),
    getEventsByCreator(user.id).catch(() => []),
  ]);

  // 参加表明に紐づくイベントを1クエリでまとめて取得（N+1回避）
  const eventMap = await getEventsByIds(entries.map((e) => e.eventId));

  // 出力用：参加イベント（重複排除・日付昇順）
  const exportEvents: ExportEvent[] = [...eventMap.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((ev) => ({ name: ev.name, date: ev.date, location: ev.location }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* プロフィール */}
      <div className="flex items-center gap-3 mb-6">
        {profile?.xAvatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.xAvatarUrl} alt="" className="w-12 h-12 rounded-full" />
        )}
        <div>
          {profile?.xDisplayName && (
            <p className="font-bold text-gray-900">{profile.xDisplayName}</p>
          )}
          {profile?.xUsername && (
            <a
              href={`https://x.com/${profile.xUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-violet-600 hover:underline"
            >
              @{profile.xUsername}
            </a>
          )}
        </div>
      </div>

      {/* 運営メニュー */}
      {isAdmin(user.id) && (
        <div className="mb-6">
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-1.5 text-sm bg-gray-900 text-white rounded-xl px-4 py-2.5 font-bold hover:bg-gray-700 transition-colors"
          >
            イベント確認（運営）
          </Link>
        </div>
      )}

      {/* 登録したイベント */}
      {myEvents.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-3">登録したイベント</h2>
          <div className="space-y-2">
            {myEvents.map((ev) => (
              <Link
                key={ev.id}
                href={`/events/${ev.id}`}
                className="flex items-center justify-between gap-3 bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 hover:border-violet-200 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-sm line-clamp-1">{ev.name}</p>
                  <p className="text-xs text-gray-500">{formatDate(ev.date)}・{ev.location}</p>
                </div>
                {ev.status === 'pending' ? (
                  <span className="shrink-0 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">運営確認待ち</span>
                ) : (
                  <span className="shrink-0 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">公開中</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 交流（届いた・送った・ブロック中） */}
      <InteractionInbox received={received} sent={sent} blocked={blocked} />

      {/* 参加イベント一覧の出力 */}
      <div className="mb-6">
        <ParticipatingEventsExport events={exportEvents} />
      </div>

      {/* 自分の参加表明一覧 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-800">自分の参加表明</h2>
        <span className="text-xs text-gray-400">{entries.length}件</span>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">
          まだ参加表明がありません。イベントページから参加表明できます。
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              eventId={entry.eventId}
              eventName={eventMap.get(entry.eventId)?.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
