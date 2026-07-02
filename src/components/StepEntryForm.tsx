'use client';

import { useState, useEffect, useRef } from 'react';
import type {
  ParticipationType,
  CosplayShootingStatus,
  PhotographerFirstMeetStatus,
  TimeBand,
  GreetingLevel,
  ShootingPolicy,
  Profile,
  CreateEntryResult,
} from '@/types';
import type { CosplaySuggestions } from '@/lib/entries';
import {
  PARTICIPATION_TYPE_LABELS,
  TIME_BAND_LABELS,
  GREETING_LEVEL_LABELS,
  SHOOTING_POLICY_LABELS,
} from '@/lib/utils';
import { CosplayPlansEditor, emptyPlan, type PlanDraft } from './CosplayPlansEditor';
import { ShootingTargetsEditor, emptyTarget, type TargetDraft } from './ShootingTargetsEditor';
import { PhotographerSamplesEditor } from './PhotographerSamplesEditor';
import { EntrySuccessView } from './EntrySuccessView';
import { track } from '@/lib/analytics-client';

export interface StepDefaults {
  displayName?: string;
  participationType?: ParticipationType;
  timeBand?: TimeBand;
  greetingLevel?: GreetingLevel;
  shootingPolicy?: ShootingPolicy;
}

interface Props {
  eventId: string;
  eventName: string;
  eventHashtag?: string;
  eventDate: string;
  suggestions: CosplaySuggestions;
  profile: Profile;
  defaults?: StepDefaults;
}

interface FormData {
  participationType: ParticipationType;
  displayName: string;
  profileUrl: string;
  plans: PlanDraft[];
  targets: TargetDraft[];
  likedWorks: string;
  wantWorks: string;
  timeBand: TimeBand;
  greetingLevel: GreetingLevel;
  shootingPolicy: ShootingPolicy;
  comment: string;
}

const STEP_LABELS = ['参加スタイル', 'プロフィール', '当日の予定', '見つけてもらう設定', 'ひとこと・画像', '確認'];
const STEP_TITLES = [
  'まず、どんな形で参加しますか？',
  '見つけてもらうための名前を教えてください',
  '当日の予定を登録しましょう',
  '声をかけてもらいやすくしましょう',
  '最後に、ひとことを添えましょう',
  'この内容で参加表明します',
];
const TOTAL = 6;

const TYPES: ParticipationType[] = ['cosplay', 'photographer', 'general', 'undecided'];
const TIME_BANDS: TimeBand[] = ['morning', 'noon', 'evening', 'night', 'allday', 'undecided'];
const GREETINGS: GreetingLevel[] = ['welcome', 'mutual', 'acquaintance', 'quiet'];
const POLICIES: ShootingPolicy[] = ['ok', 'mutual', 'acquaintance', 'no'];

const inputClass =
  'w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 bg-white';

function pill(active: boolean) {
  return `px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${
    active ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white border-transparent' : 'bg-white text-gray-600 border-gray-300 hover:border-pink-300'
  }`;
}

function deriveShootingStatus(g: GreetingLevel, s: ShootingPolicy): CosplayShootingStatus {
  if (s === 'no') return 'no_shooting';
  if (s === 'acquaintance') return 'acquaintance_only';
  if (s === 'mutual') return 'mutual_ok';
  return g === 'welcome' ? 'greeting_welcome' : 'planned';
}
function deriveFirstMeet(s: ShootingPolicy): PhotographerFirstMeetStatus {
  if (s === 'ok') return 'ok';
  if (s === 'mutual') return 'mutual_only';
  if (s === 'acquaintance') return 'acquaintance_only';
  return 'negotiable';
}

