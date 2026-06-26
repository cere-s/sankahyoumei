'use client';

import Link from 'next/link';
import type { ParticipationEntry } from '@/types';
import { AuthStatusBadge } from './AuthStatus';
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
        {/* 参加表明画像（16:9・CLS対策で高さ固定。情報画像のため object-contain） */}
        <div className="relative w-full aspect-video rounded-lg bg-gray-100 overflow-hidden mb-3 flex items-center justify-center">
          {entry.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.imageUrl}
              alt={entry.imageAlt ?? `${entry.displayName} の参加表明画像`}
              loading="lazy"
              className="w-full h-full object-contain"
            />
          ) : (
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 12h.008M3 16.5V7.5A2.25 2.25 0 015.25 5.25h13.5A2.25 2.25 0 0121 7.5v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.5z" />
            </svg>
          )}
        </div>

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
          <AuthStatusBadge status={entry.authStatus} />
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
