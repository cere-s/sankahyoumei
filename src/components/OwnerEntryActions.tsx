'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Props {
  eventId: string;
  entryId: string;
}

/** ログイン本人にだけ表示する、自分の参加表明の編集・削除操作 */
export function OwnerEntryActions({ eventId, entryId }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? '削除に失敗しました');
      }
      router.push(`/events/${eventId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '削除に失敗しました');
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
      <p className="text-xs text-gray-500 mb-3">あなたの参加表明です（Xログイン本人）</p>
      {!confirming ? (
        <div className="flex gap-2">
          <Link
            href={`/events/${eventId}/entries/${entryId}/edit`}
            className="flex-1 text-center bg-violet-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-violet-700 transition-colors"
          >
            編集する
          </Link>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex-1 border border-red-300 text-red-700 rounded-xl py-2.5 text-sm font-bold hover:bg-red-50 transition-colors"
          >
            削除する
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-red-700">本当に削除しますか？この操作は取り消せません。</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '削除中...' : '削除する'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={loading}
              className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
