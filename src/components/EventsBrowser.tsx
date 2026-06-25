'use client';

import { useMemo, useState } from 'react';
import type { Event } from '@/types';
import { EventCard } from './EventCard';

// タブの表示順（未知の地方は末尾に出現順で追加）
const REGION_ORDER = ['関東', '東海', '関西'];

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, '');
}

interface Props {
  events: Event[];
  hasImported: boolean;
  initialQ?: string;
  initialRegion?: string;
}

export function EventsBrowser({ events, hasImported, initialQ = '', initialRegion = '' }: Props) {
  const [q, setQ] = useState(initialQ);
  const [region, setRegion] = useState(initialRegion);

  // 地方タブ（件数つき・優先順）
  const regionTabs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events) if (e.region) counts.set(e.region, (counts.get(e.region) ?? 0) + 1);
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        const ia = REGION_ORDER.indexOf(a.name);
        const ib = REGION_ORDER.indexOf(b.name);
        if (ia === -1 && ib === -1) return a.name.localeCompare(b.name, 'ja');
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
  }, [events]);

  const filtered = useMemo(() => {
    const query = normalize(q);
    return events.filter((e) => {
      if (region && e.region !== region) return false;
      if (query) {
        const match =
          normalize(e.name).includes(query) ||
          normalize(e.location).includes(query) ||
          normalize(e.hashtag ?? '').includes(query) ||
          normalize(e.organizer ?? '').includes(query);
        if (!match) return false;
      }
      return true;
    });
  }, [events, q, region]);

  // 共有用に URL を更新（サーバー往復は発生させない）
  function syncUrl(nextQ: string, nextRegion: string) {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (nextQ) params.set('q', nextQ);
    if (nextRegion) params.set('region', nextRegion);
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `/events?${qs}` : '/events');
  }

  function changeQ(value: string) {
    setQ(value);
    syncUrl(value, region);
  }
  function changeRegion(value: string) {
    setRegion(value);
    syncUrl(q, value);
  }

  const hasFilter = Boolean(q || region);

  const tabClass = (selected: boolean) =>
    `px-3.5 py-1.5 rounded-full text-sm border transition-colors whitespace-nowrap ${
      selected
        ? 'bg-violet-600 text-white border-violet-600'
        : 'bg-white text-gray-600 border-gray-200 hover:border-violet-400'
    }`;

  return (
    <div>
      {/* 検索 */}
      <div className="relative mb-5 max-w-xl">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => changeQ(e.target.value)}
          placeholder="イベント名・会場・ハッシュタグで検索"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 placeholder:text-gray-400"
        />
      </div>

      {/* 地方タブ（クライアント側で即時切替） */}
      {regionTabs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button onClick={() => changeRegion('')} className={tabClass(!region)}>
            すべて<span className="ml-1 text-xs opacity-70">{events.length}</span>
          </button>
          {regionTabs.map((r) => (
            <button key={r.name} onClick={() => changeRegion(r.name)} className={tabClass(region === r.name)}>
              {r.name}
              <span className="ml-1 text-xs opacity-70">{r.count}</span>
            </button>
          ))}
        </div>
      )}

      {hasImported && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5 text-xs text-amber-800">
          <p className="font-medium mb-0.5">「外部取得」バッジのイベントについて</p>
          <p>外部サイトから自動取得した候補情報です。日程・会場・参加条件は変更される場合があります。参加前に必ず公式情報をご確認ください。</p>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">
          {hasFilter ? '条件に一致するイベントがありません' : 'イベントデータがありません'}
        </p>
      ) : (
        <>
          {hasFilter && <p className="text-xs text-gray-500 mb-3">{filtered.length} 件見つかりました</p>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
