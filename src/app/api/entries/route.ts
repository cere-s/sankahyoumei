import { NextRequest, NextResponse } from 'next/server';
import { createEntry, getEntriesByEventId } from '@/lib/entries';
import type { ParticipationType, ParticipationEntry } from '@/types';

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get('eventId');
  if (!eventId) {
    return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
  }
  try {
    const entries = await getEntriesByEventId(eventId);
    return NextResponse.json(entries);
  } catch (e) {
    console.error('GET /api/entries failed:', e);
    return NextResponse.json({ error: '参加表明の取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 });
  }

  const { eventId, displayName, xId, participationType, participationDate } = body;
  if (!eventId || !displayName || !xId || !participationType || !participationDate) {
    return NextResponse.json({ error: '必須項目が入力されていません' }, { status: 400 });
  }

  try {
    const result = await createEntry({
      eventId: String(eventId),
      displayName: String(displayName).trim(),
      xId: String(xId).trim().replace(/^@/, ''),
      participationType: String(participationType) as ParticipationType,
      participationDate: String(participationDate),
      comment: String(body.comment ?? '').trim(),
      note: body.note ? String(body.note).trim() : undefined,
      imageUrl: body.imageUrl ? String(body.imageUrl).trim() : undefined,
      tweetUrl: body.tweetUrl ? String(body.tweetUrl).trim() : undefined,
      deletePassword: body.deletePassword ? String(body.deletePassword) : undefined,
      cosplayInfo: body.cosplayInfo as ParticipationEntry['cosplayInfo'] | undefined,
      photographerInfo: body.photographerInfo as ParticipationEntry['photographerInfo'] | undefined,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const msg = String(e);
    // ツイート検証など利用者向けのバリデーションエラーはそのまま返す
    if (msg.includes('ツイート')) {
      return NextResponse.json({ error: msg.replace(/^Error:\s*/, '') }, { status: 400 });
    }
    console.error('POST /api/entries failed:', e);
    return NextResponse.json({ error: '参加表明の作成に失敗しました' }, { status: 500 });
  }
}

