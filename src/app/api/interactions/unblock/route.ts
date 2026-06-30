import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { unblockUser } from '@/lib/interactions';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  if (!rateLimit(`interaction-unblock:${getClientIp(request)}`, 30, 60_000)) {
    return NextResponse.json({ error: 'リクエストが多すぎます。少し時間をおいてください。' }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 });
  }

  const blockedUserId = String(body.blockedUserId ?? '').trim();
  const eventId = body.eventId ? String(body.eventId).trim() : undefined;
  if (!blockedUserId) {
    return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 });
  }

  const ok = await unblockUser(user.id, blockedUserId, eventId);
  if (!ok) {
    return NextResponse.json({ error: '処理に失敗しました' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
