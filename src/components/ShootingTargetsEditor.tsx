'use client';

import type { CosplaySuggestions } from '@/lib/entries';

export interface TargetDraft {
  workTitle: string;
  characterName: string;
  timeSlot: string;
  memo: string;
}

export function emptyTarget(): TargetDraft {
  return { workTitle: '', characterName: '', timeSlot: '', memo: '' };
}

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none';
const smallInputClass =
  'w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none';

interface Props {
  targets: TargetDraft[];
  onChange: (targets: TargetDraft[]) => void;
  suggestions: CosplaySuggestions;
  showErrors?: boolean;
}

export function ShootingTargetsEditor({ targets, onChange, suggestions, showErrors }: Props) {
  const update = (i: number, patch: Partial<TargetDraft>) =>
    onChange(targets.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  const add = () => onChange([...targets, emptyTarget()]);
  const remove = (i: number) => onChange(targets.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= targets.length) return;
    const next = [...targets];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-700">撮りたい作品・キャラ</p>
        <span className="text-[11px] text-gray-400">複数OK</span>
      </div>

      {targets.map((t, i) => {
        const workMissing = showErrors && !t.workTitle.trim();
        return (
          <div key={i} className="rounded-xl border border-blue-100 bg-white p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                {i + 1}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="上へ"
                  className="w-7 h-7 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === targets.length - 1} aria-label="下へ"
                  className="w-7 h-7 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent">↓</button>
                {targets.length > 1 && (
                  <button type="button" onClick={() => remove(i)} aria-label="この行を削除"
                    className="w-7 h-7 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500">✕</button>
                )}
              </div>
            </div>

            <div>
              <input type="text" value={t.workTitle} onChange={(e) => update(i, { workTitle: e.target.value })}
                list="work-suggestions" autoComplete="off" maxLength={100}
                placeholder="作品名（必須）例：原神"
                className={`${inputClass} ${workMissing ? 'border-red-300' : ''}`} />
              {workMissing && <p className="text-xs text-red-500 mt-1">作品名を入力してください</p>}
            </div>

            <input type="text" value={t.characterName} onChange={(e) => update(i, { characterName: e.target.value })}
              list="character-suggestions-all" autoComplete="off" maxLength={100}
              placeholder="キャラ名（任意）" className={inputClass} />

            <div className="grid grid-cols-1 gap-2">
              <input type="text" value={t.timeSlot} onChange={(e) => update(i, { timeSlot: e.target.value })}
                maxLength={40} placeholder="時間帯（任意）例：昼〜夕方" className={smallInputClass} />
              <input type="text" value={t.memo} onChange={(e) => update(i, { memo: e.target.value })}
                maxLength={120} placeholder="メモ（任意）" className={smallInputClass} />
            </div>
          </div>
        );
      })}

      <datalist id="work-suggestions">
        {suggestions.works.map((w) => <option key={w} value={w} />)}
      </datalist>
      <datalist id="character-suggestions-all">
        {suggestions.allCharacters.map((c) => <option key={c} value={c} />)}
      </datalist>

      <button type="button" onClick={add}
        className="w-full rounded-xl border-2 border-dashed border-blue-200 text-blue-600 py-2.5 text-sm font-bold hover:bg-blue-50 transition-colors">
        ＋ 撮りたい作品・キャラを追加
      </button>
    </div>
  );
}
