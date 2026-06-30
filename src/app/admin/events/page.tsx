import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { getEventsForModeration } from '@/lib/events';
import { EventModeration } from '@/components/EventModeration';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'イベント確認',
  robots: { index: false, follow: false },
};

export default async function AdminEventsPage() {
  const user = await getCurrentUser();
  // 運営以外には存在を見せない
  if (!user || !isAdmin(user.id)) notFound();

  const events = await getEventsForModeration();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">イベント確認（運営）</h1>
      <p className="text-sm text-gray-500 mb-5">
        ユーザーが登録したイベントを確認・修正・取り下げできます。
      </p>
      <EventModeration events={events} />
    </div>
  );
}
