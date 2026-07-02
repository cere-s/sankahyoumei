'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import type { InteractionType, ParticipationType } from '@/types';
import { INTERACTION_LABELS, INTERACTION_DONE_LABELS, availableInteractionTypes } from '@/lib/utils';
import { XLoginButton } from './auth/XLoginButton';

interface Props {
  toEntryId: string;
  /** 対象参加表明の所有者（Xログインユーザー）。無い場合は意思表示できない */
  toUserId?: string;
  /** 閲覧者のユーザーID（未ログインなら null） */
  viewerUserId: string | null;
  /** 対象の参加種別（カメラマンに「撮りたい」、コスプレに「撮られたい」は出さない） */
  targetType?: ParticipationType;
  /** 閲覧者が送信済みの種別 */
  initialSelected?: InteractionType[];
  /** 参加表明ごとの受信数（人数のみ・控えめに表示） */
  counts?: Partial<Record<InteractionType, number>>;
  /** この相手とブロック関係にある */
  restricted?: boolean;
  className?: string;
}

/** 種別ごとのアクセントカラー・アイコン塗り色 */
const TYPE_ACCENT: Record<InteractionType, { border: string; bg: string; text: string; dot: string }> = {
  want_to_shoot: { border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-600' },
  want_to_be_shot: { border: 'border-pink-400', bg: 'bg-pink-50', text: 'text-pink-600', dot: 'bg-pink-600' },
  want_to_meet: { border: 'border-violet-400', bg: 'bg-violet-50', text: 'text-violet-600', dot: 'bg-violet-600' },
};

/** 意思表示の種類ごとの簡易アイコン（カメラ／ポートレート／2人） */
function InteractionIcon({ type, className }: { type: InteractionType; className?: string }) {
  const common = {
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  if (type === 'want_to_shoot') {
    return (
      <svg className={className} {...common} aria-hidden="true">
        <rect x="2.5" y="6.5" width="15" height="9.5" rx="2" />
        <path d="M7.2 6.5l1.1-1.8h3.4l1.1 1.8" />
        <circle cx="10" cy="11.2" r="2.8" />
      </svg>
    );
  }
  if (type === 'want_to_be_shot') {
    return (
      <svg className={className} {...common} aria-hidden="true">
        <rect x="3" y="3" width="14" height="14" rx="3" />
        <circle cx="10" cy="8.6" r="2.1" />
        <path d="M5.8 14.8c.9-2.1 2.6-3.2 4.2-3.2s3.3 1.1 4.2 3.2" />
      </svg>
    );
  }
  return (
    <svg className={className} {...common} aria-hidden="true">
      <circle cx="6.6" cy="7.2" r="2.1" />
      <circle cx="13.4" cy="7.2" r="2.1" />
      <path d="M2.8 15.6c.6-2.4 2.1-3.7 3.8-3.7s3.2 1.3 3.8 3.7" />
      <path d="M9.6 15.6c.6-2.4 2.1-3.7 3.8-3.7s3.2 1.3 3.8 3.7" />
    </svg>
  );
}

export function InteractionButtons({
  toEntryId,
  toUserId,
  viewerUserId,
  targetType,
  initialSelected = [],
  counts = {},
  restricted = false,
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

  // 自分の参加表明
  if (isOwn) {
    return (
      <p className={`text-[11px] text-gray-400 ${className}`}>
        自分の参加表明には追加できません
      </p>
    );
  }

  // ブロック関係
  if (restricted) {
    return (
      <p className={`text-[11px] text-gray-400 ${className}`}>
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

  function handleClick(type: InteractionType) {
    if (!viewerUserId) {
      setShowLogin(true);
      return;
    }
    void toggle(type);
  }

  const availableTypes = availableInteractionTypes(targetType);
  const gridColsClass =
    availableTypes.length >= 3 ? 'grid-cols-3' : availableTypes.length === 2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <div className={className}>
      <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-2.5">
        <p className="text-[11px] font-bold text-gray-500 mb-1.5 flex items-center gap-1">
          <svg className="w-3 h-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M2.94 2.94a1 1 0 011.06-.23l13 5a1 1 0 010 1.86l-13 5A1 1 0 013 13.6L4.5 10 3 6.4a1 1 0 01-.06-3.46zM5.8 10.8L5 12.8 14.2 9 5 5.2 5.8 7.2 9 8a.5.5 0 010 1l-3.2.8z" />
          </svg>
          参加者に伝える
        </p>
        <div className={`grid ${gridColsClass} gap-1.5`}>
          {availableTypes.map((type) => {
            const on = selected.has(type);
            const busy = pending.has(type);
            const count = localCounts[type] ?? 0;
            const accent = TYPE_ACCENT[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleClick(type)}
                disabled={busy}
                aria-pressed={on}
                aria-label={on ? INTERACTION_DONE_LABELS[type] : INTERACTION_LABELS[type]}
                className={`relative flex flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2.5 motion-safe:transition-colors disabled:opacity-60 ${
                  on ? `${accent.border} ${accent.bg}` : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* 受信数は0のとき出さない（新着カードが「0 0」で寂しく見えるのを防ぐ）。押した状態は枠色＋バッジ色で示す */}
                {count > 0 && (
                  <span
                    className={`absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono-data text-[10px] font-bold leading-none ${
                      on ? `${accent.dot} text-white` : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {count}
                  </span>
                )}
                <InteractionIcon type={type} className={`w-4 h-4 ${on ? accent.text : 'text-gray-400'}`} />
                <span className={`text-[11px] font-bold leading-none ${on ? accent.text : 'text-gray-600'}`}>
                  {INTERACTION_LABELS[type]}
                </span>
              </button>
            );
          })}
        </div>

        {showLogin && !viewerUserId && (
          <div className="mt-2 rounded-lg bg-white border border-gray-100 p-3 text-center space-y-2">
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
    </div>
  );
}
