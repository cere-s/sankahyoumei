import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types';
import { createAuthServerClient } from './supabase/server';

interface ProfileRow {
  id: string;
  x_user_id: string | null;
  x_username: string | null;
  x_display_name: string | null;
  x_avatar_url: string | null;
}

function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    xUserId: row.x_user_id ?? undefined,
    xUsername: row.x_username ?? undefined,
    xDisplayName: row.x_display_name ?? undefined,
    xAvatarUrl: row.x_avatar_url ?? undefined,
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
  const xUsername = pick('user_name', 'preferred_username', 'nickname', 'screen_name');
  const xDisplayName = pick('full_name', 'name', 'display_name');
  const xAvatarUrl = pick('avatar_url', 'picture', 'profile_image_url');

  return { xUserId, xUsername, xDisplayName, xAvatarUrl };
}

/** ログイン中のユーザーを返す（未ログインなら null） */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

/**
 * ログイン中ユーザーと profiles の保存済み情報をまとめて返す。
 * profiles は DB を1回読むだけで、X API は叩かない。
 */
export async function getCurrentAuth(): Promise<{ user: User | null; profile: Profile | null }> {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return { user, profile: data ? rowToProfile(data as ProfileRow) : null };
}
