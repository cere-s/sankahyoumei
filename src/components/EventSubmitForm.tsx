'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { REGIONS } from '@/lib/validation';

interface DupEvent {
  id: string;
  name: string;
  date: string;
  location: string;
}

interface Fields {
  name: string;
  date: string;
  region: string;
  location: string;
  officialUrl: string;
  xUrl: string;
  hashtag: string;
  organizer: string;
  description: string;
  address: string;
}

const EMPTY: Fields = {
  name: '',
  date: '',
  region: '',
  location: '',
  officialUrl: '',
  xUrl: '',
  hashtag: '',
  organizer: '',
  description: '',
  address: '',
};

const labelClass = 'block text-sm font-bold text-gray-700 mb-1';
const inputClass =
  'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 placeholder:text-gray-400';

export function EventSubmitForm() {
  const router = useRouter();
  const [f, setF] = useState<Fields>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DupEvent[] | null>(null);

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setF((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(force: boolean) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, force }),
      });
      const json = await res.json().catch(() => ({}));

      if (res.status === 409 && json.error === 'duplicate') {
        setDuplicates(json.duplicates ?? []);
        setSubmitting(false);
        return;
      }
      if (!res.ok) {
        setError(json.error ?? 'イベントの登録に失敗しました');
        setSubmitting(false);
        return;
      }
      // 登録成功（仮登録）→ そのイベントページへ
      router.push(`/events/${json.event.id}?submitted=1`);
    } catch {
      setError('通信に失敗しました');
      setSubmitting(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim() || !f.date || !f.location.trim()) {
      setError('イベント名・開催日・会場は必須です');
      return;
    }
    if (!f.officialUrl.trim() && !f.xUrl.trim()) {
      setError('公式サイトURL か 公式XのURL のどちらかは必須です');
      return;
    }
    submit(false);
  }

  // 重複候補の確認画面
  if (duplicates && duplicates.length > 0) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5 space-y-4">
        <div>
          <p className="text-sm font-bold text-amber-800">似たイベントが既にあります</p>
          <p className="text-xs text-gray-500 mt-1">
            同じイベントなら、そちらに参加表明する方が仲間が集まりやすいです。重複登録だと参加者が分散します。
          </p>
        </div>
        <ul className="space-y-2">
          {duplicates.map((d) => (
            <li key={d.id}>
              <Link
                href={`/events/${d.id}`}
                className="block rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 hover:border-violet-200 transition-colors"
              >
                <p className="text-sm font-bold text-gray-800">{d.name}</p>
                <p className="text-xs text-gray-500">{d.date}・{d.location}</p>
                <span className="text-xs text-violet-600">このイベントを見る →</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            onClick={() => submit(true)}
            disabled={submitting}
            className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm font-bold hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {submitting ? '登録中...' : '別のイベントなので登録する'}
          </button>
          <button
            onClick={() => setDuplicates(null)}
            className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2.5 text-sm font-bold hover:bg-gray-200 transition-colors"
          >
            入力に戻る
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-xs text-violet-800 leading-relaxed">
        登録するとすぐに公開され、参加表明・シェアができます。
        <br />
        運営が内容を確認するまでは「<span className="font-bold">運営確認待ち</span>」と表示されます。
      </div>

      <div>
        <label className={labelClass}>イベント名 <span className="text-pink-500">*</span></label>
        <input className={inputClass} value={f.name} onChange={(e) => set('name', e.target.value)}
          placeholder="例：○○コスプレイベント 2026夏" maxLength={100} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>開催日 <span className="text-pink-500">*</span></label>
          <input type="date" className={inputClass} value={f.date} onChange={(e) => set('date', e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>地方</label>
          <select className={inputClass} value={f.region} onChange={(e) => set('region', e.target.value)}>
            <option value="">選択しない</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>会場・エリア <span className="text-pink-500">*</span></label>
        <input className={inputClass} value={f.location} onChange={(e) => set('location', e.target.value)}
          placeholder="例：東京ビッグサイト" maxLength={100} required />
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 space-y-3">
        <p className="text-xs text-gray-500">
          実在確認のため、<span className="font-bold text-gray-700">公式サイト か 公式X のどちらか</span>は必須です。
        </p>
        <div>
          <label className={labelClass}>公式サイトURL</label>
          <input type="url" className={inputClass} value={f.officialUrl} onChange={(e) => set('officialUrl', e.target.value)}
            placeholder="https://..." />
        </div>
        <div>
          <label className={labelClass}>公式XのURL</label>
          <input type="url" className={inputClass} value={f.xUrl} onChange={(e) => set('xUrl', e.target.value)}
            placeholder="https://x.com/..." />
        </div>
      </div>

      <div>
        <label className={labelClass}>ハッシュタグ</label>
        <input className={inputClass} value={f.hashtag} onChange={(e) => set('hashtag', e.target.value)}
          placeholder="例：○○コス（スペース区切りで複数可）" />
      </div>

      <div>
        <label className={labelClass}>主催</label>
        <input className={inputClass} value={f.organizer} onChange={(e) => set('organizer', e.target.value)} maxLength={100} />
      </div>

      <div>
        <label className={labelClass}>説明</label>
        <textarea className={`${inputClass} resize-none`} rows={3} value={f.description}
          onChange={(e) => set('description', e.target.value)} maxLength={1000}
          placeholder="イベントの概要・参加条件など" />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-xl py-3 font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {submitting ? '登録中...' : 'イベントを登録する'}
      </button>
      <p className="text-xs text-gray-400 text-center -mt-2">
        当サイトはイベント公式ではありません。日程・会場は必ず公式情報をご確認ください。
      </p>
    </form>
  );
}
