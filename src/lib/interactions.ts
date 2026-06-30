import type {
  InteractionType,
  InteractionParty,
  ReceivedInteraction,
  SentInteraction,
  EventInteractionContext,
} from '@/types';
import { createAdminClient } from './supabase/server';
import { getEventsByIds } from './events';
import { DEMO } from './demo';

/**
 * ユーザー同士の軽い交流（意思表示）機能のデータ層。
 *
 * 方針:
 * - 「撮りたい / 撮られたい / 交流したい」のワンタップ意思表示のみ。DM・自由入力は扱わない。
 * - 書き込み・読み取りはすべて service_role（管理クライアント）で行い、
 *   呼び出し側（API ルート）でログイン本人を確定してから userId を渡す。
 * - ブロックは双方向に効く（自分がブロック／相手にブロックされている、どちらでも制限）。
 * - 非表示は受信者の画面表示だけを抑制し、相手に通知せずデータも削除しない。
 */

interface ProfileLite {
  id: string;
  x_username: string | null;
  x_display_name: string | null;
  x_avatar_url: string | null;
}

function emptyContext(viewerUserId: string | null): EventInteractionContext {
  return { viewerUserId, myIntents: {}, countsByEntry: {}, restrictedUserIds: [] };
}

/** 自分が関与するブロック相手（双方向）の user_id 集合を返す */
async function getRestrictedUserIds(
  admin: ReturnType<typeof createAdminClient>,
  viewerUserId: string
): Promise<Set<string>> {
  const { data, error } = await admin
    .from('user_blocks')
    .select('blocker_user_id, blocked_user_id')
    .or(`blocker_user_id.eq.${viewerUserId},blocked_user_id.eq.${viewerUserId}`);
  const set = new Set<string>();
  if (error || !data) return set;
  for (const row of data as { blocker_user_id: string; blocked_user_id: string }[]) {
    set.add(row.blocker_user_id === viewerUserId ? row.blocked_user_id : row.blocker_user_id);
  }
  return set;
}

/** a と b の間にブロック関係があるか（どちらの向きでも true） */
async function isRestricted(
  admin: ReturnType<typeof createAdminClient>,
  a: string,
  b: string
): Promise<boolean> {
  const { data } = await admin
    .from('user_blocks')
    .select('id')
    .or(
      `and(blocker_user_id.eq.${a},blocked_user_id.eq.${b}),and(blocker_user_id.eq.${b},blocked_user_id.eq.${a})`
    )
    .limit(1);
  return Boolean(data && data.length > 0);
}

/** user_id の集合からプロフィール（公開項目のみ）を引いて Map で返す */
async function getPartiesByUserIds(
  admin: ReturnType<typeof createAdminClient>,
  userIds: string[]
): Promise<Map<string, InteractionParty>> {
  const map = new Map<string, InteractionParty>();
  const unique = [...new Set(userIds)].filter(Boolean);
  if (unique.length === 0) return map;
  const { data } = await admin
    .from('profiles')
    .select('id, x_username, x_display_name, x_avatar_url')
    .in('id', unique);
  for (const row of (data ?? []) as ProfileLite[]) {
    map.set(row.id, {
      userId: row.id,
      xUsername: row.x_username ?? undefined,
      displayName: row.x_display_name ?? undefined,
      avatarUrl: row.x_avatar_url ?? undefined,
    });
  }
  // プロフィール行が無い user_id にも最低限の Party を入れておく
  for (const id of unique) {
    if (!map.has(id)) map.set(id, { userId: id });
  }
  return map;
}

export type ToggleResult =
  | { ok: true; active: boolean }
  | { ok: false; reason: 'self' | 'restricted' | 'not_found' | 'error' };

/**
 * 意思表示のトグル。未選択なら追加、選択済みなら取り消す。
 * 自分自身・ブロック相手・所有者不明の参加表明には登録できない。
 */
