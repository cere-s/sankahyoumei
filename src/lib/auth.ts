import type { User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Profile, PhotographerSample } from '@/types';
import { createServerClient, createAuthServerClient, createAdminClient } from './supabase/server';
import { DEMO, DEMO_SESSION_COOKIE, demoUser, demoProfile } from './demo';

/** デモモード: Cookie でデモログイン状態を判定 */
async function demoLoggedIn(): Promise<boolean> {
  const store = await cookies();
  return store.get(DEMO_SESSION_COOKIE)?.value === '1';
}

interface ProfileRow {
  id: string;
  x_user_id: string | null;
  x_username: string | null;
  x_display_name: string | null;
  x_avatar_url: string | null;
  photographer_samples?: unknown;
}

/** DBのJSONB配列を検証しつつ PhotographerSample[] に変換する（不正値は無視） */
function parsePhotographerSamples(raw: unknown): PhotographerSample[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const samples = raw
    .filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null)
    .map((v) => ({
      url: typeof v.url === 'string' ? v.url : '',
      key: typeof v.key === 'string' ? v.key : '',
      subjectXId: typeof v.subjectXId === 'string' && v.subjectXId.trim() ? v.subjectXId.trim() : undefined,
    }))
    .filter((s) => s.url && s.key)
    .slice(0, 4);
  return samples.length ? samples : undefined;
}

function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    xUserId: row.x_user_id ?? undefined,
    xUsername: row.x_username ?? undefined,
    xDisplayName: row.x_display_name ?? undefined,
    xAvatarUrl: row.x_avatar_url ?? undefined,
    photographerSamples: parsePhotographerSamples(row.photographer_samples),
  };
}

/**
 * Supabase Auth の user オブジェクトから X 情報を取り出す。
 * X API は叩かず、ログイン時に得られた metadata / identities のみを使う。
 */
export function extractXProfile(user: User): {
  xUserId: string | null;
  xUsername: string | null;
  xDisplayName: string | null;
  xAvatarUrl: string | null;
} {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const identity = user.identities?.find((i) => i.provider === 'x' || i.provider === 'twitter');
  const idData = (identity?.identity_data ?? {}) as Record<string, unknown>;

  const pick = (...keys: string[]): string | null => {
    for (const k of keys) {
      const v = meta[k] ?? idData[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return null;
  };

  const xUserId =
    identity?.id ??
    pick('provider_id', 'sub', 'user_id') ??
    null;
  const xUsername = pick('user_name', 'preferred_username', 'nickname', 'screen_name', 'custom_claims');
  const xDisplayName = pick('full_name', 'name', 'display_name');
  const xAvatarUrl = pick('avatar_url', 'picture', 'profile_image_url');

  return { xUserId, xUsername, xDisplayName, xAvatarUrl };
}

/**
 * user の metadata から profiles を作成/更新する（service role で実行、RLSの影響を受けない）。
 * X API は叩かない。保存した Profile を返す。
 */
export async function syncProfileFromUser(user: User): Promise<Profile> {
  const x = extractXProfile(user);
  const admin = createAdminClient();
  const { error } = await admin.from('profiles').upsert(
    {
      id: user.id,
      x_user_id: x.xUserId,
      x_username: x.xUsername,
      x_display_name: x.xDisplayName,
      x_avatar_url: x.xAvatarUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('profile upsert failed:', error.message);
  }

  return {
    id: user.id,
    xUserId: x.xUserId ?? undefined,
    xUsername: x.xUsername ?? undefined,
    xDisplayName: x.xDisplayName ?? undefined,
    xAvatarUrl: x.xAvatarUrl ?? undefined,
  };
}

/** ログイン中のユーザーを返す（未ログインなら null） */
export async function getCurrentUser(): Promise<User | null> {
  if (DEMO) return (await demoLoggedIn()) ? demoUser() : null;
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

/**
 * ログイン中ユーザーと profiles の保存済み情報をまとめて返す。
 * profiles 行が無い／ユーザー名が未保存なら、その場で metadata から1回だけ同期する。
 * 同期済みなら DB を読むだけで、X API は叩かない。
 */
export async function getCurrentAuth(): Promise<{ user: User | null; profile: Profile | null }> {
  if (DEMO) {
    return (await demoLoggedIn())
      ? { user: demoUser(), profile: demoProfile }
      : { user: null, profile: null };
  }
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  let profile = data ? rowToProfile(data as ProfileRow) : null;

  // コールバックを通らなかった場合などの保険：未保存ならここで同期
  if (!profile || !profile.xUsername) {
    profile = await syncProfileFromUser(user);
  }

  return { user, profile };
}

/**
 * 複数ユーザーIDぶんの公開プロフィール（Xアイコン・カメラマンの作例）をまとめて取得する。
 * 参加表明カード表示専用の付加情報で、都度最新値を返す（作成時点のスナップショットではない）。
 */
export async function getProfilesByUserIds(userIds: string[]): Promise<Map<string, Profile>> {
  const map = new Map<string, Profile>();
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return map;

  if (DEMO) {
    if (unique.includes(demoProfile.id)) map.set(demoProfile.id, demoProfile);
    return map;
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, x_user_id, x_username, x_display_name, x_avatar_url, photographer_samples')
    .in('id', unique);

  if (error) {
    console.error('getProfilesByUserIds failed:', error.message);
    return map;
  }
  for (const row of (data as ProfileRow[]) ?? []) {
    map.set(row.id, rowToProfile(row));
  }
  return map;
}

export const MAX_PHOTOGRAPHER_SAMPLES = 4;

/** 現在のプロフィールの作例配列を取得する（RLS: 本人セッションで実行） */
async function fetchOwnPhotographerSamples(
  userId: string
): Promise<{ client: Awaited<ReturnType<typeof createAuthServerClient>>; samples: PhotographerSample[] }> {
  const supabase = await createAuthServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('photographer_samples')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(`作例取得エラー: ${error.message}`);
  const samples = parsePhotographerSamples((data as { photographer_samples?: unknown } | null)?.photographer_samples) ?? [];
  return { client: supabase, samples };
}

/** 作例を1件追加する（本人のプロフィールに保存。最大4件） */
export async function addPhotographerSample(
  userId: string,
  sample: PhotographerSample
): Promise<PhotographerSample[]> {
  const { client, samples } = await fetchOwnPhotographerSamples(userId);
  if (samples.length >= MAX_PHOTOGRAPHER_SAMPLES) {
    throw new Error(`作例は最大${MAX_PHOTOGRAPHER_SAMPLES}件までです`);
  }
  const next = [...samples, sample];
  const { error } = await client
    .from('profiles')
    .upsert({ id: userId, photographer_samples: next, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error) throw new Error(`作例保存エラー: ${error.message}`);
  return next;
}

/** 作例を1件削除する。R2上の実ファイル削除は呼び出し側で行う */
export async function removePhotographerSample(
  userId: string,
  key: string
): Promise<{ removed: PhotographerSample | null; next: PhotographerSample[] }> {
  const { client, samples } = await fetchOwnPhotographerSamples(userId);
  const removed = samples.find((s) => s.key === key) ?? null;
  const next = samples.filter((s) => s.key !== key);
  const { error } = await client
    .from('profiles')
    .upsert({ id: userId, photographer_samples: next, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error) throw new Error(`作例削除エラー: ${error.message}`);
  return { removed, next };
}
