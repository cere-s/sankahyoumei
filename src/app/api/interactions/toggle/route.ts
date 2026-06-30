import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { toggleInteraction } from '@/lib/interactions';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { isInteractionType } from '@/lib/utils';

export async function POST(request: NextRequest) {
  if (!rateLimit(`interaction:${getClientIp(request)}`, 60, 60_000)) {
    return NextResponse.json({ error: 'リクエストが多すぎます。少し時間をおいてください。' }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '交流機能を使うにはログインが必要です' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 });
  }

  const toEntryId = String(body.toEntryId ?? '').trim();
  const intentType = body.intentType;
  if (!toEntryId || !isInteractionType(intentType)) {
    return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 });
  }

  const result = await toggleInteraction(user.id, toEntryId, intentType);
  if (!result.ok) {
    if (result.reason === 'self') {
      return NextResponse.json({ error: '自分の参加表明には追加できません' }, { status: 400 });
    }
    if (result.reason === 'restricted') {
      return NextResponse.json({ error: 'このユーザーとの交流は制限されています' }, { status: 403 });
    }
    if (result.reason === 'not_found') {
      return NextResponse.json({ error: '対象が見つかりません' }, { status: 404 });
    }
    return NextResponse.json({ error: '処理に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ active: result.active });
}
