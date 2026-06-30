import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { EventSubmitForm } from '@/components/EventSubmitForm';
import { XLoginButton } from '@/components/auth/XLoginButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'イベントを登録',
};

export default async function NewEventPage() {
  const user = await getCurrentUser();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/events" className="text-sm text-gray-400 hover:text-gray-600">
          ← イベント一覧
        </Link>
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">イベントを登録</h1>
      <p className="text-sm text-gray-500 mb-6">
        見つからないイベントを追加できます。登録するとすぐに参加表明を集められます。
      </p>

      {user ? (
        <EventSubmitForm />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            なりすまし・スパム防止のため、イベント登録には <span className="font-bold">Xログイン</span> が必要です。
          </p>
          <div className="flex justify-center">
            <XLoginButton next="/events/new" label="Xでログインして登録する" />
          </div>
        </div>
      )}
    </div>
  );
}
