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

export function ParticipantList({ entries, eventId }: Props) {
  const [filter, setFilter] = useState<EntryFilter>(EMPTY_FILTER);
  const [showFilter, setShowFilter] = useState(false);

  const filtered = useMemo(() => filterEntries(entries, filter), [entries, filter]);

  const hasActiveFilter =
    filter.keyword ||
    filter.participationType ||
    filter.workName ||
    filter.characterName ||
    filter.shootingStatus;

  function reset() {
    setFilter(EMPTY_FILTER);
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-900 text-base">
          参加者一覧
          <span className="ml-2 text-sm font-normal text-gray-500">
            {filtered.length}
            {hasActiveFilter ? `／${entries.length}` : ''}件
          </span>
        </h2>
        <button
          onClick={() => setShowFilter((v) => !v)}
          className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
            hasActiveFilter
              ? 'border-violet-400 text-violet-600 bg-violet-50'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          {showFilter ? '絞り込みを閉じる' : '絞り込み'}
          {hasActiveFilter && ' ●'}
        </button>
      </div>

      {/* Keyword search — always visible */}
      <div className="mb-3">
        <input
          type="search"
          value={filter.keyword}
          onChange={(e) => setFilter((f) => ({ ...f, keyword: e.target.value }))}
          placeholder="名前・作品・キャラ・コメントで検索"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
        />
      </div>

      {showFilter && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3 border border-gray-100">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">参加種別</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter((f) => ({ ...f, participationType: '' }))}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  !filter.participationType
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                すべて
              </button>
              {PARTICIPATION_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter((f) => ({ ...f, participationType: t }))}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    filter.participationType === t
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {PARTICIPATION_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              撮影・交流スタンス
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter((f) => ({ ...f, shootingStatus: '' }))}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  !filter.shootingStatus
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                すべて
              </button>
              {COSPLAY_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter((f) => ({ ...f, shootingStatus: s }))}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    filter.shootingStatus === s
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {COSPLAY_SHOOTING_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">作品名</label>
              <input
                type="text"
                value={filter.workName}
                onChange={(e) => setFilter((f) => ({ ...f, workName: e.target.value }))}
                placeholder="例：リゼロ"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">キャラ名</label>
              <input
                type="text"
                value={filter.characterName}
                onChange={(e) => setFilter((f) => ({ ...f, characterName: e.target.value }))}
                placeholder="例：レム"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
              />
            </div>
          </div>

          {hasActiveFilter && (
            <button onClick={reset} className="text-xs text-gray-500 underline">
              絞り込みをリセット
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          {hasActiveFilter ? '条件に一致する参加者がいません' : 'まだ参加表明がありません'}
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {filtered.map((entry) => (
            <EntryCard key={entry.id} entry={entry} eventId={eventId} />
          ))}
        </div>
      )}
    </section>
  );
}