export function StepEntryForm({ eventId, eventName, eventHashtag, eventDate, suggestions, profile, defaults }: Props) {
  const xId = profile.xUsername ?? '';
  const draftKey = `cosiku-draft-v1-${eventId}`;

  const [form, setForm] = useState<FormData>({
    participationType: defaults?.participationType ?? 'cosplay',
    displayName: defaults?.displayName ?? profile.xDisplayName ?? '',
    profileUrl: '',
    plans: [emptyPlan()],
    targets: [emptyTarget()],
    likedWorks: '',
    wantWorks: '',
    timeBand: defaults?.timeBand ?? 'undecided',
    greetingLevel: defaults?.greetingLevel ?? 'welcome',
    shootingPolicy: defaults?.shootingPolicy ?? 'ok',
    comment: '',
  });
  // フォームファネル計測：最初の操作で1回だけ form_start を送る
  const startedRef = useRef(false);
  const markStarted = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    track({ event_name: 'entry_form_start', event_id: eventId, metadata: { participation: form.participationType } });
  };

  const update = (patch: Partial<FormData>) => {
    markStarted();
    setForm((f) => ({ ...f, ...patch }));
  };

  const [step, setStep] = useState(1);
  const [showErr, setShowErr] = useState(false);
  const [stepErr, setStepErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [created, setCreated] = useState<{ entryId: string; editToken: string } | null>(null);

  // 画像
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 下書き：読込（マウント時に1回）
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const raw = localStorage.getItem(draftKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setForm((f) => ({ ...f, ...(JSON.parse(raw) as Partial<FormData>) }));
    } catch {
      /* ignore */
    }
  }, [draftKey]);

  // 下書き：保存
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(form));
    } catch {
      /* ignore */
    }
  }, [draftKey, form]);

  // フォームファネル計測：ステップ到達（どのステップで離脱するかの特定用）
  useEffect(() => {
    track({
      event_name: 'entry_step_view',
      event_id: eventId,
      metadata: { step, label: STEP_LABELS[step - 1], participation: form.participationType },
    });
    // participationType はステップ遷移計測には含めたいが、変化のたびに再送しないよう step のみを依存にする
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, eventId]);

  const cleanPlans = () =>
    form.plans
      .map((p) => ({
        workTitle: p.workTitle.trim(),
        characterName: p.characterName.trim(),
        costumeLabel: p.costumeLabel.trim(),
        timeSlot: p.timeSlot.trim(),
        planMemo: p.planMemo.trim(),
      }))
      .filter((p) => p.workTitle || p.characterName);

  const cleanTargets = () =>
    form.targets
      .map((t) => ({ workTitle: t.workTitle.trim(), characterName: t.characterName.trim(), timeSlot: t.timeSlot.trim(), memo: t.memo.trim() }))
      // 作品名は任意。キャラ名だけの行も有効なターゲットとして扱う
      .filter((t) => t.workTitle || t.characterName);

  function validateStep(s: number): string {
    if (s === 2 && !form.displayName.trim()) return '表示名を入力してください';
    if (s === 3) {
      if (form.participationType === 'cosplay') {
        const p = cleanPlans();
        if (p.length === 0 || p.some((x) => !x.workTitle || !x.characterName)) return '各予定の作品名・キャラ名を入力してください';
      }
    }
    return '';
  }

  function next() {
    markStarted();
    const err = validateStep(step);
    if (err) {
      track({
        event_name: 'entry_validation_error',
        event_id: eventId,
        metadata: { step, message: err, participation: form.participationType },
      });
      setStepErr(err);
      setShowErr(true);
      return;
    }
    setStepErr('');
    setShowErr(false);
    setStep((s) => Math.min(TOTAL, s + 1));
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function back() {
    setStepErr('');
    setShowErr(false);
    setStep((s) => Math.max(1, s - 1));
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function goto(s: number) {
    if (s < step) {
      setStepErr('');
      setShowErr(false);
      setStep(s);
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      setImageError('jpg / png / webp 形式の画像を選んでください');
      return;
    }
    if (f.size > 3 * 1024 * 1024) {
      setImageError('画像は3MB以下にしてください');
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  }
  function clearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setImageError('');
    if (imageInputRef.current) imageInputRef.current.value = '';
  }

  async function submit() {
    setLoading(true);
    setSubmitError('');
    track({
      event_name: 'entry_submit_attempt',
      event_id: eventId,
      metadata: { participation: form.participationType, hasImage: Boolean(imageFile) },
    });
    try {
      const body: Record<string, unknown> = {
        eventId,
        displayName: form.displayName.trim(),
        xId,
        participationType: form.participationType,
        participationDate: eventDate,
        comment: form.comment.trim(),
        portfolioUrl: form.profileUrl.trim() || undefined,
        timeBand: form.timeBand,
        greetingLevel: form.greetingLevel,
        shootingPolicy: form.shootingPolicy,
      };
      if (form.participationType === 'cosplay') {
        const p = cleanPlans();
        body.cosplayPlans = p;
        body.cosplayInfo = {
          workName: p[0]?.workTitle ?? '',
          characterName: p[0]?.characterName ?? '',
          shootingStatus: deriveShootingStatus(form.greetingLevel, form.shootingPolicy),
        };
      } else if (form.participationType === 'photographer') {
        const t = cleanTargets();
        body.shootingTargets = t;
        body.photographerInfo = {
          targetWorks: t[0]?.workTitle ?? '',
          availableHours: '',
          firstMeetStatus: deriveFirstMeet(form.shootingPolicy),
          portfolioUrl: form.profileUrl.trim(),
          shootingStyles: [],
        };
      } else {
        body.likedWorks = form.likedWorks.trim() || undefined;
        body.wantWorks = form.wantWorks.trim() || undefined;
      }

      let res: Response;
      if (imageFile) {
        const fd = new FormData();
        fd.append('payload', JSON.stringify(body));
        fd.append('file', imageFile);
        res = await fetch('/api/entries', { method: 'POST', body: fd });
      } else {
        res = await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? '送信に失敗しました');
      }
      const result = (await res.json()) as CreateEntryResult;
      try {
        localStorage.removeItem(draftKey);
      } catch {
        /* ignore */
      }
      track({
        event_name: 'entry_submit_success',
        event_id: eventId,
        entry_id: result.entry.id,
        metadata: { participation: form.participationType },
      });
      setCreated({ entryId: result.entry.id, editToken: result.editToken });
    } catch (err) {
      const reason = err instanceof Error ? err.message : '送信に失敗しました';
      track({
        event_name: 'entry_submit_failed',
        event_id: eventId,
        metadata: { participation: form.participationType, reason },
      });
      setSubmitError(reason);
      setLoading(false);
    }
  }

  if (created) {
    return <EntrySuccessView eventId={eventId} eventName={eventName} eventHashtag={eventHashtag} entryId={created.entryId} editToken={created.editToken} />;
  }

  return (
    <div className="pb-44 sm:pb-24">
      {/* ステップ表示 */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-pink-600">STEP {step}／{TOTAL}</span>
          <span className="text-xs text-gray-400">{STEP_LABELS[step - 1]}</span>
        </div>
        <div className="flex gap-1">
          {STEP_LABELS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goto(i + 1)}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i + 1 <= step ? 'bg-gradient-to-r from-pink-500 to-violet-500' : 'bg-gray-200'}`}
              aria-label={`ステップ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-1">{STEP_TITLES[step - 1]}</h2>
      <div className="text-sm text-violet-600 font-medium mb-4">{eventName}</div>

      {/* Step 1: 参加スタイル */}
      {step === 1 && (
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => update({ participationType: t })}
              className={`p-4 rounded-2xl border text-sm font-bold transition-colors ${
                form.participationType === t ? 'border-pink-400 bg-pink-50 text-pink-700' : 'border-gray-200 bg-white text-gray-700 hover:border-pink-300'
              }`}
            >
              {PARTICIPATION_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      )}

      {/* Step 2: プロフィール */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              表示名<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => update({ displayName: e.target.value })}
              maxLength={40}
              placeholder="当日呼ばれたい名前"
              className={`${inputClass} ${showErr && !form.displayName.trim() ? 'border-red-300' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Xユーザー名</label>
            <div className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-500">@{xId}</div>
            <p className="text-xs text-gray-400 mt-1">ログイン中のXアカウントで「Xログイン確認済み」になります。</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">プロフィール / ポートフォリオURL（任意）</label>
            <input
              type="url"
              value={form.profileUrl}
              onChange={(e) => update({ profileUrl: e.target.value })}
              maxLength={300}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* Step 3: 当日の予定 */}
      {step === 3 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 -mt-2">1イベントで複数キャラ出す場合は、予定を追加できます。</p>
          {form.participationType === 'cosplay' && (
            <CosplayPlansEditor plans={form.plans} onChange={(plans) => update({ plans })} suggestions={suggestions} showErrors={showErr} />
          )}
          {form.participationType === 'photographer' && (
            <div className="space-y-5">
              <PhotographerSamplesEditor initialSamples={profile.photographerSamples ?? []} />
              <div className="border-t border-gray-100 pt-4">
                <ShootingTargetsEditor targets={form.targets} onChange={(targets) => update({ targets })} suggestions={suggestions} />
              </div>
            </div>
          )}
          {(form.participationType === 'general' || form.participationType === 'undecided') && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">好きな作品（任意）</label>
                <input type="text" value={form.likedWorks} onChange={(e) => update({ likedWorks: e.target.value })} maxLength={200} placeholder="例：原神 / ホロライブ" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">会いたい作品・キャラ（任意）</label>
                <input type="text" value={form.wantWorks} onChange={(e) => update({ wantWorks: e.target.value })} maxLength={200} placeholder="例：フリーナのコスプレさんに会いたい" className={inputClass} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: 見つけてもらう設定 */}
      {step === 4 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">参加時間帯</label>
            <div className="flex flex-wrap gap-2">
              {TIME_BANDS.map((t) => (
                <button key={t} type="button" onClick={() => update({ timeBand: t })} className={pill(form.timeBand === t)}>
                  {TIME_BAND_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">挨拶歓迎度</label>
            <div className="flex flex-wrap gap-2">
              {GREETINGS.map((g) => (
                <button key={g} type="button" onClick={() => update({ greetingLevel: g })} className={pill(form.greetingLevel === g)}>
                  {GREETING_LEVEL_LABELS[g]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">撮影相談可否</label>
            <div className="flex flex-wrap gap-2">
              {POLICIES.map((p) => (
                <button key={p} type="button" onClick={() => update({ shootingPolicy: p })} className={pill(form.shootingPolicy === p)}>
                  {SHOOTING_POLICY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 5: ひとこと・画像 */}
      {step === 5 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ひとこと（任意）</label>
            <textarea
              value={form.comment}
              onChange={(e) => update({ comment: e.target.value })}
              maxLength={300}
              rows={3}
              placeholder="声をかけてもらえると嬉しいこと、当日の動きなど"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">画像（任意）</label>
            {imagePreview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="" className="w-full aspect-video object-contain rounded-xl border border-gray-200 bg-gray-50" />
                <button type="button" onClick={clearImage} className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">削除</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-1 w-full aspect-video border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm cursor-pointer hover:border-pink-300">
                <span className="text-2xl">＋</span>
                画像を選ぶ（jpg/png/webp・3MBまで）
                <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} className="hidden" />
              </label>
            )}
            {imageError && <p className="text-xs text-red-500 mt-1">{imageError}</p>}
          </div>
        </div>
      )}

      {/* Step 6: 確認 */}
      {step === 6 && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-pink-100 bg-white shadow-sm overflow-hidden">
            {imagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="" className="w-full aspect-video object-contain bg-gray-50" />
            )}
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-gray-900">{form.displayName || '（表示名未入力）'}</p>
                <span className="text-xs px-2 py-1 rounded-full bg-pink-100 text-pink-700 font-bold">{PARTICIPATION_TYPE_LABELS[form.participationType]}</span>
              </div>
              <p className="text-xs text-gray-400">@{xId}</p>

              {form.participationType === 'cosplay' && (
                <ol className="space-y-1 pt-1">
                  {cleanPlans().map((p, i) => (
                    <li key={i} className="text-sm text-gray-700">
                      <span className="text-pink-500 font-bold mr-1">{i + 1}.</span>
                      {p.workTitle} / {p.characterName}
                      {(p.timeSlot || p.costumeLabel) && <span className="text-xs text-gray-400 ml-1">（{[p.timeSlot, p.costumeLabel].filter(Boolean).join('｜')}）</span>}
                    </li>
                  ))}
                </ol>
              )}
              {form.participationType === 'photographer' && (
                <ol className="space-y-1 pt-1">
                  {cleanTargets().map((t, i) => (
                    <li key={i} className="text-sm text-gray-700">
                      <span className="text-blue-500 font-bold mr-1">{i + 1}.</span>
                      {[t.workTitle, t.characterName].filter(Boolean).join(' / ')}
                      {t.timeSlot && <span className="text-xs text-gray-400 ml-1">（{t.timeSlot}）</span>}
                    </li>
                  ))}
                </ol>
              )}
              {(form.participationType === 'general' || form.participationType === 'undecided') && (
                <div className="text-sm text-gray-700 space-y-0.5 pt-1">
                  {form.likedWorks && <p>好きな作品：{form.likedWorks}</p>}
                  {form.wantWorks && <p>会いたい：{form.wantWorks}</p>}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">時間：{TIME_BAND_LABELS[form.timeBand]}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{GREETING_LEVEL_LABELS[form.greetingLevel]}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{SHOOTING_POLICY_LABELS[form.shootingPolicy]}</span>
              </div>
              {form.comment && <p className="text-sm text-gray-600 pt-1">{form.comment}</p>}
            </div>
          </div>
          <button type="button" onClick={() => goto(1)} className="text-xs text-gray-500 hover:text-pink-600 hover:underline">
            ← 最初から見直す
          </button>
          {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        </div>
      )}

      {stepErr && <p className="text-sm text-red-500 mt-3">{stepErr}</p>}

      {/* 下部固定ナビ */}
      <div className="fixed bottom-14 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-10 sm:bottom-0">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step > 1 ? (
            <button type="button" onClick={back} disabled={loading} className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-3 text-sm font-bold hover:bg-gray-50 disabled:opacity-50">
              戻る
            </button>
          ) : (
            <div className="flex-1" />
          )}
          {step < TOTAL ? (
            <button type="button" onClick={next} className="flex-[2] bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-xl py-3 text-sm font-bold hover:opacity-90 transition-opacity">
              次へ
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={loading} className="flex-[2] bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-xl py-3 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60">
              {loading ? '送信中…' : '登録する'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
