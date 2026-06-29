'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import type {
  ParticipationType,
  CosplayShootingStatus,
  PhotographerFirstMeetStatus,
  PhotographerShootingStyle,
  CreateEntryResult,
  Profile,
  CosplayInfo,
  CosplayPlan,
  PhotographerInfo,
} from '@/types';
import type { CosplaySuggestions } from '@/lib/entries';
import { CosplayPlansEditor, emptyPlan, type PlanDraft } from '@/components/CosplayPlansEditor';
import {
  PARTICIPATION_TYPE_LABELS,
  COSPLAY_SHOOTING_STATUS_LABELS,
  PHOTOGRAPHER_FIRST_MEET_LABELS,
  PHOTOGRAPHER_SHOOTING_STYLE_LABELS,
  parseHashtags,
} from '@/lib/utils';

/** 前回の参加表明から引き継ぐ初期値 */
export interface EntryDefaults {
  displayName?: string;
  participationType?: ParticipationType;
  cosplayInfo?: CosplayInfo;
  cosplayPlans?: CosplayPlan[];
  photographerInfo?: PhotographerInfo;
}

interface Props {
  eventId: string;
  eventName: string;
  defaultDate: string;
  /** イベントのハッシュタグ（#なし）。X投稿に付与する */
  eventHashtag?: string;
  suggestions?: CosplaySuggestions;
  /** Xログイン済みプロフィール（X IDは手入力させず、ここから自動設定する） */
  profile: Profile;
  /** 直近の参加表明から引き継ぐ初期値 */
  defaults?: EntryDefaults;
}

const EMPTY_SUGGESTIONS: CosplaySuggestions = { works: [], charactersByWork: {}, allCharacters: [] };

type FormErrors = Partial<Record<string, string>>;
type FormState = 'input' | 'success';

const PARTICIPATION_TYPES: ParticipationType[] = ['cosplay', 'photographer', 'general', 'undecided'];
const COSPLAY_SHOOTING_STATUSES: CosplayShootingStatus[] = [
  'greeting_welcome', 'mutual_ok', 'acquaintance_only',
  'after_meeting_ok', 'planned', 'no_shooting',
];
const PHOTOGRAPHER_FIRST_MEETS: PhotographerFirstMeetStatus[] = [
  'ok', 'mutual_only', 'acquaintance_only', 'negotiable',
];
const PHOTOGRAPHER_STYLES: PhotographerShootingStyle[] = [
  'natural_light', 'strobe_ok', 'portrait', 'recreation', 'social',
];

