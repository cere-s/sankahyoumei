'use client';

import Link from 'next/link';
import type { ParticipationEntry } from '@/types';
import {
  PARTICIPATION_TYPE_LABELS,
  PARTICIPATION_TYPE_COLORS,
  COSPLAY_SHOOTING_STATUS_LABELS,
  COSPLAY_STATUS_COLORS,
  PHOTOGRAPHER_FIRST_MEET_LABELS,
  PHOTOGRAPHER_SHOOTING_STYLE_LABELS,
} from '@/lib/utils';

interface Props {
  entry: ParticipationEntry;
  eventId: string;
  eventName?: string;
}

export function EntryCard({ entry, eventId, eventName }: Props) {
  return (
    <Link href={`/events/${eventId}/entries/${entry.id}`} className="block h-full">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-violet-100 transition-all h-full flex flex-col">
        {eventName && (
          <p className="text-xs text-violet-600 font-medium mb-2">{eventName}</p>
        )}
        <div className="flex items-start gap-2 flex-wrap">
          <span className="font-bold text-gray-900 text-sm">{entry.displayName}</span>
          <a
            href={`https://x.com/${entry.xId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 text-xs self-center hover:text-violet-500 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            @{entry.xId}
          </a>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              PARTICIPATION_TYPE_COLORS[entry.participationType]
            }`}
          >
            {PARTICIPATION_TYPE_LABELS[entry.participationType]}
          </span>
          {entry.isVerifiedX && (
            <span className="inline-flex items-center gap-0.5 text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded-full font-medium self-center">
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              本人確認済
            </span>
          )}
        </div>

        {entry.cosplayInfo && (
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-700">
              <span className="text-gray-400 text-xs">作品 </span>
              {entry.cosplayInfo.workName}
            </p>
            <p className="text-sm text-gray-700">
              <span className="text-gray-400 text-xs">キャラ </span>
              {entry.cosplayInfo.characterName}
            </p>
            <span
              className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                COSPLAY_STATUS_COLORS[entry.cosplayInfo.shootingStatus]
              }`}
            >
              {COSPLAY_SHOOTING_STATUS_LABELS[entry.cosplayInfo.shootingStatus]}
            </span>
          </div>
        )}

        {entry.photographerInfo && (
          <div className="mt-2 space-y-1">
            {entry.photographerInfo.targetWorks && (
              <p className="text-sm text-gray-700">
                <span className="text-gray-400 text-xs">対象作品 </span>
                {entry.photographerInfo.targetWorks}
              </p>
            )}
            {entry.photographerInfo.availableHours && (
              <p className="text-sm text-gray-700">
                <span className="text-gray-400 text-xs">撮影可能時間 </span>
                {entry.photographerInfo.availableHours}
              </p>
            )}
            <p className="text-sm text-gray-700">
              <span className="text-gray-400 text-xs">初対面 </span>
              {PHOTOGRAPHER_FIRST_MEET_LABELS[entry.photographerInfo.firstMeetStatus]}
            </p>
            {entry.photographerInfo.shootingStyles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {entry.photographerInfo.shootingStyles.map((s) => (
                  <span
                    key={s}
                    className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full"
                  >
                    {PHOTOGRAPHER_SHOOTING_STYLE_LABELS[s]}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {entry.comment && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{entry.comment}</p>
        )}

        <div className="mt-auto pt-3 flex justify-end">
          <a
            href={`/participants/${encodeURIComponent(entry.xId)}`}
            className="text-xs text-violet-500 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            参加イベント一覧 →
          </a>
        </div>
      </div>
    </Link>
  );
}
