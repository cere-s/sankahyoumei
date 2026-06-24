import { createClient } from '@supabase/supabase-js';
import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`環境変数 ${key} が設定されていません`);
  return val;
}

/** ブラウザ公開用の Supabase キー（anon を優先、なければ publishable） */
export function publicAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  );
}

/** サーバーコンポーネント・API Routes での公開データ読み取り用（anon key・セッションなし） */
export function createServerClient() {
  return createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), publicAnonKey(), {
    auth: { persistSession: false },
  });
}

/** 編集・削除など RLS をバイパスする管理操作用（service role key） */
export function createAdminClient() {
  return createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  });
}

/**
 * Cookie ベースのセッションを扱う認証用クライアント。
 * ログインユーザーの取得や、本人としての書き込み（RLS）に使う。
 */
export async function createAuthServerClient() {
  const cookieStore = await cookies();
  return createSSRServerClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), publicAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component からの呼び出しでは set 不可。middleware がセッションを更新する。
        }
      },
    },
  });
}
