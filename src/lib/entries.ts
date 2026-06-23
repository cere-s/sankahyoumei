import type {
  ParticipationEntry,
  ParticipationType,
  CosplayShootingStatus,
  PhotographerFirstMeetStatus,
  PhotographerShootingStyle,
  CreateEntryResult,
} from '@/types';
import { createServerClient, createAdminClient } from './supabase/server';
import { generateToken, hashToken } from './token';

interface DBEntry {
  id: string;
  event_id: string;
  display_name: string;
  x_id: string;
  participation_type: string;
  participation_day: string;
  work_name: string | null;
  character_name: string | null;
  shooting_status: string | null;
  photographer_target_works: string | null;
  photographer_available_time: string | null;
  photographer_availability: string | null;
  portfolio_url: string | null;
  shooting_style: string[] | null;
  image_url: string | null;
  comment: string | null;
  note: string | null;
  edit_token_hash: string | null;
  delete_password_hash: string | null;
  user_id: string | null;
  is_verified_x: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

function dbToEntry(row: DBEntry): ParticipationEntry {
  const entry: ParticipationEntry = {
    id: row.id,
    eventId: row.event_id,
    displayName: row.display_name,
    xId: row.x_id,
    participationType: row.participation_type as ParticipationType,
    participationDate: row.participation_day,
    comment: row.comment ?? '',
    note: row.note ?? undefined,
    imageUrl: row.image_url ?? undefined,
    createdAt: row.created_at,
  };

  if (row.participation_type === 'cosplay') {
    entry.cosplayInfo = {
      workName: row.work_name ?? '',
      characterName: row.character_name ?? '',
      shootingStatus: (row.shooting_status ?? 'greeting_welcome') as CosplayShootingStatus,
    };
  }

  if (row.participation_type === 'photographer') {
    entry.photographerInfo = {
      targetWorks: row.photographer_target_works ?? '',
      availableHours: row.photographer_available_time ?? '',
      firstMeetStatus: (row.photographer_availability ?? 'negotiable') as PhotographerFirstMeetStatus,
      portfolioUrl: row.portfolio_url ?? '',
      shootingStyles: (row.shooting_style ?? []) as PhotographerShootingStyle[],
    };
  }

  return entry;
}

export async function getRecentEntries(limit = 10): Promise<ParticipationEntry[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('participation_entries')
    .select('*')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`参加表明取得エラー: ${error.message}`);
  return (data as DBEntry[]).map(dbToEntry);
}

export async function getEntriesByXId(xId: string): Promise<ParticipationEntry[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('participation_entries')
    .select('*')
    .eq('x_id', xId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`参加表明取得エラー: ${error.message}`);
  return (data as DBEntry[]).map(dbToEntry);
}

export async function getEntriesByEventId(eventId: string): Promise<ParticipationEntry[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('participation_entries')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`参加表明取得エラー: ${error.message}`);
  return (data as DBEntry[]).map(dbToEntry);
}

export async function getEntryById(id: string): Promise<ParticipationEntry | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('participation_entries')
    .select('*')
    .eq('id', id)
    .eq('is_hidden', false)
    .single();

  if (error || !data) return null;
  return dbToEntry(data as DBEntry);
}

export interface CreateEntryInput {
  eventId: string;
  displayName: string;
  xId: string;
  participationType: ParticipationType;
  participationDate: string;
  comment: string;
  note?: string;
  imageUrl?: string;
  deletePassword?: string;
  cosplayInfo?: ParticipationEntry['cosplayInfo'];
  photographerInfo?: ParticipationEntry['photographerInfo'];
}

export async function createEntry(input: CreateEntryInput): Promise<CreateEntryResult> {
  const supabase = createServerClient();
  const editToken = generateToken();

  const insertData = {
    event_id: input.eventId,
    display_name: input.displayName,
    x_id: input.xId,
    participation_type: input.participationType,
    participation_day: input.participationDate,
    comment: input.comment || null,
    note: input.note || null,
    image_url: input.imageUrl || null,
    edit_token_hash: hashToken(editToken),
    delete_password_hash: input.deletePassword ? hashToken(input.deletePassword) : null,
    // cosplay
    work_name: input.cosplayInfo?.workName || null,
    character_name: input.cosplayInfo?.characterName || null,
    shooting_status: input.cosplayInfo?.shootingStatus || null,
    // photographer
    photographer_target_works: input.photographerInfo?.targetWorks || null,
    photographer_available_time: input.photographerInfo?.availableHours || null,
    photographer_availability: input.photographerInfo?.firstMeetStatus || null,
    portfolio_url: input.photographerInfo?.portfolioUrl || null,
    shooting_style: input.photographerInfo?.shootingStyles?.length
      ? input.photographerInfo.shootingStyles
      : null,
  };

  const { data, error } = await supabase
    .from('participation_entries')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(`参加表明作成エラー: ${error.message}`);
  return { entry: dbToEntry(data as DBEntry), editToken };
}

export interface UpdateEntryInput {
  token: string;
  comment?: string;
  participationDate?: string;
  cosplayInfo?: ParticipationEntry['cosplayInfo'];
  photographerInfo?: ParticipationEntry['photographerInfo'];
}

export async function updateEntry(
  entryId: string,
  input: UpdateEntryInput
): Promise<ParticipationEntry> {
  const admin = createAdminClient();

  // トークン検証
  const { data: existing, error: fetchError } = await admin
    .from('participation_entries')
    .select('edit_token_hash')
    .eq('id', entryId)
    .single();

  if (fetchError || !existing) throw new Error('参加表明が見つかりません');
  if ((existing as { edit_token_hash: string }).edit_token_hash !== hashToken(input.token)) {
    throw new Error('編集権限がありません');
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.comment !== undefined) updateData.comment = input.comment || null;
  if (input.participationDate) updateData.participation_day = input.participationDate;
  if (input.cosplayInfo) {
    updateData.work_name = input.cosplayInfo.workName || null;
    updateData.character_name = input.cosplayInfo.characterName || null;
    updateData.shooting_status = input.cosplayInfo.shootingStatus || null;
  }
  if (input.photographerInfo) {
    updateData.photographer_target_works = input.photographerInfo.targetWorks || null;
    updateData.photographer_available_time = input.photographerInfo.availableHours || null;
    updateData.photographer_availability = input.photographerInfo.firstMeetStatus || null;
    updateData.portfolio_url = input.photographerInfo.portfolioUrl || null;
    updateData.shooting_style = input.photographerInfo.shootingStyles?.length
      ? input.photographerInfo.shootingStyles
      : null;
  }

  const { data, error } = await admin
    .from('participation_entries')
    .update(updateData)
    .eq('id', entryId)
    .select()
    .single();

  if (error) throw new Error(`更新エラー: ${error.message}`);
  return dbToEntry(data as DBEntry);
}

export async function hideEntry(entryId: string, token: string): Promise<void> {
  const admin = createAdminClient();

  const { data: existing, error: fetchError } = await admin
    .from('participation_entries')
    .select('edit_token_hash')
    .eq('id', entryId)
    .single();

  if (fetchError || !existing) throw new Error('参加表明が見つかりません');
  if ((existing as { edit_token_hash: string }).edit_token_hash !== hashToken(token)) {
    throw new Error('削除権限がありません');
  }

  const { error } = await admin
    .from('participation_entries')
    .update({ is_hidden: true, updated_at: new Date().toISOString() })
    .eq('id', entryId);

  if (error) throw new Error(`削除エラー: ${error.message}`);
}
