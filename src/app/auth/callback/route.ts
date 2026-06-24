import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase/server';
import { syncProfileFromUser } from '@/lib/auth';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next') ?? '/';
  // オープンリダイレクト防止：サイト内パスのみ許可
  const next = nextParam.startsWith('/') ? nextParam : '/';
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth_error=missing_code`);
  }

  const supabase = await createAuthServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('OAuth callback failed:', error.message);
    return NextResponse.redirect(`${origin}/?auth_error=1`);
  }

  // プロフィール同期（service role で upsert。失敗してもログインは継続）
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await syncProfileFromUser(user);
    }
  } catch (e) {
    console.error('profile sync failed:', e);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
