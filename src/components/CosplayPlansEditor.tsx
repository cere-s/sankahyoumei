'use client';

import type { CosplaySuggestions } from '@/lib/entries';

export interface PlanDraft {
  workTitle: string;
  characterName: string;
  costumeLabel: string;
  timeSlot: string;
  planMemo: string;
}

export function emptyPlan(): PlanDraft {
  return { workTitle: '', characterName: '', costumeLabel: '', timeSlot: '', planMemo: '' };
}

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none';
const smallInputClass =
  'w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none';

interface Props {
  plans: PlanDraft[];
  onChange: (plans: PlanDraft[]) => void;
  suggestions: CosplaySuggestions;
  showErrors?: boolean;
}

export function CosplayPlansEditor({ plans, onChange, suggestions, showErrors }: Props) {
  const update = (i: number, patch: Partial<PlanDraft>) =>
    onChange(plans.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const add = () => onChange([...plans, emptyPlan()]);
  const remove = (i: number) => onChange(plans.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= plans.length) return;
    const next = [...plans];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-700">当日の予定キャラ</p>
        <span className="text-[11px] text-gray-400">2キャラ以上もOK</span>
      </div>

      {plans.map((p, i) => {
        const charOptions = suggestions.charactersByWork[p.workTitle.trim()] ?? suggestions.allCharacters;
        const workMissing = showErrors && !p.workTitle.trim();
        const charMissing = showErrors && !p.characterName.trim();
        return (
          <div key={i} className="rounded-xl border border-pink-100 bg-white p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-pink-100 text-pink-700 text-xs font-bold">
                {i + 1}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                  aria-label="上へ"
                  className="w-7 h-7 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === plans.length - 1}
                  aria-label="下へ"
                  className="w-7 h-7 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent">↓</button>
                {plans.length > 1 && (
                  <button type="button" onClick={() => remove(i)} aria-label="この予定を削除"
                    className="w-7 h-7 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500">✕</button>
                )}
              </div>
            </div>

            <div>
              <input type="text" value={p.workTitle} onChange={(e) => update(i, { workTitle: e.target.value })}
                list="work-suggestions" autoComplete="off" maxLength={100}
                placeholder="作品名（必須）例：原神"
                className={`${inputClass} ${workMissing ? 'border-red-300' : ''}`} />
              {workMissing && <p className="text-xs text-red-500 mt-1">作品名を入力してください</p>}
            </div>

            <div>
              <input type="text" value={p.characterName} onChange={(e) => update(i, { characterName: e.target.value })}
                list={`char-suggestions-${i}`} autoComplete="off" maxLength={100}
                placeholder="キャラ名（必須）例：フリーナ"
                className={`${inputClass} ${charMissing ? 'border-red-300' : ''}`} />
              <datalist id={`char-suggestions-${i}`}>
                {charOptions.map((c) => <option key={c} value={c} />)}
              </datalist>
              {charMissing && <p className="text-xs text-red-500 mt-1">キャラ名を入力してください</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={p.timeSlot} onChange={(e) => update(i, { timeSlot: e.target.value })}
                maxLength={40} placeholder="時間帯（任意）例：昼〜夕方" className={smallInputClass} />
              <input type="text" value={p.costumeLabel} onChange={(e) => update(i, { costumeLabel: e.target.value })}
                maxLength={40} placeholder="衣装（任意）例：通常衣装" className={smallInputClass} />
            </div>
            <input type="text" value={p.planMemo} onChange={(e) => update(i, { planMemo: e.target.value })}
              maxLength={120} placeholder="メモ（任意）" className={smallInputClass} />
          </div>
        );
      })}

      <datalist id="work-suggestions">
        {suggestions.works.map((w) => <option key={w} value={w} />)}
      </datalist>

      <button type="button" onClick={add}
        className="w-full rounded-xl border-2 border-dashed border-pink-200 text-pink-600 py-2.5 text-sm font-bold hover:bg-pink-50 transition-colors">
        ＋ 作品・キャラを追加
      </button>
    </div>
  );
}
