'use client';

import { useRef, useState } from 'react';
import type { PhotographerSample } from '@/types';

const MAX_SAMPLES = 4;

interface Props {
  initialSamples: PhotographerSample[];
}

/**
 * カメラマンの作例（最大4枚）をその場でアップロード・削除できる編集欄。
 * プロフィールに保存され、他の参加表明にも同じものが表示される。
 */
export function PhotographerSamplesEditor({ initialSamples }: Props) {
  const [samples, setSamples] = useState<PhotographerSample[]>(initialSamples);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [subjectInput, setSubjectInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('jpg / png / webp 形式の画像を選んでください');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('画像は3MB以下にしてください');
      return;
    }
    setPendingFile(file);
    setSubjectInput('');
  }

  async function confirmUpload() {
    if (!pendingFile) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', pendingFile);
      if (subjectInput.trim()) fd.append('subjectXId', subjectInput.trim());
      const res = await fetch('/api/profile/samples', { method: 'POST', body: fd });
      const data = (await res.json()) as { samples?: PhotographerSample[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? '登録に失敗しました');
      setSamples(data.samples ?? []);
      setPendingFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDelete(key: string) {
    setError('');
    setUploading(true);
    try {
      const res = await fetch(`/api/profile/samples?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
      const data = (await res.json()) as { samples?: PhotographerSample[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? '削除に失敗しました');
      setSamples(data.samples ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    } finally {
      setUploading(false);
    }
  }

  const emptySlots = Math.max(0, MAX_SAMPLES - samples.length);

  return (
    <div>
      <p className="block text-sm font-bold text-gray-700 mb-1">あなたの作例（プロフィールに保存・全イベント共通）</p>
      <p className="text-xs text-gray-400 mb-2 leading-relaxed">
        ここで登録した作例は、あなたの他の参加表明にも同じものが表示されます。あとから変更・削除もできます。
      </p>

      <div className="grid grid-cols-4 gap-2">
        {samples.map((s) => (
          <div key={s.key} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleDelete(s.key)}
              disabled={uploading}
              aria-label="この作例を削除"
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center disabled:opacity-50"
            >
              ×
            </button>
          </div>
        ))}
        {emptySlots > 0 &&
          Array.from({ length: emptySlots }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-2xl flex items-center justify-center hover:border-pink-300 disabled:opacity-50"
              aria-label="作例を追加"
            >
              ＋
            </button>
          ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleSelect}
        className="hidden"
      />

      {pendingFile && (
        <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-bold text-gray-600 mb-1.5">被写体のXアカウント（任意）</p>
          <input
            type="text"
            value={subjectInput}
            onChange={(e) => setSubjectInput(e.target.value)}
            placeholder="例：cos_hanako"
            maxLength={15}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <p className="text-[11px] text-gray-400 mt-1 mb-2">
            登録すると、この作例をタップした人にだけ小さく表示されます。相手には通知されません。
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmUpload}
              disabled={uploading}
              className="flex-1 bg-violet-600 text-white rounded-lg py-2 text-sm font-bold hover:bg-violet-700 disabled:opacity-50"
            >
              {uploading ? '登録中...' : 'この作例を登録'}
            </button>
            <button
              type="button"
              onClick={() => setPendingFile(null)}
              disabled={uploading}
              className="px-4 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              やめる
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
