'use client';

import { useState } from 'react';

const TEMPLATE = `〇〇イベントの参加表明ページを公開しました。

参加予定の方は、コスいくで作品名・キャラ名・参加時間帯・撮影相談可否などを登録できます。

イベント前に「誰に会えるか」「何を撮れるか」を確認したい方はご利用ください。

※イベント参加申込・チケット購入とは別の、参加予定共有ページです。`;

export function OrganizerAnnouncementCard() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(TEMPLATE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // クリップボードが使えない環境では、テキストを選択してコピーしてもらう
      setCopied(false);
    }
  }

  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-xs font-bold text-violet-700">Xにそのまま投稿できる案内文</p>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 inline-flex items-center gap-1.5 bg-white border border-violet-200 text-violet-700 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-violet-100 transition-colors"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              コピーしました
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m11.25 4.125h-2.625a1.125 1.125 0 01-1.125-1.125V6.75" />
              </svg>
              コピー
            </>
          )}
        </button>
      </div>
      <p className="whitespace-pre-line text-sm text-gray-700 leading-relaxed bg-white rounded-xl border border-gray-100 p-4">
        {TEMPLATE}
      </p>
      <p className="mt-2.5 text-xs text-gray-500">
        「〇〇イベント」の部分をイベント名に置き換えてご利用ください。
      </p>
    </div>
  );
}
