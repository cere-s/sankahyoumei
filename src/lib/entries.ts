import type {
  ParticipationEntry,
  ParticipationType,
  CreateEntryResult,
  CosplayPlan,
  ShootingTarget,
  TimeBand,
  GreetingLevel,
  ShootingPolicy,
} from '@/types';
import { createServerClient, createAdminClient, createAuthServerClient } from './supabase/server';
import { getEntryPlans, computePopularTags, type TagCount } from './utils';
import { generateToken, hashToken } from './token';
import { verifyTweetForXId } from './tweet';
import { type DBEntry, dbToEntry, parsePlans } from './entries/mapper';
import { canEditEntry } from './entries/authz';
import {
  DEMO,
  demoEntries,
  demoGetEntryById,
  demoCountsByEvent,
  demoCosplaySuggestions,
} from './demo';

/** 保存用に撮りたい作品配列を整形。空なら null */
function cleanTargetsForStorage(targets?: ShootingTarget[]): ShootingTarget[] | null {
  if (!targets?.length) return null;
  const cleaned = targets
    .map((p) => {
      const o: ShootingTarget = { workTitle: (p.workTitle ?? '').trim() };
      if (p.characterName?.trim()) o.characterName = p.characterName.trim();
      if (p.timeSlot?.trim()) o.timeSlot = p.timeSlot.trim();
      if (p.memo?.trim()) o.memo = p.memo.trim();
      return o;
    })
    .filter((p) => p.workTitle);
  return cleaned.length ? cleaned : null;
}

/** 保存用に予定配列を整形（trim・空項目除去・空予定の除去）。空なら null */
function cleanPlansForStorage(plans?: CosplayPlan[]): CosplayPlan[] | null {
  if (!plans?.length) return null;
  const cleaned = plans
    .map((p) => {
      const o: CosplayPlan = {
        workTitle: (p.workTitle ?? '').trim(),
        characterName: (p.characterName ?? '').trim(),
      };
      if (p.costumeLabel?.trim()) o.costumeLabel = p.costumeLabel.trim();
      if (p.timeSlot?.trim()) o.timeSlot = p.timeSlot.trim();
      if (p.planMemo?.trim()) o.planMemo = p.planMemo.trim();
      if (p.imageUrl?.trim()) o.imageUrl = p.imageUrl.trim();
      return o;
    })
    .filter((p) => p.workTitle || p.characterName);
  return cleaned.length ? cleaned : null;
}

export async function getRecentEntries(limit = 10): Promise<ParticipationEntry[]> {
  if (DEMO) {
    return [...demoEntries]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }
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

/** イベントごとの参加表明数を集計して { eventId: 件数 } で返す */
export async function getEntryCountsByEvent(): Promise<Record<string, number>> {
  if (DEMO) return demoCountsByEvent();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('participation_entries')
    .select('event_id')
    .eq('is_hidden', false);

  if (error) {
    console.error('getEntryCountsByEvent failed:', error);
    return {};
  }

  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { event_id: string }[]) {
    counts[row.event_id] = (counts[row.event_id] ?? 0) + 1;
  }
  return counts;
}

export interface CosplaySuggestions {
  /** 登録済みの作品名（重複排除・五十音/出現順） */
  works: string[];
  /** 作品名ごとのキャラ名候補 */
  charactersByWork: Record<string, string[]>;
  /** 全キャラ名候補（作品未一致時のフォールバック） */
  allCharacters: string[];
}

/** 既存のコスプレ参加表明から作品名・キャラ名のサジェスト候補を集計する */
export async function getCosplaySuggestions(): Promise<CosplaySuggestions> {
  if (DEMO) return demoCosplaySuggestions();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('participation_entries')
    .select('work_name, character_name, cosplay_plans')
    .eq('participation_type', 'cosplay')
    .eq('is_hidden', false);

  if (error) {
    console.error('getCosplaySuggestions failed:', error);
    return { works: [], charactersByWork: {}, allCharacters: [] };
  }

  const works = new Set<string>();
  const allCharacters = new Set<string>();
  const charSetByWork = new Map<string, Set<string>>();

  type Row = { work_name: string | null; character_name: string | null; cosplay_plans: unknown };
  for (const row of (data ?? []) as Row[]) {
    // 予定（複数）を正規化し、各予定の作品・キャラを集計
    const plans = parsePlans(row.cosplay_plans, row.work_name, row.character_name);
    for (const p of plans) {
      const work = p.workTitle?.trim();
      const char = p.characterName?.trim();
      if (work) works.add(work);
      if (char) allCharacters.add(char);
      if (work && char) {
        if (!charSetByWork.has(work)) charSetByWork.set(work, new Set());
        charSetByWork.get(work)!.add(char);
      }
    }
  }

  const charactersByWork: Record<string, string[]> = {};
  for (const [work, set] of charSetByWork) {
    charactersByWork[work] = [...set].sort((a, b) => a.localeCompare(b, 'ja'));
  }

  return {
    works: [...works].sort((a, b) => a.localeCompare(b, 'ja')),
    charactersByWork,
    allCharacters: [...allCharacters].sort((a, b) => a.localeCompare(b, 'ja')),
  };
}

