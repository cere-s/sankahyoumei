import type { Event, EventStatus } from '@/types';
import { createServerClient, createAdminClient, createAuthServerClient } from './supabase/server';
import { DEMO, demoEvents, demoGetEventById } from './demo';

interface DBEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  official_url: string | null;
  hashtag: string;
  description: string | null;
  source_site: string | null;
  source_url: string | null;
  external_id: string | null;
  is_imported: boolean | null;
  organizer: string | null;
  address: string | null;
  x_url: string | null;
  region: string | null;
  status: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function dbToEvent(row: DBEvent): Event {
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    location: row.location,
    officialUrl: row.official_url ?? '',
    hashtag: row.hashtag,
    description: row.description ?? '',
    isImported: row.is_imported ?? false,
    sourceSite: row.source_site ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    organizer: row.organizer ?? undefined,
    address: row.address ?? undefined,
    xUrl: row.x_url ?? undefined,
    region: row.region ?? undefined,
    status: (row.status as EventStatus | null) ?? 'published',
    createdBy: row.created_by ?? undefined,
  };
}

export async function getAllEvents(): Promise<Event[]> {
  if (DEMO) return [...demoEvents].sort((a, b) => a.date.localeCompare(b.date));
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });

  if (error) throw new Error(`イベント取得エラー: ${error.message}`);
  return (data as DBEvent[]).map(dbToEvent);
}

/** 複数IDのイベントをまとめて取得（N+1回避） */
export async function getEventsByIds(ids: string[]): Promise<Map<string, Event>> {
  const map = new Map<string, Event>();
  const unique = [...new Set(ids)];
  if (unique.length === 0) return map;

  if (DEMO) {
    for (const id of unique) {
      const e = demoGetEventById(id);
      if (e) map.set(e.id, e);
    }
    return map;
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.from('events').select('*').in('id', unique);
  if (error) throw new Error(`イベント取得エラー: ${error.message}`);
  for (const row of (data as DBEvent[]) ?? []) {
    const e = dbToEvent(row);
    map.set(e.id, e);
  }
  return map;
}

export async function getEventById(id: string): Promise<Event | null> {
  if (DEMO) return demoGetEventById(id);
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .neq('status', 'removed')
    .single();

  if (error || !data) return null;
  return dbToEvent(data as DBEvent);
}

// ============================================================
// ユーザーによるイベント登録（仮登録）と運営モデレーション
// ============================================================

export interface CreateEventInput {
  name: string;
  date: string;
  location: string;
  region?: string;
  officialUrl?: string;
  xUrl?: string;
  hashtag?: string;
  description?: string;
  organizer?: string;
  address?: string;
}

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '');
}

/** 同じ日付で名前が近い既存イベント（removed以外）を返す。重複登録の警告に使う */
export async function findDuplicateEvents(name: string, date: string): Promise<Event[]> {
  if (DEMO) return [];
  const trimmed = name.trim();
  if (!trimmed || !date) return [];
  const supabase = createServerClient();
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('date', date)
    .neq('status', 'removed')
    .limit(50);
  const target = normalizeName(trimmed);
  return ((data as DBEvent[]) ?? [])
    .map(dbToEvent)
    .filter((e) => {
      const n = normalizeName(e.name);
      return n.includes(target) || target.includes(n);
    });
}