export async function toggleInteraction(
  viewerUserId: string,
  toEntryId: string,
  intentType: InteractionType
): Promise<ToggleResult> {
  if (DEMO) return { ok: true, active: true };
  const admin = createAdminClient();

  // 対象参加表明から event_id / 所有者を確定（手入力ではなく DB から取る）
  const { data: entry, error: entryErr } = await admin
    .from('participation_entries')
    .select('event_id, user_id, is_hidden')
    .eq('id', toEntryId)
    .single();
  if (entryErr || !entry) return { ok: false, reason: 'not_found' };
  const row = entry as { event_id: string; user_id: string | null; is_hidden: boolean };
  if (!row.user_id || row.is_hidden) return { ok: false, reason: 'not_found' };
  if (row.user_id === viewerUserId) return { ok: false, reason: 'self' };

  if (await isRestricted(admin, viewerUserId, row.user_id)) {
    return { ok: false, reason: 'restricted' };
  }

  // 既存があれば取り消し、無ければ追加
  const { data: existing } = await admin
    .from('interaction_intents')
    .select('id')
    .eq('from_user_id', viewerUserId)
    .eq('to_entry_id', toEntryId)
    .eq('intent_type', intentType)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from('interaction_intents')
      .delete()
      .eq('id', (existing as { id: string }).id);
    if (error) return { ok: false, reason: 'error' };
    return { ok: true, active: false };
  }

  const { error } = await admin.from('interaction_intents').insert({
    event_id: row.event_id,
    from_user_id: viewerUserId,
    to_user_id: row.user_id,
    to_entry_id: toEntryId,
    intent_type: intentType,
  });
  // 競合（同時押し）でユニーク違反になった場合は「追加済み」とみなす
  if (error && !String(error.message).includes('duplicate')) {
    return { ok: false, reason: 'error' };
  }
  return { ok: true, active: true };
}

/**
 * イベント参加者一覧で意思表示ボタンを描画するための状態をまとめて返す。
 * intent を1クエリで取得し、自分の送信済み・受信数（ブロック除外）を算出する。
 */
export async function getEventInteractionContext(
  eventId: string,
  viewerUserId: string | null
): Promise<EventInteractionContext> {
  if (DEMO) return emptyContext(viewerUserId);
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('interaction_intents')
    .select('to_entry_id, intent_type, from_user_id')
    .eq('event_id', eventId);
  if (error || !data) return emptyContext(viewerUserId);

  const restricted = viewerUserId
    ? await getRestrictedUserIds(admin, viewerUserId)
    : new Set<string>();

  const ctx = emptyContext(viewerUserId);
  ctx.restrictedUserIds = [...restricted];

  for (const r of data as {
    to_entry_id: string;
    intent_type: InteractionType;
    from_user_id: string;
  }[]) {
    // ブロック関係の相手からの意思表示はカウントに含めない
    if (restricted.has(r.from_user_id)) {
      // ただし自分の送信状態は別途反映（restricted には自分は入らない）
      continue;
    }
    const byType = (ctx.countsByEntry[r.to_entry_id] ??= {});
    byType[r.intent_type] = (byType[r.intent_type] ?? 0) + 1;

    if (viewerUserId && r.from_user_id === viewerUserId) {
      (ctx.myIntents[r.to_entry_id] ??= []).push(r.intent_type);
    }
  }

  return ctx;
}

/** 自分に届いた意思表示一覧（非表示・ブロック分を除外） */
export async function getReceivedInteractions(userId: string): Promise<ReceivedInteraction[]> {
  if (DEMO) return [];
  const admin = createAdminClient();

  const [{ data: rows }, { data: hides }, restricted] = await Promise.all([
    admin
      .from('interaction_intents')
      .select('id, intent_type, created_at, from_user_id, event_id, to_entry_id')
      .eq('to_user_id', userId)
      .order('created_at', { ascending: false }),
    admin.from('interaction_hides').select('interaction_intent_id').eq('user_id', userId),
    getRestrictedUserIds(admin, userId),
  ]);

  if (!rows) return [];
  const hiddenIds = new Set(
    ((hides ?? []) as { interaction_intent_id: string }[]).map((h) => h.interaction_intent_id)
  );

  type Row = {
    id: string;
    intent_type: InteractionType;
    created_at: string;
    from_user_id: string;
    event_id: string;
    to_entry_id: string;
  };
  const visible = (rows as Row[]).filter(
    (r) => !hiddenIds.has(r.id) && !restricted.has(r.from_user_id)
  );

  const [parties, eventMap] = await Promise.all([
    getPartiesByUserIds(admin, visible.map((r) => r.from_user_id)),
    getEventsByIds(visible.map((r) => r.event_id)),
  ]);

  return visible.map((r) => ({
    id: r.id,
    intentType: r.intent_type,
    createdAt: r.created_at,
    from: parties.get(r.from_user_id) ?? { userId: r.from_user_id },
    eventId: r.event_id,
    eventName: eventMap.get(r.event_id)?.name,
    toEntryId: r.to_entry_id,
  }));
}

