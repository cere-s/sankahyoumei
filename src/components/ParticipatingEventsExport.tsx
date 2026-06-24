'use client';

import { useState } from 'react';

export interface ExportEvent {
  name: string;
  date: string; // YYYY-MM-DD
  location?: string;
}

function formatJa(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
}

function buildText(events: ExportEvent[]): string {
  const lines = ['参加予定イベント一覧', ''];
  for (const e of events) {
    lines.push(`・${formatJa(e.date)} ${e.name}${e.location ? `（${e.location}）` : ''}`);
  }
  return lines.join('\n');
}

export function ParticipatingEventsExport({ events }: { events: ExportEvent[] }) {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(false);

  const text = buildText(events);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShow(true);
    }
  }

  if (events.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-900">参加イベント一覧を出力</h2>
        <span className="text-xs text-gray-400">{events.length}件</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 bg-violet-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-violet-700 active:bg-violet-800 transition-colors"
        >
          {copied ? 'コピーしました！' : 'テキストをコピー'}
        </button>
        <button
          onClick={() => setShow((v) => !v)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {show ? '閉じる' : '確認'}
        </button>
      </div>
      {show && (
        <textarea
          readOnly
          value={text}
          rows={Math.min(12, events.length + 3)}
          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          className="mt-3 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
      )}
    </div>
  );
}