/** トップページ「作品・キャラで探す」用の人気チップ（人数の多い順、上位limit件） */
export async function getPopularCosplayTags(limit = 10): Promise<{ works: TagCount[]; characters: TagCount[] }> {
  if (DEMO) {
    const { works, characters } = computePopularTags(demoEntries.filter((e) => e.participationType === 'cosplay'));
    return { works: works.slice(0, limit), characters: characters.slice(0, limit) };
  }
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('participation_entries')
    .select('work_name, character_name, cosplay_plans')
    .eq('participation_type', 'cosplay')
    .eq('is_hidden', false);

  if (error) {
    console.error('getPopularCosplayTags failed:', error);
    return { works: [], characters: [] };
  }

  const workPeople = new Map<string, number>();
  const charPeople = new Map<string, number>();
  type Row = { work_name: string | null; character_name: string | null; cosplay_plans: unknown };
  for (const row of (data ?? []) as Row[]) {
    const plans = parsePlans(row.cosplay_plans, row.work_name, row.character_name);
    const works = new Set(plans.map((p) => p.workTitle.trim()).filter(Boolean));
    const chars = new Set(plans.map((p) => p.characterName.trim()).filter(Boolean));
    for (const w of works) workPeople.set(w, (workPeople.get(w) ?? 0) + 1);
    for (const c of chars) charPeople.set(c, (charPeople.get(c) ?? 0) + 1);
  }
  const sort = (m: Map<string, number>): TagCount[] =>
    [...m.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ja'))
      .slice(0, limit);

  return { works: sort(workPeople), characters: sort(charPeople) };
}

export interface SearchCosplayParams {
  /** 作品名（部分一致） */
  work?: string;
  /** キャラ名（部分一致） */
  character?: string;
  /** 最大取得件数（既定100） */
  limit?: number;
}

/** 検索用の正規化（小文字化・空白除去）。イベント検索と揃える */
function searchNormalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '');
}

/**
 * コスプレ参加表明を作品名・キャラ名で横断検索する（MVP: サーバー側で取得後に部分一致フィルタ）。
 * cosplay_plans を主対象にしつつ、旧 work_name / character_name も getEntryPlans() 経由で拾う。
 * work と character の両方が指定された場合は、同一の予定が両方に一致する必要がある。
 */
export async function searchCosplayEntries(params: SearchCosplayParams): Promise<ParticipationEntry[]> {
  const work = searchNormalize((params.work ?? '').trim());
  const character = searchNormalize((params.character ?? '').trim());
  const limit = params.limit ?? 100;
  if (!work && !character) return [];

  const matches = (entry: ParticipationEntry): boolean =>
    getEntryPlans(entry).some((p) => {
      const workOk = !work || searchNormalize(p.workTitle).includes(work);
      const charOk = !character || searchNormalize(p.characterName).includes(character);
      return workOk && charOk;
    });

  if (DEMO) {
    return demoEntries
      .filter((e) => e.participationType === 'cosplay' && matches(e))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('participation_entries')
    .select('*')
    .eq('participation_type', 'cosplay')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`参加表明検索エラー: ${error.message}`);
  return (data as DBEntry[]).map(dbToEntry).filter(matches).slice(0, limit);
}

