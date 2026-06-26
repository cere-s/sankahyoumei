'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  ParticipationEntry,
  Event,
  CosplayShootingStatus,
  PhotographerFirstMeetStatus,
  PhotographerShootingStyle,
} from '@/types';
import {
  COSPLAY_SHOOTING_STATUS_LABELS,
  PHOTOGRAPHER_FIRST_MEET_LABELS,
  PHOTOGRAPHER_SHOOTING_STYLE_LABELS,
} from '@/lib/utils';
import type { CosplaySuggestions } from '@/lib/entries';
import { ImageUpload } from './ImageUpload';

interface Props {
  entry: ParticipationEntry;
  event: Event;
  editToken: string;
  suggestions?: CosplaySuggestions;
}

const EMPTY_SUGGESTIONS: CosplaySuggestions = { works: [], charactersByWork: {}, allCharacters: [] };

const inputClass =
  'w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white';

const COSPLAY_STATUSES: CosplayShootingStatus[] = [
  'greeting_welcome', 'mutual_ok', 'acquaintance_only',
  'after_meeting_ok', 'planned', 'no_shooting',
];
const PHOTOGRAPHER_FIRST_MEETS: PhotographerFirstMeetStatus[] = [
  'ok', 'mutual_only', 'acquaintance_only', 'negotiable',
];
const PHOTOGRAPHER_STYLES: PhotographerShootingStyle[] = [
  'natural_light', 'strobe_ok', 'portrait', 'recreation', 'social',
];

