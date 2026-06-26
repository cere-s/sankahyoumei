import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEventById } from '@/lib/events';
import { getCosplaySuggestions, getEntriesByUserId } from '@/lib/entries';
import { getCurrentAuth } from '@/lib/auth';
import { EntryForm } from '@/components/EntryForm';
import { XLoginButton } from '@/components/auth/XLoginButton';
import { ParticipationNotice } from '@/components/ParticipationNotice';

interface Props {
  params: Promise<{ eventId: string }>;
}

export const dynamic = 'force-dynamic';

export default async function NewEntryPage({ params }: Props) {
  const { eventId } = await params;
  const [event, suggestions, auth] = await Promise.all([
    getEventById(eventId),
    getCosplaySuggestions().catch(() => ({ works: [], charactersByWork: {}, allCharacters: [] })),
    getCurrentAuth(),
  ]);
  if (!event) notFound();

  const nextPath = `/events/${event.id}/entries/new`;

  // 直近の参加表明があれば、その内容をフォームの初期値として引き継ぐ。
  // ただし作品名・キャラ名はイベントごとに変わるため引き継がない（撮影スタンスのみ引き継ぐ）。
  const previous = auth.user ? (await getEntriesByUserId(auth.user.id))[0] ?? null : null;
  const defaults = previous
    ? {
        displayName: previous.displayName,
        participationType: previous.participationType,
        cosplayInfo: previous.cosplayInfo
          ? { workName: '', characterName: '', shootingStatus: previous.cosplayInfo.shootingStatus }
          : undefined,
        photographerInfo: previous.photographerInfo,
      }
    : undefined;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/events/${event.id}`} className="text-sm text-gray-400 hover:text-gray-600">
          ← {event.name}
        </Link>
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">参加表明フォーム</h1>

      <ParticipationNotice className="mb-6" />

      {auth.user && auth.profile?.xUsername ? (
        <EntryForm
          eventId={event.id}
          eventName={event.name}
          eventHashtag={event.hashtag}
          defaultDate={event.date}
          suggestions={suggestions}
          profile={auth.profile}
          defaults={defaults}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            なりすまし防止のため、参加表明の作成には <span className="font-bold">Xログイン</span> が必要です。
            <br />
            ログインすると、あなたのXアカウント名で「Xログイン確認済み」の参加表明を作成できます。
          </p>
          <div className="flex justify-center">
            <XLoginButton next={nextPath} label="Xでログインして参加表明する" />
          </div>
          {auth.user && !auth.profile?.xUsername && (
            <p className="text-xs text-amber-700">
              Xユーザー名を取得できませんでした。一度ログアウトして再度Xログインしてください。
            </p>
          )}
        </div>
      )}
    </div>
  );
}
