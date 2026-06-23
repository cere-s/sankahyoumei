import type { Event } from '@/types';
import { createServerClient } from './supabase/server';

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
  };
}

export async function getAllEvents(): Promise<Event[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });

  if (error) throw new Error(`イベント取得エラー: ${error.message}`);
  return (data as DBEvent[]).map(dbToEvent);
}

export async function getEventById(id: string): Promise<Event | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return dbToEvent(data as DBEvent);
}
