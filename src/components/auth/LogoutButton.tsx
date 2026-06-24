'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DEMO } from '@/lib/demo';

export function LogoutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoading(true);
    if (DEMO) {
      window.location.href = '/auth/demo?action=logout&next=/';
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={className ?? 'text-xs text-gray-500 hover:text-violet-600 hover:underline disabled:opacity-50'}
    >
      {loading ? '...' : 'ログアウト'}
    </button>
  );
}
