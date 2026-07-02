'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Event } from '@/types';
import { formatDate } from '@/lib/utils';
import { safeHttpUrl, REGIONS } from '@/lib/validation';
import { buildEventAnnouncementText } from '@/lib/event-announcement';

const inputClass =
  'w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300';

interface EditFields {
  name: string;
  date: string;
  region: string;
  location: string;
  officialUrl: string;
  xUrl: string;
  hashtag: string;
  organizer: string;
  description: string;
}

function toFields(e: Event): EditFields {
  return {
    name: e.name,
    date: e.date,
    region: e.region ?? '',
    location: e.location,
    officialUrl: e.officialUrl ?? '',
    xUrl: e.xUrl ?? '',
    hashtag: e.hashtag ?? '',
    organizer: e.organizer ?? '',
    description: e.description ?? '',
  };
}

export function EventModeration({ events }: { events: Event[] }) {
  const [list, setList] = useState(events);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditFields | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);

  async function patch(
    id: string,
    body: Record<string, unknown>
  ): Promise<{ ok: boolean; event?: Event }> {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json.error ?? '処理に失敗しました');
        return { ok: false };
      }
      return { ok: true, event: json.event };
    } catch {
      alert('通信に失敗しました');
      return { ok: false };
    } finally {
      setBusy(null);
    }
  }

  async function publish(id: string) {
    const target = list.find((e) => e.id === id);
    const { ok } = await patch(id, { action: 'publish' });
    if (ok) {
      const published = target ? { ...target, status: 'published' as const } : null;
      setList((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'published' } : e)));
      if (published) await copyAnnouncement(published);
    }
  }

  async function remove(id: string) {
    if (!confirm('このイベントを取り下げます（一覧から消えます）。よろしいですか？')) return;
    const { ok } = await patch(id, { action: 'remove' });
    if (ok) setList((prev) => prev.filter((e) => e.id !== id));
  }

  function startEdit(e: Event) {
    setEditing(e.id);
    setDraft(toFields(e));
  }

  async function saveEdit(id: string) {
    if (!draft) return;
    const { ok, event } = await patch(id, { action: 'update', fields: draft });
    if (ok && event) {
      setList((prev) => prev.map((e) => (e.id === id ? event : e)));
      setEditing(null);
      setDraft(null);
    }
  }

  function setD<K extends keyof EditFields>(key: K, value: EditFields[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function getOrigin(): string {
    if (typeof window !== 'undefined') return window.location.origin;
    return process.env.NEXT_PUBLIC_SITE_URL ?? '';
  }

  function announcementText(e: Event): string {
    return buildEventAnnouncementText(e, getOrigin());
  }

  async function copyAnnouncement(e: Event) {
    const text = announcementText(e);
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(text);
      setCopied(e.id);
      setPreviewing(null);
      setTimeout(() => setCopied((current) => (current === e.id ? null : current)), 2000);
    } catch {
      setPreviewing(e.id);
    }
  }

  if (list.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-12">確認対象のユーザー登録イベントはありません</p>;
  }

  const pendingCount = list.filter((e) => e.status === 'pending').length;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        運営確認待ち <span className="font-bold text-amber-600">{pendingCount}</span> 件 ／ 全 {list.length} 件
      </p>
      {list.map((e) => (
        <div
          key={e.id}
          className={`rounded-xl border shadow-sm p-4 ${
            e.status === 'pending' ? 'bg-amber-50/60 border-amber-200' : 'bg-white border-gray-100'
          }`}
        >
          {editing === e.id && draft ? (
            <div className="space-y-2.5">
              <input className={inputClass} value={draft.name} onChange={(ev) => setD('name', ev.target.value)} placeholder="イベント名" />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" className={inputClass} value={draft.date} onChange={(ev) => setD('date', ev.target.value)} />
                <select className={inputClass} value={draft.region} onChange={(ev) => setD('region', ev.target.value)}>
                  <option value="">地方なし</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <input className={inputClass} value={draft.location} onChange={(ev) => setD('location', ev.target.value)} placeholder="会場" />
              <input className={inputClass} value={draft.officialUrl} onChange={(ev) => setD('officialUrl', ev.target.value)} placeholder="公式URL" />
              <input className={inputClass} value={draft.xUrl} onChange={(ev) => setD('xUrl', ev.target.value)} placeholder="公式X URL" />
              <input className={inputClass} value={draft.hashtag} onChange={(ev) => setD('hashtag', ev.target.value)} placeholder="ハッシュタグ" />
              <input className={inputClass} value={draft.organizer} onChange={(ev) => setD('organizer', ev.target.value)} placeholder="主催" />
              <textarea className={`${inputClass} resize-none`} rows={2} value={draft.description} onChange={(ev) => setD('description', ev.target.value)} placeholder="説明" />
              <div className="flex gap-2 pt-1">
                <button onClick={() => saveEdit(e.id)} disabled={busy === e.id}
                  className="bg-violet-600 text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-violet-700 disabled:opacity-50">
                  保存
                </button>
                <button onClick={() => { setEditing(null); setDraft(null); }}
                  className="border border-gray-200 text-gray-600 rounded-lg px-4 py-2 text-sm hover:bg-gray-50">
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {e.status === 'pending' ? (
                      <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-bold">確認待ち</span>
                    ) : (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">確認済み</span>
                    )}
                    <Link href={`/events/${e.id}`} className="font-bold text-gray-900 hover:text-violet-600 hover:underline">
                      {e.name}
                    </Link>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(e.date)}{e.region ? `・${e.region}` : ''}・{e.location}
                  </p>
                  {safeHttpUrl(e.officialUrl) && (
                    <a href={safeHttpUrl(e.officialUrl)!} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-600 hover:underline break-all">
                      {e.officialUrl}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {e.status === 'pending' && (
                  <button onClick={() => publish(e.id)} disabled={busy === e.id}
                    className="bg-emerald-600 text-white rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-emerald-700 disabled:opacity-50">
                    確認済みにする
                  </button>
                )}
                {e.status === 'published' && (
                  <>
                    <button onClick={() => copyAnnouncement(e)}
                      className="bg-violet-600 text-white rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-violet-700">
                      {copied === e.id ? '告知文面をコピーしました' : '告知文面をコピー'}
                    </button>
                    <button onClick={() => setPreviewing((current) => (current === e.id ? null : e.id))}
                      className="border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-gray-50">
                      {previewing === e.id ? '文面を閉じる' : '文面を確認'}
                    </button>
                  </>
                )}
                <button onClick={() => startEdit(e)}
                  className="border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-gray-50">
                  修正
                </button>
                <button onClick={() => remove(e.id)} disabled={busy === e.id}
                  className="border border-red-200 text-red-600 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-red-50 disabled:opacity-50">
                  取り下げ
                </button>
              </div>
              {previewing === e.id && (
                <div className="mt-3">
                  <textarea
                    readOnly
                    value={announcementText(e)}
                    rows={9}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
                    onClick={(ev) => ev.currentTarget.select()}
                  />
                  <p className="text-xs text-gray-400 mt-1">コピーできない場合は、テキストを選択して手動でコピーできます</p>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
