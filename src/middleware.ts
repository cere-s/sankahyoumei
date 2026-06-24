import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Supabase セッション（Cookie）を更新するためのミドルウェア。
 * Supabase Auth のみを呼び、X API へはアクセスしない。
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // セッションのリフレッシュ（getUser が必要に応じて更新トークンを使う）
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    // 静的アセットと画像最適化を除く全ルート
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
