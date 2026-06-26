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
    <Link href={`/events/${eventId}/entries/${entry.id}`} className="group block h-full">
      <div className="h-full flex flex-col overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm group-hover:shadow-md group-hover:border-violet-200 transition-all">
        {/* 参加表明画像（あるときだけ大きめに。16:9・情報画像のため object-contain） */}
        {entry.imageUrl && (
          <div className="w-full aspect-video bg-gray-100 overflow-hidden flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.imageUrl}
              alt={entry.imageAlt ?? `${entry.displayName} の参加表明画像`}
              loading="lazy"
              className="w-full h-full object-contain"
            />
          </div>
        )}

        <div className="flex flex-col flex-1 p-4">
          {eventName && (
            <p className="text-[11px] font-medium text-violet-600 mb-1.5 line-clamp-1">{eventName}</p>
          )}

          {/* 名前・X ID・種別 */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-[15px] leading-snug truncate">{entry.displayName}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <a
                  href={`https://x.com/${entry.xId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 text-xs hover:text-violet-500 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  @{entry.xId}
                </a>
                <AuthStatusBadge status={entry.authStatus} />
              </div>
            </div>
            <span
              className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-bold ${PARTICIPATION_TYPE_COLORS[entry.participationType]}`}
            >
              {PARTICIPATION_TYPE_LABELS[entry.participationType]}
            </span>
          </div>

          {/* コスプレ情報 */}
          {entry.cosplayInfo && (
            <div className="mt-3 pt-3 border-t border-gray-50 space-y-1.5">
              <div className="flex gap-2 text-sm">
                <span className="text-gray-400 text-xs w-9 shrink-0 pt-0.5">作品</span>
                <span className="text-gray-800 line-clamp-1">{entry.cosplayInfo.workName}</span>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="text-gray-400 text-xs w-9 shrink-0 pt-0.5">キャラ</span>
                <span className="text-gray-800 line-clamp-1">{entry.cosplayInfo.characterName}</span>
              </div>
              <span
                className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${COSPLAY_STATUS_COLORS[entry.cosplayInfo.shootingStatus]}`}
              >
                {COSPLAY_SHOOTING_STATUS_LABELS[entry.cosplayInfo.shootingStatus]}
              </span>
            </div>
          )}

          {/* カメラマン情報 */}
          {entry.photographerInfo && (
            <div className="mt-3 pt-3 border-t border-gray-50 space-y-1.5">
              {entry.photographerInfo.targetWorks && (
                <div className="flex gap-2 text-sm">
                  <span className="text-gray-400 text-xs w-12 shrink-0 pt-0.5">対象作品</span>
                  <span className="text-gray-800 line-clamp-1">{entry.photographerInfo.targetWorks}</span>
                </div>
              )}
              {entry.photographerInfo.availableHours && (
                <div className="flex gap-2 text-sm">
                  <span className="text-gray-400 text-xs w-12 shrink-0 pt-0.5">撮影時間</span>
                  <span className="text-gray-800 line-clamp-1">{entry.photographerInfo.availableHours}</span>
                </div>
              )}
              <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700">
                初対面 {PHOTOGRAPHER_FIRST_MEET_LABELS[entry.photographerInfo.firstMeetStatus]}
              </span>
              {entry.photographerInfo.shootingStyles.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {entry.photographerInfo.shootingStyles.map((s) => (
                    <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {PHOTOGRAPHER_SHOOTING_STYLE_LABELS[s]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {entry.comment && (
            <p className="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-3">{entry.comment}</p>
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
      </div>
    </Link>
  );
}
