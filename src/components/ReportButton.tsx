'use client';

import { useState } from 'react';

interface Props {
  entryId: string;
  displayName: string;
}

const REASONS = [
  { key: 'impersonation', label: 'なりすまし' },
  { key: 'inappropriate', label: '不適切な内容' },
  { key: 'other', label: 'その他' },
];

type Status = 'idle' | 'sending' | 'done';

export function ReportButton({ entryId, displayName }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('impersonation');
  const [details, setDetails] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  function close() {
    if (status === 'sending') return;
    setOpen(false);
    // 閉じたら入力をリセット（送信済みも含む）
    setTimeout(() => {
      setStatus('idle');
      setReason('impersonation');
      setDetails('');
      setReporterContact('');
      setError('');
    }, 200);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, reason, details, reporterContact }),
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-gray-400 hover:text-red-500 hover:underline"
      >
        この参加表明を通報する
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={close}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5"
            onClick={(e) => e.stopPropagation()}
          >
            {status === 'done' ? (
              <div className="text-center py-6 space-y-3">
                <div className="text-4xl">📨</div>
                <h2 className="text-lg font-bold text-gray-900">通報を受け付けました</h2>
                <p className="text-sm text-gray-500">
                  ご報告ありがとうございます。運営者が内容を確認します。
                </p>
                <button
                  onClick={close}
                  className="mt-2 w-full bg-violet-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-violet-700 transition-colors"
                >
                  閉じる
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-bold text-gray-900">参加表明を通報</h2>
                  <button type="button" onClick={close} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
                    ×
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  対象：<span className="font-medium text-gray-700">{displayName}</span> の参加表明
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">通報理由</label>
                  <div className="flex flex-col gap-2">
                    {REASONS.map((r) => (
                      <label
                        key={r.key}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm cursor-pointer transition-colors ${
                          reason === r.key
                            ? 'border-violet-400 bg-violet-50 text-violet-800'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="report-reason"
                          value={r.key}
                          checked={reason === r.key}
                          onChange={() => setReason(r.key)}
                          className="accent-violet-600"
                        />
                        {r.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">詳細</label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={4}
                    maxLength={2000}
                    placeholder="状況や、なりすましと判断した理由などをご記入ください"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    あなたの連絡先（任意）
                  </label>
                  <input
                    type="text"
                    value={reporterContact}
                    onChange={(e) => setReporterContact(e.target.value)}
                    maxLength={200}
                    placeholder="返信が必要な場合のメール・X IDなど"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
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
                  className="w-full bg-red-600 text-white rounded-xl py-3 text-sm font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {status === 'sending' ? '送信中...' : '通報する'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
