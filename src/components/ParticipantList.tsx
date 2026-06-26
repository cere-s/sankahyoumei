'use client';

import { useState, useMemo } from 'react';
import type { ParticipationEntry, ParticipationType, CosplayShootingStatus, EntryFilter } from '@/types';
import { EntryCard } from './EntryCard';
import { filterEntries, PARTICIPATION_TYPE_LABELS, COSPLAY_SHOOTING_STATUS_LABELS } from '@/lib/utils';

interface Props {
  entries: ParticipationEntry[];
  eventId: string;
}

const EMPTY_FILTER: EntryFilter = {
  keyword: '',
  participationType: '',
  workName: '',
  characterName: '',
  shootingStatus: '',
};

const PARTICIPATION_TYPES: ParticipationType[] = ['cosplay', 'photographer', 'general', 'undecided'];
const COSPLAY_STATUSES: CosplayShootingStatus[] = [
  'greeting_welcome',
  'mutual_ok',
  'acquaintance_only',
  'after_meeting_ok',
  'planned',
  'no_shooting',
];

const pillClass = (selected: boolean) =>
  `text-xs px-3 py-1.5 rounded-full border font-medium whitespace-nowrap transition-colors ${
    selected
      ? 'bg-violet-600 text-white border-violet-600'
      : 'bg-white text-gray-600 border-gray-200 hover:border-violet-400'
  }`;

export function ParticipantList({ entries, eventId }: Props) {
  const [filter, setFilter] = useState<EntryFilter>(EMPTY_FILTER);

  const filtered = useMemo(() => filterEntries(entries, filter), [entries, filter]);

  const hasActiveFilter = Boolean(filter.keyword || filter.participationType || filter.shootingStatus);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-900 text-lg">
          参加者一覧
          <span className="ml-2 text-sm font-normal text-gray-500">
            {filtered.length}
            {hasActiveFilter ? `／${entries.length}` : ''}件
          </span>
        </h2>
        {hasActiveFilter && (
          <button onClick={() => setFilter(EMPTY_FILTER)} className="text-xs text-gray-500 hover:text-violet-600 hover:underline">
            条件をリセット
          </button>
        )}
      </div>

      {/* 検索 */}
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="search"
          value={filter.keyword}
          onChange={(e) => setFilter((f) => ({ ...f, keyword: e.target.value }))}
          placeholder="作品・キャラ・名前で検索"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 placeholder:text-gray-400"
        />
      </div>

      {/* 種別ピル */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-2 -mx-1 px-1">
        <button onClick={() => setFilter((f) => ({ ...f, participationType: '' }))} className={pillClass(!filter.participationType)}>
          すべて
        </button>
        {PARTICIPATION_TYPES.map((t) => (
          <button key={t} onClick={() => setFilter((f) => ({ ...f, participationType: t }))} className={pillClass(filter.participationType === t)}>
            {PARTICIPATION_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* スタンスピル */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
        <button onClick={() => setFilter((f) => ({ ...f, shootingStatus: '' }))} className={pillClass(!filter.shootingStatus)}>
          スタンス：すべて
        </button>
        {COSPLAY_STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter((f) => ({ ...f, shootingStatus: s }))} className={pillClass(filter.shootingStatus === s)}>
            {COSPLAY_SHOOTING_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
          {hasActiveFilter ? '条件に一致する参加者がいません' : 'まだ参加表明がありません'}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((entry) => (
            <EntryCard key={entry.id} entry={entry} eventId={eventId} />
          ))}
        </div>
      )}
    </section>
  );
}
