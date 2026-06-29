'use client';

import { useState, useMemo } from 'react';
import type { ParticipationEntry } from '@/types';
import { EntryCard } from './EntryCard';
import {
  getEntryPlans,
  computeEventStats,
  computePopularTags,
  isShootingConsultOk,
  isGreetingWelcome,
} from '@/lib/utils';

interface Props {
  entries: ParticipationEntry[];
  eventId: string;
}

type Quick = 'all' | 'cosplay' | 'photographer' | 'shooting_ok' | 'greeting';
type ActiveTag = { type: 'work' | 'char'; value: string } | null;

const QUICKS: { key: Quick; label: string }[] = [
  { key: 'all', label: '全員' },
  { key: 'cosplay', label: 'コスプレ' },
  { key: 'photographer', label: 'カメラマン' },
  { key: 'shooting_ok', label: '撮影相談OK' },
  { key: 'greeting', label: '挨拶歓迎' },
];

const MAX_TAGS = 12;

function StatCell({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-xl font-bold leading-none ${color}`}>{value}</div>
      <div className="text-[11px] text-gray-500 mt-1 leading-tight">{label}</div>
    </div>
  );
}

export function ParticipantList({ entries, eventId }: Props) {
  const [quick, setQuick] = useState<Quick>('all');
  const [keyword, setKeyword] = useState('');
  const [activeTag, setActiveTag] = useState<ActiveTag>(null);

  const stats = useMemo(() => computeEventStats(entries), [entries]);
  const tags = useMemo(() => computePopularTags(entries), [entries]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return entries.filter((e) => {
      const plans = getEntryPlans(e);
      if (kw) {
        const hay = [
          e.displayName,
          e.xId,
          e.comment,
          e.photographerInfo?.targetWorks ?? '',
          ...plans.map((p) => p.workTitle),
          ...plans.map((p) => p.characterName),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      if (quick === 'cosplay' && e.participationType !== 'cosplay') return false;
      if (quick === 'photographer' && e.participationType !== 'photographer') return false;
      if (quick === 'shooting_ok' && !isShootingConsultOk(e)) return false;
      if (quick === 'greeting' && !isGreetingWelcome(e)) return false;
      if (activeTag?.type === 'work' && !plans.some((p) => p.workTitle.trim() === activeTag.value)) return false;
      if (activeTag?.type === 'char' && !plans.some((p) => p.characterName.trim() === activeTag.value)) return false;
      return true;
    });
  }, [entries, keyword, quick, activeTag]);

  const hasActiveFilter = Boolean(keyword.trim() || quick !== 'all' || activeTag);
  const reset = () => {
    setQuick('all');
    setKeyword('');
    setActiveTag(null);
  };
  const toggleTag = (type: 'work' | 'char', value: string) =>
    setActiveTag((cur) => (cur && cur.type === type && cur.value === value ? null : { type, value }));

  return (
    <section>
      {/* コンセプトコピー */}
      <h2 className="text-lg font-bold text-gray-900 leading-snug">イベント前に、会える人と撮れるものを見つけよう</h2>
      <p className="text-sm text-gray-500 mt-1 mb-3">作品・キャラ・撮影予定から、同じ好きの人を探せます。</p>

      {/* サマリーカード */}
      <div className="rounded-2xl border border-pink-100 bg-white shadow-sm p-4 mb-4">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-y-3 gap-x-2">
          <StatCell value={stats.total} label="参加表明" color="text-gray-900" />
          <StatCell value={stats.cosplay} label="コスプレ" color="text-pink-600" />
          <StatCell value={stats.photographer} label="カメラマン" color="text-blue-600" />
          <StatCell value={stats.shootingOk} label="撮影相談OK" color="text-violet-600" />
          <StatCell value={stats.greeting} label="挨拶歓迎" color="text-emerald-600" />
        </div>
      </div>

      {/* 同じ好きを探す */}
      {(tags.works.length > 0 || tags.characters.length > 0) && (
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-2">同じ好きを探す</h3>
          {tags.works.length > 0 && (
            <div className="mb-2">
              <p className="text-[11px] text-gray-400 mb-1">作品</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.works.slice(0, MAX_TAGS).map((t) => {
                  const on = activeTag?.type === 'work' && activeTag.value === t.name;
                  return (
                    <button
                      key={t.name}
                      onClick={() => toggleTag('work', t.name)}
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                        on ? 'bg-pink-500 text-white border-pink-500' : 'bg-pink-50 text-pink-700 border-pink-100 hover:border-pink-300'
                      }`}
                    >
                      {t.name} <span className={on ? 'text-white/80' : 'text-pink-400'}>{t.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {tags.characters.length > 0 && (
            <div>
              <p className="text-[11px] text-gray-400 mb-1">キャラ</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.characters.slice(0, MAX_TAGS).map((t) => {
                  const on = activeTag?.type === 'char' && activeTag.value === t.name;
                  return (
                    <button
                      key={t.name}
                      onClick={() => toggleTag('char', t.name)}
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                        on ? 'bg-violet-500 text-white border-violet-500' : 'bg-violet-50 text-violet-700 border-violet-100 hover:border-violet-300'
                      }`}
                    >
                      {t.name} <span className={on ? 'text-white/80' : 'text-violet-400'}>{t.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* フィルター */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-3 -mx-1 px-1">
        {QUICKS.map((q) => (
          <button
            key={q.key}
            onClick={() => setQuick(q.key)}
            className={`text-xs px-3.5 py-1.5 rounded-full border font-bold whitespace-nowrap transition-colors ${
              quick === q.key
                ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white border-transparent'
                : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* 検索 */}
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="作品・キャラ・名前で検索"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 placeholder:text-gray-400"
        />
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">
          <span className="font-bold text-gray-800">{filtered.length}</span>
          {hasActiveFilter ? `／${entries.length}` : ''}人
        </p>
        {hasActiveFilter && (
          <button onClick={reset} className="text-xs text-gray-500 hover:text-pink-600 hover:underline">
            条件をリセット
          </button>
        )}
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
