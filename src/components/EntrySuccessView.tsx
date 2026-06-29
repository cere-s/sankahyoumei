'use client';

import { useState } from 'react';
import Link from 'next/link';
import { parseHashtags } from '@/lib/utils';

interface Props {
  eventId: string;
  eventName: string;
  eventHashtag?: string;
  entryId: string;
  editToken: string;
}

export function EntrySuccessView({ eventId, eventName, eventHashtag, entryId, editToken }: Props) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const editUrl = `${origin}/events/${eventId}/entries/${entryId}/edit?token=${editToken}`;
  const shareUrl = `${origin}/events/${eventId}/entries/${entryId}`;
  const tags = parseHashtags(eventHashtag);
  const intentUrl =
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(`「${eventName}」に参加表明しました！`)}` +
    `&url=${encodeURIComponent(shareUrl)}` +
    (tags.length ? `&hashtags=${encodeURIComponent(tags.join(','))}` : '');

  async function copyEditUrl() {
    await navigator.clipboard.writeText(editUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-lg font-bold text-gray-900">参加表明しました！</h2>
        <p className="text-sm text-gray-500 mt-1">参加者一覧に表示されます</p>
      </div>

      <a
        href={intentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full bg-black text-white rounded-xl py-3 font-bold text-sm hover:bg-gray-800 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Xで投稿する
      </a>
      <p className="-mt-3 text-center text-xs text-gray-400">投稿画面が開きます。OGPカード付きで共有できます。</p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
        <p className="text-sm font-bold text-amber-900">⚠️ 編集URLを保存してください</p>
        <p className="text-xs text-amber-800 leading-relaxed">
          このURLを持っている人だけが参加表明を編集・削除できます。再表示はできないため、今すぐ保存してください。
        </p>
        <div className="bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs text-gray-700 break-all font-mono">
          {editUrl}
        </div>
        <button
          onClick={copyEditUrl}
          className="w-full bg-amber-600 text-white rounded-lg py-2.5 text-sm font-bold hover:bg-amber-700 transition-colors"
        >
          {copied ? 'コピーしました！' : '編集URLをコピー'}
        </button>
      </div>

      <Link
        href={`/events/${eventId}/entries/${entryId}`}
        className="block w-full bg-gradient-to-r from-pink-500 to-violet-500 text-white text-center rounded-xl py-3 font-bold text-sm hover:opacity-90 transition-opacity"
      >
        参加表明ページへ →
      </Link>
      <Link
        href={`/events/${eventId}`}
        className="block w-full border border-gray-200 text-gray-600 text-center rounded-xl py-3 text-sm hover:bg-gray-50 transition-colors"
      >
        イベントの参加者一覧へ
      </Link>
    </div>
  );
}
