'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** 登録者本人が、参加表明ゼロの自分の仮登録イベントを取り下げる */
export function EventOwnerWithdraw({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function withdraw() {
    if (!confirm('登録したイベントを取り下げます。よろしいですか？')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json.error ?? '取り下げに失敗しました');
        setBusy(false);
        return;
      }
      router.push('/events');
    } catch {
      alert('通信に失敗しました');
      setBusy(false);
    }
  }

  return (
    <button
      onClick={withdraw}
      disabled={busy}
      className="text-xs text-red-500 hover:underline disabled:opacity-50"
    >
      {busy ? '取り下げ中...' : 'このイベント登録を取り下げる'}
    </button>
  );
}