export async function getEntriesByUserId(userId: string): Promise<ParticipationEntry[]> {
  if (DEMO) {
    return demoEntries
      .filter((e) => e.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('participation_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`参加表明取得エラー: ${error.message}`);
  return (data as DBEntry[]).map(dbToEntry);
}

export async function getEntriesByXId(xId: string): Promise<ParticipationEntry[]> {
  if (DEMO) {
    return demoEntries
      .filter((e) => e.xId === xId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
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
  if (DEMO) {
    return demoEntries
      .filter((e) => e.eventId === eventId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
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
  if (DEMO) return demoGetEntryById(id);
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

/** 複数IDの参加表明をまとめて取得（N+1回避）。運営集計用途で非表示も含める。 */
export async function getEntriesByIds(ids: string[]): Promise<Map<string, ParticipationEntry>> {
  const map = new Map<string, ParticipationEntry>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return map;

  if (DEMO) {
    for (const id of unique) {
      const e = demoGetEntryById(id);
      if (e) map.set(e.id, e);
    }
    return map;
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('participation_entries')
    .select('*')
    .in('id', unique);

  if (error) throw new Error(`参加表明取得エラー: ${error.message}`);
  for (const row of (data as DBEntry[]) ?? []) {
    const e = dbToEntry(row);
    map.set(e.id, e);
  }
  return map;
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
  tweetUrl?: string;
  deletePassword?: string;
  cosplayInfo?: ParticipationEntry['cosplayInfo'];
  cosplayPlans?: CosplayPlan[];
  photographerInfo?: ParticipationEntry['photographerInfo'];
  shootingTargets?: ShootingTarget[];
  timeBand?: TimeBand;
  greetingLevel?: GreetingLevel;
  shootingPolicy?: ShootingPolicy;
  likedWorks?: string;
  wantWorks?: string;
  /** プロフィール/ポートフォリオURL（全スタイル共通） */
  portfolioUrl?: string;
  // Xログイン由来（必須：なりすまし防止のためログイン必須）
  userId: string;
  xUserId?: string;
  xUsernameSnapshot?: string;
}

export async function createEntry(input: CreateEntryInput): Promise<CreateEntryResult> {
  if (DEMO) {
    const entry: ParticipationEntry = {
      id: `demo-new-${Math.random().toString(36).slice(2, 10)}`,
      eventId: input.eventId,
      displayName: input.displayName,
      xId: input.xId,
      participationType: input.participationType,
      participationDate: input.participationDate,
      comment: input.comment ?? '',
      note: input.note,
      imageUrl: input.imageUrl,
      userId: input.userId,
      xUsernameSnapshot: input.xUsernameSnapshot,
      authStatus: 'verified_x',
      cosplayInfo: input.cosplayInfo,
      cosplayPlans: input.cosplayPlans?.length ? input.cosplayPlans : input.cosplayInfo ? [{ workTitle: input.cosplayInfo.workName, characterName: input.cosplayInfo.characterName }] : undefined,
      photographerInfo: input.photographerInfo,
      shootingTargets: input.shootingTargets,
      timeBand: input.timeBand,
      greetingLevel: input.greetingLevel,
      shootingPolicy: input.shootingPolicy,
      likedWorks: input.likedWorks,
      wantWorks: input.wantWorks,
      createdAt: new Date().toISOString(),
    };
    return { entry, editToken: 'demo-token' };
  }
  // 本人のセッションで insert（RLS: auth.uid() = user_id を満たす）
  const supabase = await createAuthServerClient();
  const editToken = generateToken();

  // ツイートURLがあれば「投稿者 = X ID」を検証
  let tweetUrl: string | null = null;
  let isVerifiedX = false;
  if (input.tweetUrl) {
    const result = await verifyTweetForXId(input.tweetUrl, input.xId);
    if (!result.ok) throw new Error(result.error);
    tweetUrl = result.normalizedUrl;
    isVerifiedX = true;
  }

  const insertData = {
    event_id: input.eventId,
    display_name: input.displayName,
    x_id: input.xId,
    participation_type: input.participationType,
    participation_day: input.participationDate,
    comment: input.comment || null,
    note: input.note || null,
    image_url: input.imageUrl || null,
    tweet_url: tweetUrl,
    is_verified_x: isVerifiedX,
    user_id: input.userId,
    x_user_id: input.xUserId ?? null,
    x_username_snapshot: input.xUsernameSnapshot ?? null,
    auth_status: 'verified_x',
    edit_token_hash: hashToken(editToken),
    delete_password_hash: input.deletePassword ? hashToken(input.deletePassword) : null,
    // cosplay（cosplay_plans が本体。work_name/character_name は1件目との後方互換）
    work_name: cleanPlansForStorage(input.cosplayPlans)?.[0]?.workTitle || input.cosplayInfo?.workName || null,
    character_name: cleanPlansForStorage(input.cosplayPlans)?.[0]?.characterName || input.cosplayInfo?.characterName || null,
    shooting_status: input.cosplayInfo?.shootingStatus || null,
    cosplay_plans: cleanPlansForStorage(input.cosplayPlans),
    // photographer（shooting_targets が本体。photographer_target_works は1件目との後方互換）
    photographer_target_works:
      cleanTargetsForStorage(input.shootingTargets)?.[0]?.workTitle || input.photographerInfo?.targetWorks || null,
    photographer_available_time: input.photographerInfo?.availableHours || null,
    photographer_availability: input.photographerInfo?.firstMeetStatus || null,
    portfolio_url: input.portfolioUrl?.trim() || input.photographerInfo?.portfolioUrl || null,
    shooting_style: input.photographerInfo?.shootingStyles?.length
      ? input.photographerInfo.shootingStyles
      : null,
    shooting_targets: cleanTargetsForStorage(input.shootingTargets),
    // 見つけてもらう設定
    time_band: input.timeBand || null,
    greeting_level: input.greetingLevel || null,
    shooting_policy: input.shootingPolicy || null,
    liked_works: input.likedWorks?.trim() || null,
    want_works: input.wantWorks?.trim() || null,
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
  /** 旧トークン方式の編集用（任意） */
  token?: string;
  /** ログイン中ユーザーのID（本人編集の判定用） */
  authUserId?: string | null;
  comment?: string;
  participationDate?: string;
  /** 空文字なら埋め込み解除、未指定なら変更なし */
  tweetUrl?: string;
  cosplayInfo?: ParticipationEntry['cosplayInfo'];
  cosplayPlans?: CosplayPlan[];
  photographerInfo?: ParticipationEntry['photographerInfo'];
  shootingTargets?: ShootingTarget[];
  timeBand?: TimeBand;
  greetingLevel?: GreetingLevel;
  shootingPolicy?: ShootingPolicy;
  likedWorks?: string;
  wantWorks?: string;
}

export async function updateEntry(
  entryId: string,
  input: UpdateEntryInput
): Promise<ParticipationEntry> {
  if (DEMO) {
    const base = demoGetEntryById(entryId)!;
    return {
      ...base,
      comment: input.comment ?? base.comment,
      participationDate: input.participationDate ?? base.participationDate,
      cosplayInfo: input.cosplayInfo ?? base.cosplayInfo,
      cosplayPlans: input.cosplayPlans ?? base.cosplayPlans,
      photographerInfo: input.photographerInfo ?? base.photographerInfo,
      shootingTargets: input.shootingTargets ?? base.shootingTargets,
      timeBand: input.timeBand ?? base.timeBand,
      greetingLevel: input.greetingLevel ?? base.greetingLevel,
      shootingPolicy: input.shootingPolicy ?? base.shootingPolicy,
      likedWorks: input.likedWorks ?? base.likedWorks,
      wantWorks: input.wantWorks ?? base.wantWorks,
    };
  }
  const admin = createAdminClient();

  // 既存行を取得（編集権限の判定とツイート検証に使用）
  const { data: existing, error: fetchError } = await admin
    .from('participation_entries')
    .select('edit_token_hash, x_id, user_id')
    .eq('id', entryId)
    .single();

  if (fetchError || !existing) throw new Error('参加表明が見つかりません');
  const existingRow = existing as { edit_token_hash: string | null; x_id: string; user_id: string | null };

  // 認可: ログイン本人（user_id一致）または 有効な編集トークン
  const allowed = canEditEntry({
    authUserId: input.authUserId,
    ownerUserId: existingRow.user_id,
    token: input.token,
    editTokenHash: existingRow.edit_token_hash,
  });
  if (!allowed) {
    throw new Error('編集権限がありません');
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.comment !== undefined) updateData.comment = input.comment || null;
  if (input.participationDate) updateData.participation_day = input.participationDate;
  if (input.tweetUrl !== undefined) {
    if (input.tweetUrl.trim()) {
      const result = await verifyTweetForXId(input.tweetUrl, existingRow.x_id);
      if (!result.ok) throw new Error(result.error);
      updateData.tweet_url = result.normalizedUrl;
      updateData.is_verified_x = true;
    } else {
      updateData.tweet_url = null;
      updateData.is_verified_x = false;
    }
  }
  if (input.cosplayPlans !== undefined) {
    const plans = cleanPlansForStorage(input.cosplayPlans);
    updateData.cosplay_plans = plans;
    updateData.work_name = plans?.[0]?.workTitle || null;
    updateData.character_name = plans?.[0]?.characterName || null;
  }
  if (input.cosplayInfo) {
    updateData.shooting_status = input.cosplayInfo.shootingStatus || null;
    // 後方互換: plans未指定で旧形式のみ来た場合
    if (input.cosplayPlans === undefined) {
      updateData.work_name = input.cosplayInfo.workName || null;
      updateData.character_name = input.cosplayInfo.characterName || null;
    }
  }
  if (input.shootingTargets !== undefined) {
    const targets = cleanTargetsForStorage(input.shootingTargets);
    updateData.shooting_targets = targets;
    updateData.photographer_target_works = targets?.[0]?.workTitle || null;
  }
  if (input.photographerInfo) {
    if (input.shootingTargets === undefined) {
      updateData.photographer_target_works = input.photographerInfo.targetWorks || null;
    }
    updateData.photographer_available_time = input.photographerInfo.availableHours || null;
    updateData.photographer_availability = input.photographerInfo.firstMeetStatus || null;
    updateData.portfolio_url = input.photographerInfo.portfolioUrl || null;
    updateData.shooting_style = input.photographerInfo.shootingStyles?.length
      ? input.photographerInfo.shootingStyles
      : null;
  }
  if (input.timeBand !== undefined) updateData.time_band = input.timeBand || null;
  if (input.greetingLevel !== undefined) updateData.greeting_level = input.greetingLevel || null;
  if (input.shootingPolicy !== undefined) updateData.shooting_policy = input.shootingPolicy || null;
  if (input.likedWorks !== undefined) updateData.liked_works = input.likedWorks.trim() || null;
  if (input.wantWorks !== undefined) updateData.want_works = input.wantWorks.trim() || null;

  const { data, error } = await admin
    .from('participation_entries')
    .update(updateData)
    .eq('id', entryId)
    .select()
    .single();

  if (error) throw new Error(`更新エラー: ${error.message}`);
  return dbToEntry(data as DBEntry);
}

export async function hideEntry(
  entryId: string,
  opts: { token?: string; authUserId?: string | null }
): Promise<void> {
  if (DEMO) return;
  const admin = createAdminClient();

  const { data: existing, error: fetchError } = await admin
    .from('participation_entries')
    .select('edit_token_hash, user_id')
    .eq('id', entryId)
    .single();

  if (fetchError || !existing) throw new Error('参加表明が見つかりません');
  const existingRow = existing as { edit_token_hash: string | null; user_id: string | null };
  const allowed = canEditEntry({
    authUserId: opts.authUserId,
    ownerUserId: existingRow.user_id,
    token: opts.token,
    editTokenHash: existingRow.edit_token_hash,
  });
  if (!allowed) {
    throw new Error('削除権限がありません');
  }

  const { error } = await admin
    .from('participation_entries')
    .update({ is_hidden: true, auth_status: 'hidden', updated_at: new Date().toISOString() })
    .eq('id', entryId);

  if (error) throw new Error(`削除エラー: ${error.message}`);
}

// ---- 画像（Cloudflare R2）----

/** 画像の所有者判定と既存キーを取得（service role） */
export async function getEntryImageInfo(
  entryId: string
): Promise<{ userId: string | null; imageKey: string | null; displayName: string } | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('participation_entries')
    .select('user_id, image_key, display_name')
    .eq('id', entryId)
    .single();
  if (error || !data) return null;
  const row = data as { user_id: string | null; image_key: string | null; display_name: string };
  return { userId: row.user_id, imageKey: row.image_key, displayName: row.display_name };
}

export interface EntryImageInput {
  imageUrl: string;
  imageKey: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
}

export async function setEntryImage(entryId: string, input: EntryImageInput): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('participation_entries')
    .update({
      image_url: input.imageUrl,
      image_key: input.imageKey,
      image_alt: input.imageAlt,
      image_width: input.imageWidth,
      image_height: input.imageHeight,
      image_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId);
  if (error) throw new Error(`画像更新エラー: ${error.message}`);
}

/** OGP画像（R2静的ホスティング）のURL/keyを保存。updated_at は変えない */
export async function setEntryOgImage(entryId: string, url: string | null, key: string | null): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('participation_entries')
    .update({ og_image_url: url, og_image_key: key })
    .eq('id', entryId);
  if (error) throw new Error(`OGP画像更新エラー: ${error.message}`);
}

export async function clearEntryImage(entryId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('participation_entries')
    .update({
      image_url: null,
      image_key: null,
      image_alt: null,
      image_width: null,
      image_height: null,
      image_updated_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId);
  if (error) throw new Error(`画像削除エラー: ${error.message}`);
}