/** 仮登録イベントを作成（ログイン本人のセッションで insert、RLS: created_by=auth.uid() かつ status=pending） */
export async function createEvent(input: CreateEventInput, userId: string): Promise<Event> {
  if (DEMO) {
    return {
      id: `demo-event-${Math.random().toString(36).slice(2, 10)}`,
      name: input.name,
      date: input.date,
      location: input.location,
      officialUrl: input.officialUrl ?? '',
      hashtag: input.hashtag ?? '',
      description: input.description ?? '',
      region: input.region,
      organizer: input.organizer,
      address: input.address,
      xUrl: input.xUrl,
      status: 'pending',
      createdBy: userId,
    };
  }
  const supabase = await createAuthServerClient();
  const { data, error } = await supabase
    .from('events')
    .insert({
      name: input.name,
      date: input.date,
      location: input.location,
      region: input.region || null,
      official_url: input.officialUrl || null,
      x_url: input.xUrl || null,
      hashtag: input.hashtag || '',
      description: input.description || null,
      organizer: input.organizer || null,
      address: input.address || null,
      status: 'pending',
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw new Error(`イベント登録エラー: ${error.message}`);
  return dbToEvent(data as DBEvent);
}

/** モデレーション用：全ステータスを取得（運営確認待ちを先頭に） */
export async function getEventsForModeration(): Promise<Event[]> {
  if (DEMO) return [];
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('events')
    .select('*')
    .neq('status', 'removed')
    .not('created_by', 'is', null)
    .order('status', { ascending: true }) // pending < published
    .order('created_at', { ascending: false });
  if (error) throw new Error(`イベント取得エラー: ${error.message}`);
  return (data as DBEvent[]).map(dbToEvent);
}

/** 運営が確認済みに昇格／取り下げ（論理削除） */
export async function setEventStatusAdmin(id: string, status: EventStatus): Promise<void> {
  if (DEMO) return;
  const admin = createAdminClient();
  const { error } = await admin
    .from('events')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(`状態更新エラー: ${error.message}`);
}

export interface UpdateEventInput {
  name?: string;
  date?: string;
  location?: string;
  region?: string;
  officialUrl?: string;
  xUrl?: string;
  hashtag?: string;
  description?: string;
  organizer?: string;
  address?: string;
  status?: EventStatus;
}

/** 運営による修正（日付・URLミスなど）。任意項目のみ更新 */
export async function updateEventAdmin(id: string, input: UpdateEventInput): Promise<Event> {
  if (DEMO) return (await getEventById(id))!;
  const admin = createAdminClient();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) update.name = input.name;
  if (input.date !== undefined) update.date = input.date;
  if (input.location !== undefined) update.location = input.location;
  if (input.region !== undefined) update.region = input.region || null;
  if (input.officialUrl !== undefined) update.official_url = input.officialUrl || null;
  if (input.xUrl !== undefined) update.x_url = input.xUrl || null;
  if (input.hashtag !== undefined) update.hashtag = input.hashtag || '';
  if (input.description !== undefined) update.description = input.description || null;
  if (input.organizer !== undefined) update.organizer = input.organizer || null;
  if (input.address !== undefined) update.address = input.address || null;
  if (input.status !== undefined) update.status = input.status;

  const { data, error } = await admin.from('events').update(update).eq('id', id).select().single();
  if (error) throw new Error(`イベント更新エラー: ${error.message}`);
  return dbToEvent(data as DBEvent);
}

/** イベントに紐づく（非表示でない）参加表明の件数 */
export async function getEventEntryCount(id: string): Promise<number> {
  if (DEMO) return 0;
  const admin = createAdminClient();
  const { count } = await admin
    .from('participation_entries')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id)
    .eq('is_hidden', false);
  return count ?? 0;
}

/** 登録者本人による取り下げ。自分の仮登録イベントで、参加表明が0件のときだけ物理削除する */
export async function withdrawOwnEvent(
  id: string,
  userId: string
): Promise<{ ok: true } | { ok: false; reason: 'not_found' | 'forbidden' | 'has_entries' | 'not_pending' }> {
  if (DEMO) return { ok: true };
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('events')
    .select('created_by, status')
    .eq('id', id)
    .single();
  if (error || !data) return { ok: false, reason: 'not_found' };
  const row = data as { created_by: string | null; status: string };
  if (row.created_by !== userId) return { ok: false, reason: 'forbidden' };
  if (row.status !== 'pending') return { ok: false, reason: 'not_pending' };
  if ((await getEventEntryCount(id)) > 0) return { ok: false, reason: 'has_entries' };

  const { error: delErr } = await admin.from('events').delete().eq('id', id);
  if (delErr) return { ok: false, reason: 'not_found' };
  return { ok: true };
}

/** 自分が登録したイベント一覧（マイページ用、removed除外） */
export async function getEventsByCreator(userId: string): Promise<Event[]> {
  if (DEMO) return [];
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('events')
    .select('*')
    .eq('created_by', userId)
    .neq('status', 'removed')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data as DBEvent[]).map(dbToEvent);
}
