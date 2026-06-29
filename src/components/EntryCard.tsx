'use client';

import Link from 'next/link';
import type { ParticipationEntry } from '@/types';
import { AuthStatusBadge } from './AuthStatus';
import {
  PARTICIPATION_TYPE_LABELS,
  PARTICIPATION_TYPE_COLORS,
  PARTICIPATION_TYPE_CARD,
  PHOTOGRAPHER_SHOOTING_STYLE_LABELS,
  TIME_BAND_LABELS,
  GREETING_LEVEL_LABELS,
  SHOOTING_POLICY_LABELS,
  GREETING_LEVEL_COLORS,
  SHOOTING_POLICY_COLORS,
  getEntryPlans,
  getEntryTargets,
  getGreetingLevel,
  getShootingPolicy,
  getTimeBand,
} from '@/lib/utils';

interface Props {
  entry: ParticipationEntry;
  eventId: string;
  eventName?: string;
}

export function EntryCard({ entry, eventId, eventName }: Props) {
  const plans = getEntryPlans(entry);
  const targets = getEntryTargets(entry);
  const greeting = getGreetingLevel(entry);
  const policy = getShootingPolicy(entry);
  const band = getTimeBand(entry);
  return (
    <Link href={`/events/${eventId}/entries/${entry.id}`} className="group block h-full">
      <div className={`h-full flex flex-col overflow-hidden rounded-2xl border shadow-sm group-hover:shadow-md transition-all ${PARTICIPATION_TYPE_CARD[entry.participationType]}`}>
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

          {/* コスプレ情報（当日の予定キャラ：複数可） */}
          {entry.participationType === 'cosplay' && plans.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-50 space-y-1.5">
              {plans.length === 1 ? (
                <>
                  <div className="flex gap-2 text-sm">
                    <span className="text-gray-400 text-xs w-9 shrink-0 pt-0.5">作品</span>
                    <span className="text-gray-800 line-clamp-1">{plans[0].workTitle}</span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span className="text-gray-400 text-xs w-9 shrink-0 pt-0.5">キャラ</span>
                    <span className="text-gray-800 line-clamp-1">{plans[0].characterName}</span>
                  </div>
                  {(plans[0].timeSlot || plans[0].costumeLabel) && (
                    <p className="text-xs text-gray-400 pl-11">
                      {[plans[0].timeSlot, plans[0].costumeLabel].filter(Boolean).join('｜')}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-gray-500">当日の予定（{plans.length}キャラ）</p>
                  <ol className="space-y-1.5">
                    {plans.map((p, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-pink-100 text-pink-700 text-[11px] font-bold">
                          {i + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="text-gray-800 line-clamp-1">{p.workTitle} / {p.characterName}</span>
                          {(p.timeSlot || p.costumeLabel) && (
                            <span className="block text-xs text-gray-400">
                              {[p.timeSlot, p.costumeLabel].filter(Boolean).join('｜')}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          )}

          {/* カメラマン情報（撮りたい作品・キャラ：複数可） */}
          {entry.participationType === 'photographer' && targets.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-50 space-y-1.5">
              {targets.length === 1 ? (
                <div className="flex gap-2 text-sm">
                  <span className="text-gray-400 text-xs w-14 shrink-0 pt-0.5">撮りたい</span>
                  <span className="text-gray-800 line-clamp-1">
                    {targets[0].workTitle}{targets[0].characterName ? ` / ${targets[0].characterName}` : ''}
                  </span>
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold text-gray-500">撮りたい作品（{targets.length}）</p>
                  <ol className="space-y-1.5">
                    {targets.map((t, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold">{i + 1}</span>
                        <span className="text-gray-800 line-clamp-1">{t.workTitle}{t.characterName ? ` / ${t.characterName}` : ''}</span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
              {entry.photographerInfo && entry.photographerInfo.shootingStyles.length > 0 && (
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

          {/* 一般・未定 */}
          {(entry.participationType === 'general' || entry.participationType === 'undecided') &&
            (entry.likedWorks || entry.wantWorks) && (
              <div className="mt-3 pt-3 border-t border-gray-50 space-y-1 text-sm">
                {entry.likedWorks && (
                  <div className="flex gap-2"><span className="text-gray-400 text-xs w-14 shrink-0 pt-0.5">好きな作品</span><span className="text-gray-800 line-clamp-1">{entry.likedWorks}</span></div>
                )}
                {entry.wantWorks && (
                  <div className="flex gap-2"><span className="text-gray-400 text-xs w-14 shrink-0 pt-0.5">会いたい</span><span className="text-gray-800 line-clamp-1">{entry.wantWorks}</span></div>
                )}
              </div>
            )}

          {/* 見つけてもらうシグナル（時間帯・挨拶・撮影相談） */}
          {(band || greeting || policy) && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {band && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{TIME_BAND_LABELS[band]}</span>}
              {greeting && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GREETING_LEVEL_COLORS[greeting]}`}>{GREETING_LEVEL_LABELS[greeting]}</span>}
              {policy && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SHOOTING_POLICY_COLORS[policy]}`}>{SHOOTING_POLICY_LABELS[policy]}</span>}
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
