import { NextResponse } from 'next/server';
import { DEMO, DEMO_SESSION_COOKIE } from '@/lib/demo';

/** デモモード専用：Cookie でデモログイン/ログアウトを切り替える */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const nextParam = url.searchParams.get('next') ?? '/';
  const next = nextParam.startsWith('/') ? nextParam : '/';
  const res = NextResponse.redirect(`${url.origin}${next}`);

  if (!DEMO) return NextResponse.redirect(`${url.origin}/`);

  if (action === 'logout') {
    res.cookies.set(DEMO_SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  } else {
    res.cookies.set(DEMO_SESSION_COOKIE, '1', { path: '/', maxAge: 60 * 60 * 24 * 7 });
  }
  return res;
}
