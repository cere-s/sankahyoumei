'use client';

import { createClient as _createClient } from '@supabase/supabase-js';

let _instance: ReturnType<typeof _createClient> | null = null;

/** ブラウザ用 Supabase クライアント（将来の認証対応用に用意） */
export function createClient() {
  if (!_instance) {
    _instance = _createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _instance;
}
