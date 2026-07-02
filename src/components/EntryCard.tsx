'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ParticipationEntry, InteractionType, PhotographerSample } from '@/types';
import { AuthStatusBadge } from './AuthStatus';
import { InteractionButtons } from './InteractionButtons';
import { Avatar } from './Avatar';
import { safeHttpUrl } from '@/lib/validation';
import {
  PARTICIPATION_TYPE_LABELS,
  PARTICIPATION_TYPE_COLORS,
  PARTICIPATION_TYPE_SPINE,
  PARTICIPATION_TYPE_BORDER,
  PARTICIPATION_TYPE_RING,
  PHOTOGRAPHER_SHOOTING_STYLE_LABELS,
  TIME_BAND_LABELS,
  GREETING_LEVEL_LABELS,
  GREETING_LEVEL_COLORS,
  SHOOTING_POLICY_LABELS,
  SHOOTING_POLICY_COLORS,
  getEntryPlans,
  getEntryTargets,
  getGreetingLevel,
  getShootingPolicy,
  getTimeBand,
} from '@/lib/utils';

/** 意思表示ボタン用の閲覧者コンテキスト（カードごと） */
export interface EntryInteraction {
  viewerUserId: string | null;
  selected: InteractionType[];
  counts: Partial<Record<InteractionType, number>>;
  restricted: boolean;
}

interface Props {
  entry: ParticipationEntry;
  eventId: string;
  eventName?: string;
  /** 渡された場合のみ意思表示ボタンを表示する */
  interaction?: EntryInteraction;
}

/** 4隅のビューファインダー風フレーム。ホバー/フォーカスで寄って緑にフォーカスする */
function ViewfinderCorners({ light, size = 'md' }: { light?: boolean; size?: 'md' | 'sm' }) {
  const box = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  const base = light ? 'border-white/90' : 'border-gray-900/30';
  const positions =
    size === 'sm'
      ? [
          'top-1 left-1 border-t-2 border-l-2 group-hover/thumb:top-0.5 group-hover/thumb:left-0.5',
          'bottom-1 right-1 border-b-2 border-r-2 group-hover/thumb:bottom-0.5 group-hover/thumb:right-0.5',
        ]
      : [
          'top-1.5 left-1.5 border-t-2 border-l-2 group-hover:top-1 group-hover:left-1',
          'top-1.5 right-1.5 border-t-2 border-r-2 group-hover:top-1 group-hover:right-1',
          'bottom-1.5 left-1.5 border-b-2 border-l-2 group-hover:bottom-1 group-hover:left-1',
          'bottom-1.5 right-1.5 border-b-2 border-r-2 group-hover:bottom-1 group-hover:right-1',
        ];
  const focusRing = size === 'sm' ? 'group-hover/thumb:border-emerald-400' : 'group-hover:border-emerald-400';
  return (
    <>
      {positions.map((pos) => (
        <span
          key={pos}
          aria-hidden
          className={`pointer-events-none absolute motion-safe:transition-all ${box} ${base} ${pos} ${focusRing}`}
        />
      ))}
    </>
  );
}