/** 自分が送った意思表示一覧（ブロック分を除外） */
export async function getSentInteractions(userId: string): Promise<SentInteraction[]> {
  if (DEMO) return [];
  const admin = createAdminClient();

  const [{ data: rows }, restricted] = await Promise.all([
    admin
      .from('interaction_intents')
      .select('id, intent_type, created_at, to_user_id, event_id, to_entry_id')
      .eq('from_user_id', userId)
      .order('created_at', { ascending: false }),
    getRestrictedUserIds(admin, userId),
  ]);

  if (!rows) return [];
  type Row = {
    id: string;
    intent_type: InteractionType;
    created_at: string;
    to_user_id: string;
    event_id: string;
    to_entry_id: string;
  };
  const visible = (rows as Row[]).filter((r) => !restricted.has(r.to_user_id));

  const [parties, eventMap] = await Promise.all([
    getPartiesByUserIds(admin, visible.map((r) => r.to_user_id)),
    getEventsByIds(visible.map((r) => r.event_id)),
  ]);

  return visible.map((r) => ({
    id: r.id,
    intentType: r.intent_type,
    createdAt: r.created_at,
    to: parties.get(r.to_user_id) ?? { userId: r.to_user_id },
    eventId: r.event_id,
    eventName: eventMap.get(r.event_id)?.name,
    toEntryId: r.to_entry_id,
  }));
}

/** 届いた意思表示を自分の画面から非表示にする（本人宛のものだけ。冪等） */
export async function hideInteraction(userId: string, intentId: string): Promise<boolean> {
  if (DEMO) return true;
  const admin = createAdminClient();

  // 本人宛の意思表示であることを確認（他人宛は非表示にできない）
  const { data: intent } = await admin
    .from('interaction_intents')
    .select('id')
    .eq('id', intentId)
    .eq('to_user_id', userId)
    .maybeSingle();
  if (!intent) return false;

  const { error } = await admin
    .from('interaction_hides')
    .upsert({ user_id: userId, interaction_intent_id: intentId }, { onConflict: 'user_id,interaction_intent_id' });
  return !error;
}

/** 自分がブロックしているユーザー一覧（プロフィール付き） */
export async function getBlockedUsers(userId: string): Promise<InteractionParty[]> {
  if (DEMO) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from('user_blocks')
    .select('blocked_user_id')
    .eq('blocker_user_id', userId);
  const ids = [...new Set(((data ?? []) as { blocked_user_id: string }[]).map((r) => r.blocked_user_id))];
  if (ids.length === 0) return [];
  const parties = await getPartiesByUserIds(admin, ids);
  return ids.map((id) => parties.get(id) ?? { userId: id });
}

/** ブロックする（既定はサービス全体。冪等） */
export async function blockUser(
  blockerUserId: string,
  blockedUserId: string,
  eventId?: string
): Promise<boolean> {
  if (DEMO) return true;
  if (blockerUserId === blockedUserId) return false;
  const admin = createAdminClient();

  // 既存があれば何もしない（NULL を含む UNIQUE は upsert で扱いにくいため手動チェック）
  const existing = admin
    .from('user_blocks')
    .select('id')
    .eq('blocker_user_id', blockerUserId)
    .eq('blocked_user_id', blockedUserId);
  const { data } = await (eventId
    ? existing.eq('event_id', eventId)
    : existing.is('event_id', null)
  ).maybeSingle();
  if (data) return true;

  const { error } = await admin.from('user_blocks').insert({
    blocker_user_id: blockerUserId,
    blocked_user_id: blockedUserId,
    event_id: eventId ?? null,
  });
  return !error || String(error.message).includes('duplicate');
}

/** ブロック解除（向き・イベント指定が一致する行を削除） */
export async function unblockUser(
  blockerUserId: string,
  blockedUserId: string,
  eventId?: string
): Promise<boolean> {
  if (DEMO) return true;
  const admin = createAdminClient();

  const q = admin
    .from('user_blocks')
    .delete()
    .eq('blocker_user_id', blockerUserId)
    .eq('blocked_user_id', blockedUserId);
  const { error } = await (eventId ? q.eq('event_id', eventId) : q.is('event_id', null));
  return !error;
}
