import Link from 'next/link';
import type { ParticipationEntry } from '@/types';
import { Avatar } from './Avatar';
import {
  PARTICIPATION_TYPE_LABELS,
  PARTICIPATION_TYPE_COLORS,
  PARTICIPATION_TYPE_CARD,
  PARTICIPATION_TYPE_SPINE,
  PARTICIPATION_TYPE_RING,
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

interface Props {
  entry: ParticipationEntry;
  eventId: string;
  eventName?: string;
}

/** トップページ「新着の参加表明」用のコンパクトカード。予定メモ全文などは載せず要点のみ */
export function LatestEntryCard({ entry, eventId, eventName }: Props) {
  const plans = getEntryPlans(entry);
  const targets = getEntryTargets(entry);
  const work = entry.participationType === 'cosplay' ? plans[0]?.workTitle : targets[0]?.workTitle;
  const character = entry.participationType === 'cosplay' ? plans[0]?.characterName : targets[0]?.characterName;
  const band = getTimeBand(entry);
  const greeting = getGreetingLevel(entry);
  const policy = getShootingPolicy(entry);

  // 写真：この参加表明自体の画像 → （カメラマンなら）プロフィールの作例1枚 → 無ければ他の情報で埋める
  const firstSample = entry.participationType === 'photographer' ? entry.photographerSamples?.[0] : undefined;
  const photoUrl = entry.imageUrl ?? firstSample?.url;
  const photoIsSample = !entry.imageUrl && Boolean(firstSample);

  // 温度感バッジ（挨拶歓迎度・撮影相談可否は文言が重複することがあるのでラベル単位で重複排除）
  const badgeDefs = [
    band && { label: TIME_BAND_LABELS[band], className: 'bg-white/70 text-gray-600' },
    greeting && { label: GREETING_LEVEL_LABELS[greeting], className: GREETING_LEVEL_COLORS[greeting] },
    policy && { label: SHOOTING_POLICY_LABELS[policy], className: SHOOTING_POLICY_COLORS[policy] },
  ].filter((b): b is { label: string; className: string } => Boolean(b));
  const seenLabels = new Set<string>();
  const badges = badgeDefs.filter((b) => (seenLabels.has(b.label) ? false : seenLabels.add(b.label)));
  const hasSignals = badges.length > 0 || Boolean(entry.comment);

  return (
    <Link
      href={`/events/${eventId}/entries/${entry.id}`}
      className="group block h-full"
      data-analytics="home_latest_entry_click"
      data-analytics-entry-id={entry.id}
    >
      <div className="relative h-full flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm group-hover:shadow-md transition-all">
        <span aria-hidden className={`absolute left-0 top-0 bottom-0 w-1 ${PARTICIPATION_TYPE_SPINE[entry.participationType]}`} />

        {photoUrl ? (
          <div className="relative w-full aspect-video bg-gray-100 overflow-hidden flex items-center justify-center ml-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt={entry.imageAlt ?? `${entry.displayName} の参加表明画像`}
              loading="lazy"
              className="w-full h-full object-contain"
            />
            <span
              className={`absolute top-1.5 left-0 z-10 text-[9px] font-bold py-1 pl-2 pr-3 ${PARTICIPATION_TYPE_COLORS[entry.participationType]} [clip-path:polygon(0_0,calc(100%-5px)_0,100%_50%,calc(100%-5px)_100%,0_100%)]`}
            >
              {PARTICIPATION_TYPE_LABELS[entry.participationType]}
            </span>
          </div>
        ) : hasSignals ? (
          // 画像がない代わりに、時間帯・温度感・予定メモの抜粋で同じ枠を埋める
          <div
            className={`w-full aspect-video p-2.5 ml-1 flex flex-col gap-1.5 overflow-hidden ${PARTICIPATION_TYPE_CARD[entry.participationType]} ${entry.comment ? '' : 'justify-center'}`}
          >
            <div className={`flex flex-wrap gap-1 ${entry.comment ? '' : 'justify-center'}`}>
              {badges.map((b) => (
                <span key={b.label} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${b.className}`}>
                  {b.label}
                </span>
              ))}
            </div>
            {entry.comment && (
              <p className="text-[11px] text-gray-600 leading-snug line-clamp-4">{entry.comment}</p>
            )}
          </div>
        ) : (
          <div
            className={`w-full aspect-video ml-1 flex flex-col items-center justify-center gap-1 ${PARTICIPATION_TYPE_CARD[entry.participationType]}`}
          >
            <span className="text-2xl">✨</span>
            <span className="text-xs font-bold text-gray-500">{PARTICIPATION_TYPE_LABELS[entry.participationType]}</span>
          </div>
        )}

        <div className="flex flex-col flex-1 p-2.5 pl-3.5">
          {eventName && <p className="text-[10px] font-medium text-violet-600 line-clamp-1">{eventName}</p>}
          <div className="flex items-center gap-1.5 mt-0.5">
            <Avatar
              url={entry.avatarUrl}
              name={entry.displayName}
              sizeClassName="w-4 h-4"
              ringClassName={`ring-1 ${PARTICIPATION_TYPE_RING[entry.participationType]}`}
            />
            <p className="font-bold text-gray-900 text-[12px] leading-snug truncate">{entry.displayName}</p>
          </div>
          {(work || character) && (
            <div className="mt-1">
              {work && <p className="text-[9.5px] font-bold text-violet-600 line-clamp-1">{work}</p>}
              <p className="font-display text-[13px] font-black text-gray-900 leading-tight line-clamp-1">
                {character || work}
              </p>
            </div>
          )}
          {photoIsSample && <p className="text-[9px] text-gray-400 mt-0.5">作例（プロフィール）</p>}
          {!photoUrl && (
            <span
              className={`mt-auto self-start text-[10px] px-2 py-0.5 rounded-full font-bold ${PARTICIPATION_TYPE_COLORS[entry.participationType]}`}
            >
              {PARTICIPATION_TYPE_LABELS[entry.participationType]}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