/** 種別タグ（旗のような形の切り欠き。画像がある時は左上に載せ、無い時はカード右上に置く） */
function TypeTag({ type, onPhoto }: { type: ParticipationEntry['participationType']; onPhoto?: boolean }) {
  return (
    <span
      className={`absolute top-2 z-10 text-[10px] font-bold py-1 ${PARTICIPATION_TYPE_COLORS[type]} ${
        onPhoto
          ? 'left-0 pl-2.5 pr-3.5 [clip-path:polygon(0_0,calc(100%-6px)_0,100%_50%,calc(100%-6px)_100%,0_100%)]'
          : 'right-3 pl-3.5 pr-2.5 [clip-path:polygon(6px_0,100%_0,100%_100%,6px_100%,0_50%)]'
      }`}
    >
      {PARTICIPATION_TYPE_LABELS[type]}
    </span>
  );
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function SampleLightbox({ sample }: { sample: PhotographerSample }) {
  return (
    <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 p-2">
      <div className="relative aspect-video overflow-hidden rounded-md bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sample.url} alt="" className="h-full w-full object-contain" />
      </div>
      {sample.subjectXId && (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-500">
          被写体：
          <a
            href={`https://x.com/${sample.subjectXId}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="font-bold text-gray-700 hover:text-violet-600 hover:underline"
          >
            @{sample.subjectXId}
          </a>
        </p>
      )}
    </div>
  );
}

export function EntryCard({ entry, eventId, eventName, interaction }: Props) {
  const [openSampleIndex, setOpenSampleIndex] = useState<number | null>(null);
  const plans = getEntryPlans(entry);
  const targets = getEntryTargets(entry);
  const greeting = getGreetingLevel(entry);
  const policy = getShootingPolicy(entry);
  const band = getTimeBand(entry);
  const samples = entry.photographerSamples ?? [];
  const portfolioUrl = safeHttpUrl(entry.photographerInfo?.portfolioUrl);

  return (
    <Link
      href={`/events/${eventId}/entries/${entry.id}`}
      className="group block h-full"
      data-analytics="entry_card_clicked"
      data-analytics-entry-id={entry.id}
    >
      <div
        className={`relative h-full flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm group-hover:shadow-md motion-safe:transition-all ${PARTICIPATION_TYPE_BORDER[entry.participationType]}`}
      >
        <span aria-hidden className={`absolute left-0 top-0 bottom-0 w-1 ${PARTICIPATION_TYPE_SPINE[entry.participationType]}`} />
        {!entry.imageUrl && <TypeTag type={entry.participationType} />}

        <div className="flex flex-col flex-1 pl-5 pr-4 py-4">
          {eventName && (
            <p className="text-[11px] font-medium text-violet-600 mb-1.5 line-clamp-1">{eventName}</p>
          )}

          {/* 参加表明自体の画像（あれば主役として大きく。ビューファインダー枠で囲む） */}
          {entry.imageUrl && (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 mb-3">
              <TypeTag type={entry.participationType} onPhoto />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.imageUrl}
                alt={entry.imageAlt ?? `${entry.displayName} の参加表明画像`}
                loading="lazy"
                className="w-full h-full object-contain"
              />
              <ViewfinderCorners light />
            </div>
          )}

          {/* 名前・X ID */}
          <div className="flex items-center gap-2">
            <Avatar url={entry.avatarUrl} name={entry.displayName} ringClassName={PARTICIPATION_TYPE_RING[entry.participationType]} />
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-[14px] leading-snug truncate">{entry.displayName}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <a
                  href={`https://x.com/${entry.xId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 text-xs hover:text-violet-500 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                  data-analytics="x_profile_clicked"
                  data-analytics-entry-id={entry.id}
                >
                  @{entry.xId}
                </a>
                <AuthStatusBadge status={entry.authStatus} />
              </div>
            </div>
          </div>

          {/* コスプレ情報（当日の予定キャラ：複数可。キャラ名を最大の見出しにする） */}
          {entry.participationType === 'cosplay' && plans.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-50">
              {plans.length === 1 ? (
                <div>
                  <p className="text-[11px] font-bold text-violet-600 line-clamp-1">{plans[0].workTitle}</p>
                  <p className="font-display text-xl font-black text-gray-900 leading-tight line-clamp-1">
                    {plans[0].characterName}
                  </p>
                  {(plans[0].timeSlot || plans[0].costumeLabel) && (
                    <p className="mt-0.5 font-mono-data text-[11px] text-gray-400">
                      {[plans[0].timeSlot, plans[0].costumeLabel].filter(Boolean).join(' ・ ')}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold text-gray-500 mb-1.5">当日の予定（{plans.length}キャラ）</p>
                  <ol className="space-y-1.5">
                    {plans.map((p, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="shrink-0 font-mono-data text-[10px] text-gray-400 pt-1 w-4">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="min-w-0">
                          <span className="font-display block font-bold text-gray-900 truncate">{p.characterName}</span>
                          <span className="block text-xs text-gray-400 truncate">
                            {p.workTitle}
                            {(p.timeSlot || p.costumeLabel)
                              ? ` ・ ${[p.timeSlot, p.costumeLabel].filter(Boolean).join('｜')}`
                              : ''}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          )}

          {/* カメラマン情報：作例（プロフィール共通）を主役にする */}
          {entry.participationType === 'photographer' && (
            <div className="mt-3 pt-3 border-t border-gray-50">
              {samples.length > 0 ? (
                <>
                  <p className="text-[10px] text-gray-400 mb-1">いつもの作例</p>
                  <div className="flex gap-1">
                    {samples.map((s, i) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenSampleIndex((cur) => (cur === i ? null : i));
                        }}
                        className="group/thumb relative flex-1 aspect-square overflow-hidden rounded-md bg-gray-100"
                        aria-label="作例を拡大表示"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                        <ViewfinderCorners light size="sm" />
                      </button>
                    ))}
                  </div>
                  {openSampleIndex !== null && samples[openSampleIndex] && (
                    <SampleLightbox sample={samples[openSampleIndex]} />
                  )}
                </>
              ) : portfolioUrl ? (
                <a
                  href={portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  data-analytics="portfolio_clicked"
                  data-analytics-entry-id={entry.id}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 px-3 py-2 text-xs hover:border-violet-300 hover:bg-violet-50/40 transition-colors"
                >
                  <span className="text-violet-500 shrink-0">↗</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-gray-700 truncate">作例・ポートフォリオを見る</span>
                    <span className="block text-gray-400 truncate">{hostnameOf(portfolioUrl)}</span>
                  </span>
                </a>
              ) : null}

              {entry.photographerInfo && entry.photographerInfo.shootingStyles.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {entry.photographerInfo.shootingStyles.map((s) => (
                    <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {PHOTOGRAPHER_SHOOTING_STYLE_LABELS[s]}
                    </span>
                  ))}
                </div>
              )}

              {targets.length > 0 && (
                <p className="mt-2 text-xs text-gray-500 line-clamp-1">
                  <span className="font-bold text-gray-600">撮りたい：</span>
                  {targets.map((t) => [t.workTitle, t.characterName].filter(Boolean).join('/')).join('、')}
                </p>
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

          {/* 軽い交流：撮りたい / 撮られたい / 交流したい */}
          {interaction && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <InteractionButtons
                toEntryId={entry.id}
                toUserId={entry.userId}
                targetType={entry.participationType}
                viewerUserId={interaction.viewerUserId}
                initialSelected={interaction.selected}
                counts={interaction.counts}
                restricted={interaction.restricted}
                insideLink
              />
            </div>
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
