import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase/server';
import { extractXProfile } from '@/lib/auth';

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

  // プロフィール同期（初回ログイン時のみ X 情報を保存）
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const x = extractXProfile(user);

      // 開発時のみ metadata の構造を確認（トークン等の秘密情報は出さない）
      if (process.env.NODE_ENV !== 'production') {
        console.log('[auth] metadata keys:', Object.keys(user.user_metadata ?? {}));
        console.log('[auth] identities:', user.identities?.map((i) => i.provider));
        console.log('[auth] extracted X profile:', x);
      }

      await supabase.from('profiles').upsert(
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
    }
  } catch (e) {
    console.error('profile sync failed:', e);
    // プロフィール保存に失敗してもログイン自体は継続
  }

  return NextResponse.redirect(`${origin}${next}`);
}
