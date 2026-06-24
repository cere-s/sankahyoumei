'use client';

import { useState } from 'react';
import Link from 'next/link';
import type {
  ParticipationType,
  CosplayShootingStatus,
  PhotographerFirstMeetStatus,
  PhotographerShootingStyle,
  CreateEntryResult,
  Profile,
  CosplayInfo,
  PhotographerInfo,
} from '@/types';
import type { CosplaySuggestions } from '@/lib/entries';
import {
  PARTICIPATION_TYPE_LABELS,
  COSPLAY_SHOOTING_STATUS_LABELS,
  PHOTOGRAPHER_FIRST_MEET_LABELS,
  PHOTOGRAPHER_SHOOTING_STYLE_LABELS,
} from '@/lib/utils';

/** 前回の参加表明から引き継ぐ初期値 */
export interface EntryDefaults {
  displayName?: string;
  participationType?: ParticipationType;
  cosplayInfo?: CosplayInfo;
  photographerInfo?: PhotographerInfo;
}

interface Props {
  eventId: string;
  eventName: string;
  defaultDate: string;
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
  eventId, entryId, editToken,
}: {
  eventId: string; entryId: string; editToken: string;
}) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const editUrl = `${origin}/events/${eventId}/entries/${entryId}/edit?token=${editToken}`;

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

export function EntryForm({ eventId, eventName, defaultDate, suggestions = EMPTY_SUGGESTIONS, profile, defaults }: Props) {
  const [formState, setFormState] = useState<FormState>('input');
  const [createdData, setCreatedData] = useState<{ entryId: string; editToken: string } | null>(null);

  // X IDはログイン中のXユーザー名で固定（手入力不可）
  const xId = profile.xUsername ?? '';

  // 直近の参加表明があれば初期値として引き継ぐ（作品・キャラ等は確認・修正できる）
  const [participationType, setParticipationType] = useState<ParticipationType>(defaults?.participationType ?? 'cosplay');
  const [displayName, setDisplayName] = useState(defaults?.displayName ?? '');
  const [participationDate, setParticipationDate] = useState(defaultDate);
  const [comment, setComment] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tweetUrl, setTweetUrl] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  // Cosplay
  const [workName, setWorkName] = useState(defaults?.cosplayInfo?.workName ?? '');
  const [characterName, setCharacterName] = useState(defaults?.cosplayInfo?.characterName ?? '');
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
        entryId={createdData.entryId}
        editToken={createdData.editToken}
      />
    );
  }

  // 選択中の作品に紐づくキャラ名を優先表示。未一致なら全候補をフォールバック
  const characterOptions =
    suggestions.charactersByWork[workName.trim()] ?? suggestions.allCharacters;

  function toggleStyle(style: PhotographerShootingStyle) {
    setShootingStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!displayName.trim()) e.displayName = '表示名を入力してください';
    if (!participationDate) e.participationDate = '参加日を入力してください';
    if (participationType === 'cosplay') {
      if (!workName.trim()) e.workName = '作品名を入力してください';
      if (!characterName.trim()) e.characterName = 'キャラ名を入力してください';
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
        imageUrl: imageUrl.trim() || undefined,
        tweetUrl: tweetUrl.trim() || undefined,
        deletePassword: deletePassword.trim() || undefined,
      };

      if (participationType === 'cosplay') {
        body.cosplayInfo = {
          workName: workName.trim(),
          characterName: characterName.trim(),
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

      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

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
            placeholder="例：レムコス花子" className={inputClass} />
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
          <Field label="作品名" required error={errors.workName}>
            <input type="text" value={workName} onChange={(e) => setWorkName(e.target.value)}
              list="work-suggestions" autoComplete="off"
              placeholder="例：Re:ゼロから始める異世界生活" className={inputClass} />
            <datalist id="work-suggestions">
              {suggestions.works.map((w) => <option key={w} value={w} />)}
            </datalist>
          </Field>
          <Field label="キャラ名" required error={errors.characterName}>
            <input type="text" value={characterName} onChange={(e) => setCharacterName(e.target.value)}
              list="character-suggestions" autoComplete="off"
              placeholder="例：レム" className={inputClass} />
            <datalist id="character-suggestions">
              {characterOptions.map((c) => <option key={c} value={c} />)}
            </datalist>
          </Field>
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
            placeholder="ひとことメッセージ、当日の予定など"
            rows={3} className={`${inputClass} resize-none`} />
        </Field>
        <Field label="画像URL（任意）">
          <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg" className={inputClass} />
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