function Field({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputClass =
  'w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white';

function SuccessView({
  eventId, eventName, eventHashtag, entryId, editToken,
}: {
  eventId: string; eventName: string; eventHashtag?: string; entryId: string; editToken: string;
}) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const editUrl = `${origin}/events/${eventId}/entries/${entryId}/edit?token=${editToken}`;
  const shareUrl = `${origin}/events/${eventId}/entries/${entryId}`;
  const tags = parseHashtags(eventHashtag);
  const intentUrl =
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(`「${eventName}」に参加表明しました！`)}` +
    `&url=${encodeURIComponent(shareUrl)}` +
    (tags.length ? `&hashtags=${encodeURIComponent(tags.join(','))}` : '');

  async function copyEditUrl() {
    await navigator.clipboard.writeText(editUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-lg font-bold text-gray-900">参加表明しました！</h2>
        <p className="text-sm text-gray-500 mt-1">参加者一覧に表示されます</p>
      </div>

      {/* Xで共有（Web Intent。自動投稿はしない） */}
      <a
        href={intentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full bg-black text-white rounded-xl py-3 font-bold text-sm hover:bg-gray-800 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Xで投稿する
      </a>
      <p className="-mt-3 text-center text-xs text-gray-400">投稿画面が開きます。OGPカード付きで共有できます。</p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
        <p className="text-sm font-bold text-amber-900">⚠️ 編集URLを保存してください</p>
        <p className="text-xs text-amber-800 leading-relaxed">
          このURLを持っている人だけが参加表明を編集・削除できます。
          再表示はできないため、今すぐ保存してください。
        </p>
        <div className="bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs text-gray-700 break-all font-mono">
          {editUrl}
        </div>
        <button
          onClick={copyEditUrl}
          className="w-full bg-amber-600 text-white rounded-lg py-2.5 text-sm font-bold hover:bg-amber-700 transition-colors"
        >
          {copied ? 'コピーしました！' : '編集URLをコピー'}
        </button>
      </div>

      <Link
        href={`/events/${eventId}/entries/${entryId}`}
        className="block w-full bg-violet-600 text-white text-center rounded-xl py-3 font-bold text-sm hover:bg-violet-700 transition-colors"
      >
        参加表明ページへ →
      </Link>
      <Link
        href={`/events/${eventId}`}
        className="block w-full border border-gray-200 text-gray-600 text-center rounded-xl py-3 text-sm hover:bg-gray-50 transition-colors"
      >
        イベントの参加者一覧へ
      </Link>
    </div>
  );
}

export function EntryForm({ eventId, eventName, eventHashtag, defaultDate, suggestions = EMPTY_SUGGESTIONS, profile, defaults }: Props) {
  const [formState, setFormState] = useState<FormState>('input');
  const [createdData, setCreatedData] = useState<{ entryId: string; editToken: string } | null>(null);

  // X IDはログイン中のXユーザー名で固定（手入力不可）
  const xId = profile.xUsername ?? '';

  // 直近の参加表明があれば初期値として引き継ぐ（作品・キャラ等は確認・修正できる）
  const [participationType, setParticipationType] = useState<ParticipationType>(defaults?.participationType ?? 'cosplay');
  const [displayName, setDisplayName] = useState(defaults?.displayName ?? '');
  const [participationDate, setParticipationDate] = useState(defaultDate);
  const [comment, setComment] = useState('');
  const [tweetUrl, setTweetUrl] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  // 画像（送信時に作成と同時アップロード）
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Cosplay（当日の予定キャラ：複数可）
  const [plans, setPlans] = useState<PlanDraft[]>(
    defaults?.cosplayPlans?.length
      ? defaults.cosplayPlans.map((p) => ({
          workTitle: p.workTitle ?? '',
          characterName: p.characterName ?? '',
          costumeLabel: p.costumeLabel ?? '',
          timeSlot: p.timeSlot ?? '',
          planMemo: p.planMemo ?? '',
        }))
      : [emptyPlan()]
  );
  const [shootingStatus, setShootingStatus] = useState<CosplayShootingStatus>(defaults?.cosplayInfo?.shootingStatus ?? 'greeting_welcome');

  // Photographer
  const [targetWorks, setTargetWorks] = useState(defaults?.photographerInfo?.targetWorks ?? '');
  const [availableHours, setAvailableHours] = useState(defaults?.photographerInfo?.availableHours ?? '');
  const [firstMeetStatus, setFirstMeetStatus] = useState<PhotographerFirstMeetStatus>(defaults?.photographerInfo?.firstMeetStatus ?? 'negotiable');
  const [portfolioUrl, setPortfolioUrl] = useState(defaults?.photographerInfo?.portfolioUrl ?? '');
  const [shootingStyles, setShootingStyles] = useState<PhotographerShootingStyle[]>(defaults?.photographerInfo?.shootingStyles ?? []);

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  if (formState === 'success' && createdData) {
    return (
      <SuccessView
        eventId={eventId}
        eventName={eventName}
        eventHashtag={eventHashtag}
        entryId={createdData.entryId}
        editToken={createdData.editToken}
      />
    );
  }

  function toggleStyle(style: PhotographerShootingStyle) {
    setShootingStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
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

  const cleanPlans = () =>
    plans
      .map((p) => ({
        workTitle: p.workTitle.trim(),
        characterName: p.characterName.trim(),
        costumeLabel: p.costumeLabel.trim(),
        timeSlot: p.timeSlot.trim(),
        planMemo: p.planMemo.trim(),
      }))
      .filter((p) => p.workTitle || p.characterName);

  function validate(): boolean {
    const e: FormErrors = {};
    if (!displayName.trim()) e.displayName = '表示名を入力してください';
    if (!participationDate) e.participationDate = '参加日を入力してください';
    if (participationType === 'cosplay') {
      const cleaned = cleanPlans();
      if (cleaned.length === 0) e.plans = '作品・キャラを1件以上入力してください';
      else if (cleaned.some((p) => !p.workTitle || !p.characterName))
        e.plans = '各予定の作品名・キャラ名を入力してください';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setSubmitError('');

    try {
      const body: Record<string, unknown> = {
        eventId,
        displayName: displayName.trim(),
        xId: xId.trim().replace(/^@/, ''),
        participationType,
        participationDate,
        comment: comment.trim(),
        tweetUrl: tweetUrl.trim() || undefined,
        deletePassword: deletePassword.trim() || undefined,
      };

      if (participationType === 'cosplay') {
        const cleaned = cleanPlans();
        body.cosplayPlans = cleaned;
        body.cosplayInfo = {
          workName: cleaned[0]?.workTitle ?? '',
          characterName: cleaned[0]?.characterName ?? '',
          shootingStatus,
        };
      }
      if (participationType === 'photographer') {
        body.photographerInfo = {
          targetWorks: targetWorks.trim(),
          availableHours: availableHours.trim(),
          firstMeetStatus,
          portfolioUrl: portfolioUrl.trim(),
          shootingStyles,
        };
      }

      // 画像があれば multipart で同時送信、無ければ JSON
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
      setCreatedData({ entryId: result.entry.id, editToken: result.editToken });
      setFormState('success');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '送信に失敗しました');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="bg-violet-50 rounded-xl px-4 py-3 text-sm text-violet-700 font-medium">
        {eventName}
      </div>

      {defaults && (
        <p className="text-xs text-gray-500 -mt-3">
          前回の参加表明から内容を引き継いでいます。必要に応じて修正してください。
        </p>
      )}

      {/* 参加種別 */}
      <Field label="参加種別" required>
        <div className="flex flex-wrap gap-2">
          {PARTICIPATION_TYPES.map((t) => (
            <button
              key={t} type="button" onClick={() => setParticipationType(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                participationType === t
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-violet-400'
              }`}
            >
              {PARTICIPATION_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </Field>

      {/* 基本情報 */}
      <div className="space-y-4">
        <Field label="表示名" required error={errors.displayName}>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50} placeholder="例：レムコス花子" className={inputClass} />
        </Field>

        <Field label="X ID（Xログイン済み）">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
            {profile.xAvatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.xAvatarUrl} alt="" className="w-6 h-6 rounded-full" />
            )}
            <span className="text-sm font-medium text-gray-800">@{xId}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            ログイン中のXアカウントが使用されます。手入力はできません。
          </p>
        </Field>

        <Field label="参加日" required error={errors.participationDate}>
          <input type="date" value={participationDate}
            onChange={(e) => setParticipationDate(e.target.value)} className={inputClass} />
        </Field>
      </div>

      {/* コスプレ情報 */}
      {participationType === 'cosplay' && (
        <div className="border border-pink-100 rounded-xl p-4 space-y-4 bg-pink-50/30">
          <h3 className="text-sm font-bold text-gray-700">コスプレ情報</h3>
          <CosplayPlansEditor
            plans={plans}
            onChange={setPlans}
            suggestions={suggestions}
            showErrors={Boolean(errors.plans)}
          />
          {errors.plans && <p className="text-xs text-red-500">{errors.plans}</p>}
          <Field label="撮影・交流スタンス" required>
            <div className="flex flex-col gap-2">
              {COSPLAY_SHOOTING_STATUSES.map((s) => (
                <label key={s} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm cursor-pointer transition-colors ${
                  shootingStatus === s
                    ? 'border-violet-400 bg-violet-50 text-violet-800'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}>
                  <input type="radio" name="shootingStatus" value={s}
                    checked={shootingStatus === s} onChange={() => setShootingStatus(s)}
                    className="accent-violet-600" />
                  {COSPLAY_SHOOTING_STATUS_LABELS[s]}
                </label>
              ))}
            </div>
          </Field>
        </div>
      )}

      {/* カメラマン情報 */}
      {participationType === 'photographer' && (
        <div className="border border-blue-100 rounded-xl p-4 space-y-4 bg-blue-50/30">
          <h3 className="text-sm font-bold text-gray-700">カメラマン情報</h3>
          <Field label="撮りたい作品">
            <input type="text" value={targetWorks} onChange={(e) => setTargetWorks(e.target.value)}
              placeholder="例：リゼロ、ゼノブレイド3" className={inputClass} />
          </Field>
          <Field label="撮影可能時間">
            <input type="text" value={availableHours} onChange={(e) => setAvailableHours(e.target.value)}
              placeholder="例：11:00〜15:00" className={inputClass} />
          </Field>
          <Field label="初対面撮影">
            <div className="grid grid-cols-2 gap-2">
              {PHOTOGRAPHER_FIRST_MEETS.map((s) => (
                <label key={s} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer transition-colors ${
                  firstMeetStatus === s
                    ? 'border-violet-400 bg-violet-50 text-violet-800'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}>
                  <input type="radio" name="firstMeetStatus" value={s}
                    checked={firstMeetStatus === s} onChange={() => setFirstMeetStatus(s)}
                    className="accent-violet-600" />
                  {PHOTOGRAPHER_FIRST_MEET_LABELS[s]}
                </label>
              ))}
            </div>
          </Field>
          <Field label="作例URL">
            <input type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://x.com/your_id" className={inputClass} />
          </Field>
          <Field label="撮影スタイル（複数選択可）">
            <div className="flex flex-wrap gap-2">
              {PHOTOGRAPHER_STYLES.map((s) => (
                <button key={s} type="button" onClick={() => toggleStyle(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    shootingStyles.includes(s)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}>
                  {PHOTOGRAPHER_SHOOTING_STYLE_LABELS[s]}
                </button>
              ))}
            </div>
          </Field>
        </div>
      )}

      {/* 共通任意情報 */}
      <div className="space-y-4">
        <Field label="コメント">
          <textarea value={comment} onChange={(e) => setComment(e.target.value)}
            maxLength={1000} placeholder="ひとことメッセージ、当日の予定など"
            rows={3} className={`${inputClass} resize-none`} />
        </Field>
        <Field label="参加表明画像（任意）">
          {/* プレビュー枠（16:9・CLS対策で高さ固定） */}
          <div className="relative w-full aspect-video rounded-xl border border-gray-200 bg-gray-100 overflow-hidden flex items-center justify-center">
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="プレビュー" className="w-full h-full object-contain" />
            ) : (
              <div className="text-gray-400 text-xs flex flex-col items-center gap-1">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 12h.008M3 16.5V7.5A2.25 2.25 0 015.25 5.25h13.5A2.25 2.25 0 0121 7.5v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.5z" />
                </svg>
                画像なし
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={() => imageInputRef.current?.click()}
              className="flex-1 border border-violet-300 text-violet-700 rounded-xl py-2 text-sm font-medium hover:bg-violet-50 transition-colors">
              {imagePreview ? '画像を変更' : '画像を選ぶ'}
            </button>
            {imagePreview && (
              <button type="button" onClick={clearImage}
                className="px-4 border border-red-300 text-red-700 rounded-xl py-2 text-sm hover:bg-red-50 transition-colors">
                削除
              </button>
            )}
          </div>
          <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp"
            onChange={handleImageSelect} className="hidden" />
          <p className="mt-1 text-xs text-gray-400">
            推奨比率 16:9 / 推奨サイズ 1200×675px。jpg・png・webp、3MBまで。送信時にアップロードされます。
          </p>
          {imageError && <p className="mt-1 text-xs text-red-600">{imageError}</p>}
        </Field>
        <Field label="ツイートURL（任意）">
          <input type="url" value={tweetUrl} onChange={(e) => setTweetUrl(e.target.value)}
            placeholder="https://x.com/あなたのID/status/..." className={inputClass} />
          <p className="mt-1 text-xs text-gray-400">
            ご自身のツイートURLを入力すると参加表明ページに埋め込まれます。
            投稿者がX IDと一致しない場合は登録できません。
          </p>
        </Field>
        <Field label="削除用パスワード（任意）">
          <input type="password" value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="後から削除する場合に使います"
            className={inputClass} autoComplete="new-password" />
          <p className="mt-1 text-xs text-gray-400">
            設定しなくても参加表明できます。編集URLは作成後に自動発行されます。
          </p>
        </Field>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <button type="submit" disabled={loading}
        className="w-full bg-violet-600 text-white rounded-xl py-3.5 font-bold text-sm hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        {loading ? '送信中...' : '参加表明する'}
      </button>
    </form>
  );
}
