import type { Event } from '@/types';
import { createServerClient } from './supabase/server';
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
    .single();

  if (error || !data) return null;
  return dbToEvent(data as DBEvent);
}
