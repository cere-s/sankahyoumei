'use client';

import { createBrowserClient } from '@supabase/ssr';

let _instance: ReturnType<typeof createBrowserClient> | null = null;

function publicKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    ''
  );
}

/** ブラウザ用 Supabase クライアント（Cookie でセッション共有） */
export function createClient() {
  if (!_instance) {
    _instance = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, publicKey());
  }
  return _instance;
}
