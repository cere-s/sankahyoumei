'use client';

import { useState } from 'react';
import type { ParticipationEntry, Event } from '@/types';
import {
  PARTICIPATION_TYPE_LABELS,
  COSPLAY_SHOOTING_STATUS_LABELS,
  PHOTOGRAPHER_FIRST_MEET_LABELS,
  formatDate,
} from '@/lib/utils';

interface Props {
  entry: ParticipationEntry;
  event: Event;
}

function buildShareText(entry: ParticipationEntry, event: Event, origin: string): string {
  const lines: string[] = [
    `#${event.hashtag} 参加表明`,
    '',
    `参加日：${formatDate(entry.participationDate)}`,
    `参加種別：${PARTICIPATION_TYPE_LABELS[entry.participationType]}`,
  ];

  if (entry.cosplayInfo) {
    if (entry.cosplayInfo.workName) lines.push(`作品：${entry.cosplayInfo.workName}`);
    if (entry.cosplayInfo.characterName) lines.push(`キャラ：${entry.cosplayInfo.characterName}`);
    lines.push(`撮影・交流：${COSPLAY_SHOOTING_STATUS_LABELS[entry.cosplayInfo.shootingStatus]}`);
  }

  if (entry.photographerInfo) {
    if (entry.photographerInfo.targetWorks)
      lines.push(`撮りたい作品：${entry.photographerInfo.targetWorks}`);
    if (entry.photographerInfo.availableHours)
      lines.push(`撮影可能時間：${entry.photographerInfo.availableHours}`);
    lines.push(`初対面：${PHOTOGRAPHER_FIRST_MEET_LABELS[entry.photographerInfo.firstMeetStatus]}`);
  }

  if (entry.comment) {
    lines.push('');
    lines.push(entry.comment);
  }

  lines.push('');
  lines.push('参加表明ページ：');
  lines.push(`${origin}/events/${entry.eventId}/entries/${entry.id}`);

  return lines.join('\n');
}

function getOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? '';
}

export function ShareTextButton({ entry, event }: Props) {
  const [copied, setCopied] = useState(false);
  const [showText, setShowText] = useState(false);

  const shareText = buildShareText(entry, event, getOrigin());

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShowText(true);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button onClick={handleCopy}
          className="flex-1 bg-violet-600 text-white rounded-xl py-3 text-sm font-bold hover:bg-violet-700 active:bg-violet-800 transition-colors">
          {copied ? 'コピーしました！' : 'X投稿用テキストをコピー'}
        </button>
        <button onClick={() => setShowText((v) => !v)}
          className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          {showText ? '閉じる' : '確認'}
        </button>
      </div>

      {showText && (
        <div>
          <textarea readOnly value={shareText} rows={10}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
            onClick={(e) => (e.target as HTMLTextAreaElement).select()} />
          <p className="text-xs text-gray-400 mt-1">テキストをタップして全選択できます</p>
        </div>
      )}
    </div>
  );
}
