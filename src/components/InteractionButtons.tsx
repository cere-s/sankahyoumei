'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import type { InteractionType } from '@/types';
import { INTERACTION_LABELS, INTERACTION_DONE_LABELS, INTERACTION_TYPES } from '@/lib/utils';
import { XLoginButton } from './auth/XLoginButton';

interface Props {
  toEntryId: string;
  /** 対象参加表明の所有者（Xログインユーザー）。無い場合は意思表示できない */
  toUserId?: string;
  /** 閲覧者のユーザーID（未ログインなら null） */
  viewerUserId: string | null;
  /** 閲覧者が送信済みの種別 */
  initialSelected?: InteractionType[];
  /** 参加表明ごとの受信数（人数のみ・控えめに表示） */
  counts?: Partial<Record<InteractionType, number>>;
  /** この相手とブロック関係にある */
  restricted?: boolean;
  /** カード（Link）内に置くときはクリックの伝播・遷移を止める */
  insideLink?: boolean;
  className?: string;
}

/** 種別ごとの選択時カラー */
const ON_STYLE: Record<InteractionType, string> = {
  want_to_shoot: 'bg-blue-600 text-white border-blue-600',
  want_to_be_shot: 'bg-pink-600 text-white border-pink-600',
  want_to_meet: 'bg-violet-600 text-white border-violet-600',
};

export function InteractionButtons({
  toEntryId,
  toUserId,
  viewerUserId,
  initialSelected = [],
  counts = {},
  restricted = false,
  insideLink = false,
  className = '',
}: Props) {
  const pathname = usePathname();
  const [selected, setSelected] = useState<Set<InteractionType>>(new Set(initialSelected));
  const [localCounts, setLocalCounts] = useState<Partial<Record<InteractionType, number>>>({ ...counts });
  const [pending, setPending] = useState<Set<InteractionType>>(new Set());
  const [showLogin, setShowLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 所有者不明の参加表明（旧データ等）には意思表示できない
  if (!toUserId) return null;

  const isOwn = Boolean(viewerUserId && viewerUserId === toUserId);

  function stop(e: React.MouseEvent) {
    if (insideLink) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  // 自分の参加表明
  if (isOwn) {
    return (
      <p className={`text-[11px] text-gray-400 ${className}`} onClick={stop}>
        自分の参加表明には追加できません
      </p>
    );
  }

  // ブロック関係
  if (restricted) {
    return (
      <p className={`text-[11px] text-gray-400 ${className}`} onClick={stop}>
        このユーザーとの交流は制限されています
      </p>
    );
  }

  async function toggle(type: InteractionType) {
    if (pending.has(type)) return;
    setError(null);

    const wasOn = selected.has(type);
    // 楽観的更新
    setSelected((prev) => {
      const next = new Set(prev);
      if (wasOn) next.delete(type);
      else next.add(type);
      return next;
    });
    setLocalCounts((prev) => ({
      ...prev,
      [type]: Math.max(0, (prev[type] ?? 0) + (wasOn ? -1 : 1)),
    }));
    setPending((prev) => new Set(prev).add(type));

    try {
      const res = await fetch('/api/interactions/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEntryId, intentType: type }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        // 失敗：元に戻す
        setSelected((prev) => {
          const next = new Set(prev);
          if (wasOn) next.add(type);
          else next.delete(type);
          return next;
        });
        setLocalCounts((prev) => ({
          ...prev,
          [type]: Math.max(0, (prev[type] ?? 0) + (wasOn ? 1 : -1)),
        }));
        setError(json.error ?? '処理に失敗しました');
      } else {
        // サーバーの確定状態に合わせる
        setSelected((prev) => {
          const next = new Set(prev);
          if (json.active) next.add(type);
          else next.delete(type);
          return next;
        });
      }
    } catch {
      setSelected((prev) => {
        const next = new Set(prev);
        if (wasOn) next.add(type);
        else next.delete(type);
        return next;
      });
      setLocalCounts((prev) => ({
        ...prev,
        [type]: Math.max(0, (prev[type] ?? 0) + (wasOn ? 1 : -1)),
      }));
      setError('通信に失敗しました');
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(type);
        return next;
      });
    }
  }

  function handleClick(e: React.MouseEvent, type: InteractionType) {
    stop(e);
    if (!viewerUserId) {
      setShowLogin(true);
      return;
    }
    void toggle(type);
  }

  return (
    <div className={className} onClick={stop}>
      <div className="flex flex-wrap gap-1.5">
        {INTERACTION_TYPES.map((type) => {
          const on = selected.has(type);
          const busy = pending.has(type);
          const count = localCounts[type] ?? 0;
          return (
            <button
              key={type}
              type="button"
              onClick={(e) => handleClick(e, type)}
              disabled={busy}
              aria-pressed={on}
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border font-bold transition-colors disabled:opacity-60 ${
                on ? ON_STYLE[type] : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {on && (
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4l2.3 2.3 6.3-6.3a1 1 0 011.4 0z" clipRule="evenodd" />
                </svg>
              )}
              {on ? INTERACTION_DONE_LABELS[type] : INTERACTION_LABELS[type]}
              {count > 0 && (
                <span className={`text-[10px] font-normal ${on ? 'text-white/70' : 'text-gray-400'}`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {showLogin && !viewerUserId && (
        <div className="mt-2 rounded-lg bg-gray-50 border border-gray-100 p-3 text-center space-y-2">
          <p className="text-xs text-gray-600">交流機能を使うにはログインが必要です</p>
          <div className="flex justify-center">
            <XLoginButton
              next={pathname}
              label="Xでログイン"
              className="inline-flex items-center justify-center gap-2 bg-black text-white rounded-lg px-4 py-2 text-xs font-bold hover:bg-gray-800 transition-colors"
            />
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
