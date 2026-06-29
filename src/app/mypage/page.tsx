import type { Metadata } from 'next';
import { getEntriesByUserId } from '@/lib/entries';
import { getEventsByIds } from '@/lib/events';
import { getCurrentAuth } from '@/lib/auth';
import { EntryCard } from '@/components/EntryCard';
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

  const entries = await getEntriesByUserId(user.id);

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
