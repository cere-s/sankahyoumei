'use client';

import { useState } from 'react';
import type { Provider } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { DEMO } from '@/lib/demo';

interface Props {
  /** ログイン後に戻る先（サイト内パス）。例: 現在の参加表明フォーム */
  next?: string;
  label?: string;
  className?: string;
}

export function XLoginButton({ next = '/', label = 'Xでログイン', className }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);

    // デモモード：本物のXログインは使わず、Cookieでデモログイン
    if (DEMO) {
      window.location.href = `/auth/demo?action=login&next=${encodeURIComponent(next)}`;
      return;
    }

    const supabase = createClient();
    const siteUrl = window.location.origin;
    const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'x' as Provider,
      options: { redirectTo },
    });

    if (error) {
      console.error('signInWithOAuth failed:', error.message);
      setLoading(false);
      alert('Xログインを開始できませんでした。時間をおいて再度お試しください。');
    }
  }

  const displayLabel = DEMO ? 'デモログイン' : label;

  return (
    <button
      type="button"
      onClick={handleLogin}
      disabled={loading}
      className={
        className ??
        'inline-flex items-center justify-center gap-2 bg-black text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors'
      }
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      {loading ? '接続中...' : displayLabel}
    </button>
  );
}
