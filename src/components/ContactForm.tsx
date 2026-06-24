'use client';

import { useState } from 'react';
import Link from 'next/link';

const CATEGORIES = [
  { key: 'request', label: '要望' },
  { key: 'bug', label: '不具合報告' },
  { key: 'question', label: '質問' },
  { key: 'other', label: 'その他' },
];

type Status = 'idle' | 'sending' | 'done';

const inputClass =
  'w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white';

export function ContactForm() {
  const [category, setCategory] = useState('request');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setError('内容を入力してください');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message, contact }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? '送信に失敗しました');
      }
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信に失敗しました');
      setStatus('idle');
    }
  }

  if (status === 'done') {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center space-y-3">
        <div className="text-4xl">📨</div>
        <h2 className="text-lg font-bold text-gray-900">送信しました</h2>
        <p className="text-sm text-gray-500">
          お問い合わせありがとうございます。内容を確認のうえ、必要に応じて対応します。
        </p>
        <Link href="/" className="inline-block mt-2 text-sm text-violet-600 hover:underline">
          ← トップへ戻る
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">種別</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                category === c.key
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-violet-400'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          内容<span className="text-red-500 ml-0.5">*</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          maxLength={4000}
          placeholder="ご要望・ご意見・不具合の内容などをご記入ください"
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">連絡先（任意）</label>
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          maxLength={200}
          placeholder="返信が必要な場合のメール・X IDなど"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-400">
          メールアドレスを入力すると、運営者が返信できる場合があります。
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full bg-violet-600 text-white rounded-xl py-3 text-sm font-bold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {status === 'sending' ? '送信中...' : '送信する'}
      </button>
    </form>
  );
}
