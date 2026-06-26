import { NextRequest, NextResponse } from 'next/server';
import { refreshOgImage } from '@/lib/og';

// 1リクエストにつき1件のOGP画像を再生成する（秘密キー保護）。
// 一括処理はスクリプト側でIDを順に投げる（タイムアウト回避）。
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const secret = process.env.OG_REFRESH_SECRET;
  if (!secret || req.headers.get('x-admin-secret') !== secret) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const id = body.id ? String(body.id) : '';
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await refreshOgImage(id);
  return NextResponse.json({ ok: true, id });
}
