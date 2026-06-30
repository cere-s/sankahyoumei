'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ReceivedInteraction, SentInteraction, InteractionParty } from '@/types';
import { INTERACTION_LABELS } from '@/lib/utils';

interface Props {
  received: ReceivedInteraction[];
  sent: SentInteraction[];
  blocked: InteractionParty[];
}

type Tab = 'received' | 'sent' | 'blocked';

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });
}

function PartyName({ party }: { party: InteractionParty }) {
  const name = party.displayName || (party.xUsername ? `@${party.xUsername}` : '名前未設定のユーザー');
  return <span className="font-bold text-gray-900">{name}</span>;
}

/** Xで連絡する／プロフィールを見る（ユーザー名がある時のみ） */
function PartyLinks({ party }: { party: InteractionParty }) {
  if (!party.xUsername) return null;
  return (
    <>
      <Link
        href={`/participants/${encodeURIComponent(party.xUsername)}`}
        className="text-xs text-violet-600 hover:underline"
      >
        プロフィールを見る
      </Link>
      <a
        href={`https://x.com/${party.xUsername}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-gray-700 hover:underline"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Xで連絡する
      </a>
    </>
  );
}

export function InteractionInbox({ received, sent, blocked }: Props) {
  const [tab, setTab] = useState<Tab>('received');
  const [recv, setRecv] = useState(received);
  const [sentList, setSentList] = useState(sent);
  const [blockedList, setBlockedList] = useState(blocked);
  const [busy, setBusy] = useState<string | null>(null);

  async function post(url: string, body: Record<string, unknown>): Promise<boolean> {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function hide(intentId: string) {
    setBusy(intentId);
    if (await post('/api/interactions/hide', { intentId })) {
      setRecv((prev) => prev.filter((r) => r.id !== intentId));
    }
    setBusy(null);
  }

  async function block(userId: string) {
    setBusy(userId);
    if (await post('/api/interactions/block', { blockedUserId: userId })) {
      // 届いた・送った一覧から該当ユーザーを除外し、ブロック中に追加
      const party =
        recv.find((r) => r.from.userId === userId)?.from ??
        sentList.find((s) => s.to.userId === userId)?.to ??
        { userId };
      setRecv((prev) => prev.filter((r) => r.from.userId !== userId));
      setSentList((prev) => prev.filter((s) => s.to.userId !== userId));
      setBlockedList((prev) => (prev.some((p) => p.userId === userId) ? prev : [...prev, party]));
    }
    setBusy(null);
  }

  async function unblock(userId: string) {
    setBusy(userId);
    if (await post('/api/interactions/unblock', { blockedUserId: userId })) {
      setBlockedList((prev) => prev.filter((p) => p.userId !== userId));
    }
    setBusy(null);
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'received', label: '届いた', count: recv.length },
    { key: 'sent', label: '送った', count: sentList.length },
    { key: 'blocked', label: 'ブロック中', count: blockedList.length },
  ];

  return (
    <section className="mb-8">
      <h2 className="text-base font-bold text-gray-800 mb-1">交流</h2>
      <p className="text-xs text-gray-400 mb-3">
        「撮りたい・撮られたい・交流したい」の意思表示です。連絡はXで行ってください。
      </p>

      {/* タブ */}
      <div className="flex gap-2 mb-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-xs px-3.5 py-1.5 rounded-full border font-bold transition-colors ${
              tab === t.key
                ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white border-transparent'
                : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
            }`}
          >
            {t.label}
            <span className={tab === t.key ? 'text-white/70 ml-1' : 'text-gray-400 ml-1'}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* 届いた */}
      {tab === 'received' && (
        <div className="space-y-2">
          {recv.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8 bg-white rounded-xl border border-gray-100">
              まだ届いた意思表示はありません
            </p>
          ) : (
            recv.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5">
                <div className="flex items-start gap-3">
                  {r.from.avatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.from.avatarUrl} alt="" className="w-9 h-9 rounded-full shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700">
                      <PartyName party={r.from} />
                      <span className="text-gray-500"> さんから「{INTERACTION_LABELS[r.intentType]}」</span>
                    </p>
                    {r.eventName && <p className="text-xs text-violet-600 mt-0.5 line-clamp-1">{r.eventName}</p>}
                    <p className="text-[11px] text-gray-400 mt-0.5">{formatDateTime(r.createdAt)}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                      <PartyLinks party={r.from} />
                      <button
                        onClick={() => hide(r.id)}
                        disabled={busy === r.id}
                        className="text-xs text-gray-500 hover:underline disabled:opacity-50"
                      >
                        非表示
                      </button>
                      <button
                        onClick={() => block(r.from.userId)}
                        disabled={busy === r.from.userId}
                        className="text-xs text-red-500 hover:underline disabled:opacity-50"
                      >
                        ブロック
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 送った */}
      {tab === 'sent' && (
        <div className="space-y-2">
          {sentList.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8 bg-white rounded-xl border border-gray-100">
              まだ送った意思表示はありません
            </p>
          ) : (
            sentList.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5">
                <div className="flex items-start gap-3">
                  {s.to.avatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.to.avatarUrl} alt="" className="w-9 h-9 rounded-full shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700">
                      <PartyName party={s.to} />
                      <span className="text-gray-500"> さんへ「{INTERACTION_LABELS[s.intentType]}」</span>
                    </p>
                    {s.eventName && <p className="text-xs text-violet-600 mt-0.5 line-clamp-1">{s.eventName}</p>}
                    <p className="text-[11px] text-gray-400 mt-0.5">{formatDateTime(s.createdAt)}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                      <PartyLinks party={s.to} />
                      <button
                        onClick={() => block(s.to.userId)}
                        disabled={busy === s.to.userId}
                        className="text-xs text-red-500 hover:underline disabled:opacity-50"
                      >
                        ブロック
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ブロック中 */}
      {tab === 'blocked' && (
        <div className="space-y-2">
          {blockedList.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8 bg-white rounded-xl border border-gray-100">
              ブロック中のユーザーはいません
            </p>
          ) : (
            blockedList.map((p) => (
              <div
                key={p.userId}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <PartyName party={p} />
                  {p.xUsername && <span className="text-xs text-gray-400 ml-1">@{p.xUsername}</span>}
                </div>
                <button
                  onClick={() => unblock(p.userId)}
                  disabled={busy === p.userId}
                  className="text-xs text-violet-600 hover:underline disabled:opacity-50 shrink-0"
                >
                  ブロック解除
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
