'use client';

import { useRef, useState } from 'react';

interface Props {
  entryId: string;
  /** 既存の画像URL（あれば） */
  initialUrl?: string;
}

export function ImageUpload({ entryId, initialUrl }: Props) {
  const [url, setUrl] = useState<string | null>(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    // クライアント側の事前チェック
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('jpg / png / webp 形式の画像を選んでください');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('画像は3MB以下にしてください');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/entries/${entryId}/image`, { method: 'POST', body: fd });
      const data = (await res.json()) as { imageUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'アップロードに失敗しました');
      // キャッシュ回避のためタイムスタンプを付与
      setUrl(`${data.imageUrl}?t=${Date.now()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDelete() {
    setError('');
    setUploading(true);
    try {
      const res = await fetch(`/api/entries/${entryId}/image`, { method: 'DELETE' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? '削除に失敗しました');
      setUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">参加表明画像（任意）</label>

      {/* プレビュー枠（16:9・CLS対策で高さ固定） */}
      <div className="relative w-full aspect-video rounded-xl border border-gray-200 bg-gray-100 overflow-hidden flex items-center justify-center">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="参加表明画像プレビュー" className="w-full h-full object-contain" />
        ) : (
          <div className="text-gray-400 text-xs flex flex-col items-center gap-1">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 12h.008M3 16.5V7.5A2.25 2.25 0 015.25 5.25h13.5A2.25 2.25 0 0121 7.5v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.5z" />
            </svg>
            画像なし
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-sm text-gray-600">
            処理中...
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex-1 border border-violet-300 text-violet-700 rounded-xl py-2 text-sm font-medium hover:bg-violet-50 disabled:opacity-50 transition-colors"
        >
          {url ? '画像を変更' : '画像をアップロード'}
        </button>
        {url && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={uploading}
            className="px-4 border border-red-300 text-red-700 rounded-xl py-2 text-sm hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            削除
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleSelect}
        className="hidden"
      />

      <p className="mt-1 text-xs text-gray-400">
        推奨比率 16:9 / 推奨サイズ 1200×675px。jpg・png・webp、3MBまで。
      </p>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