export function EditEntryForm({ entry, event, editToken, suggestions = EMPTY_SUGGESTIONS }: Props) {
  const router = useRouter();

  const [comment, setComment] = useState(entry.comment);
  const [participationDate, setParticipationDate] = useState(entry.participationDate);
  const [tweetUrl, setTweetUrl] = useState(entry.tweetUrl ?? '');

  // Cosplay
  const [workName, setWorkName] = useState(entry.cosplayInfo?.workName ?? '');
  const [characterName, setCharacterName] = useState(entry.cosplayInfo?.characterName ?? '');
  const [shootingStatus, setShootingStatus] = useState<CosplayShootingStatus>(
    entry.cosplayInfo?.shootingStatus ?? 'greeting_welcome'
  );

  // Photographer
  const [targetWorks, setTargetWorks] = useState(entry.photographerInfo?.targetWorks ?? '');
  const [availableHours, setAvailableHours] = useState(entry.photographerInfo?.availableHours ?? '');
  const [firstMeetStatus, setFirstMeetStatus] = useState<PhotographerFirstMeetStatus>(
    entry.photographerInfo?.firstMeetStatus ?? 'negotiable'
  );
  const [portfolioUrl, setPortfolioUrl] = useState(entry.photographerInfo?.portfolioUrl ?? '');
  const [shootingStyles, setShootingStyles] = useState<PhotographerShootingStyle[]>(
    entry.photographerInfo?.shootingStyles ?? []
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const characterOptions =
    suggestions.charactersByWork[workName.trim()] ?? suggestions.allCharacters;

  function toggleStyle(s: PhotographerShootingStyle) {
    setShootingStyles((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const body: Record<string, unknown> = {
      token: editToken,
      comment,
      participationDate,
      tweetUrl,
    };

    if (entry.participationType === 'cosplay') {
      body.cosplayInfo = { workName, characterName, shootingStatus };
    }
    if (entry.participationType === 'photographer') {
      body.photographerInfo = { targetWorks, availableHours, firstMeetStatus, portfolioUrl, shootingStyles };
    }

    try {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? '更新に失敗しました');
      }
      router.push(`/events/${event.id}/entries/${entry.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: editToken }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? '削除に失敗しました');
      }
      router.push(`/events/${event.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleUpdate} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">参加日</label>
          <input type="date" value={participationDate}
            onChange={(e) => setParticipationDate(e.target.value)} className={inputClass} />
        </div>

        {entry.participationType === 'cosplay' && (
          <div className="border border-pink-100 rounded-xl p-4 space-y-4 bg-pink-50/30">
            <h3 className="text-sm font-bold text-gray-700">コスプレ情報</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">作品名</label>
              <input type="text" value={workName} onChange={(e) => setWorkName(e.target.value)}
                list="work-suggestions" autoComplete="off" className={inputClass} />
              <datalist id="work-suggestions">
                {suggestions.works.map((w) => <option key={w} value={w} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">キャラ名</label>
              <input type="text" value={characterName} onChange={(e) => setCharacterName(e.target.value)}
                list="character-suggestions" autoComplete="off" className={inputClass} />
              <datalist id="character-suggestions">
                {characterOptions.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">撮影・交流スタンス</label>
              <div className="flex flex-col gap-2">
                {COSPLAY_STATUSES.map((s) => (
                  <label key={s} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer transition-colors ${
                    shootingStatus === s
                      ? 'border-violet-400 bg-violet-50 text-violet-800'
                      : 'border-gray-200 bg-white text-gray-700'
                  }`}>
                    <input type="radio" name="shootingStatus" value={s}
                      checked={shootingStatus === s} onChange={() => setShootingStatus(s)}
                      className="accent-violet-600" />
                    {COSPLAY_SHOOTING_STATUS_LABELS[s]}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {entry.participationType === 'photographer' && (
          <div className="border border-blue-100 rounded-xl p-4 space-y-4 bg-blue-50/30">
            <h3 className="text-sm font-bold text-gray-700">カメラマン情報</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">撮りたい作品</label>
              <input type="text" value={targetWorks} onChange={(e) => setTargetWorks(e.target.value)}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">撮影可能時間</label>
              <input type="text" value={availableHours} onChange={(e) => setAvailableHours(e.target.value)}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">初対面撮影</label>
              <div className="grid grid-cols-2 gap-2">
                {PHOTOGRAPHER_FIRST_MEETS.map((s) => (
                  <label key={s} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer transition-colors ${
                    firstMeetStatus === s
                      ? 'border-violet-400 bg-violet-50 text-violet-800'
                      : 'border-gray-200 bg-white text-gray-700'
                  }`}>
                    <input type="radio" name="firstMeetStatus" value={s}
                      checked={firstMeetStatus === s} onChange={() => setFirstMeetStatus(s)}
                      className="accent-violet-600" />
                    {PHOTOGRAPHER_FIRST_MEET_LABELS[s]}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">作例URL</label>
              <input type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">撮影スタイル</label>
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
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">コメント</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)}
            rows={3} className={`${inputClass} resize-none`} />
        </div>

        {/* 画像（即時にアップロード・削除されるため、保存ボタンとは独立） */}
        <ImageUpload entryId={entry.id} initialUrl={entry.imageUrl} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ツイートURL（任意）</label>
          <input type="url" value={tweetUrl} onChange={(e) => setTweetUrl(e.target.value)}
            placeholder="https://x.com/あなたのID/status/..." className={inputClass} />
          <p className="mt-1 text-xs text-gray-400">
            ご自身のツイートURLを入力すると埋め込まれます。空にすると埋め込みを解除します。
            投稿者がX IDと一致しない場合は保存できません。
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-violet-600 text-white rounded-xl py-3.5 font-bold text-sm hover:bg-violet-700 disabled:opacity-50 transition-colors">
          {loading ? '更新中...' : '変更を保存する'}
        </button>
      </form>

      {/* 削除セクション */}
      <div className="border border-red-100 rounded-xl p-4 space-y-3 bg-red-50/30">
        <h3 className="text-sm font-bold text-red-800">参加表明を削除</h3>
        {!deleteConfirm ? (
          <button onClick={() => setDeleteConfirm(true)}
            className="w-full border border-red-300 text-red-700 rounded-xl py-2.5 text-sm hover:bg-red-50 transition-colors">
            削除する
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-red-700">本当に削除しますか？この操作は取り消せません。</p>
            <div className="flex gap-2">
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-colors">
                {deleteLoading ? '削除中...' : '削除する'}
              </button>
              <button onClick={() => setDeleteConfirm(false)}
                className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
