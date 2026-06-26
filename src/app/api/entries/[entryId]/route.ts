import { NextRequest, NextResponse } from 'next/server';
import { getEntryById, updateEntry, hideEntry } from '@/lib/entries';
import { getCurrentUser } from '@/lib/auth';
import { refreshOgImage } from '@/lib/og';

type Params = Promise<{ entryId: string }>;

/** 権限・存在エラーは利用者向けメッセージを返し、それ以外は内部詳細を隠して 500 を返す */
function errorResponse(e: unknown, context: string) {
  const msg = String(e);
  if (msg.includes('権限')) {
    return NextResponse.json({ error: msg.replace(/^Error:\s*/, '') }, { status: 403 });
  }
  if (msg.includes('見つかりません')) {
    return NextResponse.json({ error: msg.replace(/^Error:\s*/, '') }, { status: 404 });
  }
  if (msg.includes('ツイート')) {
    return NextResponse.json({ error: msg.replace(/^Error:\s*/, '') }, { status: 400 });
  }
  console.error(`${context} failed:`, e);
  return NextResponse.json({ error: '処理に失敗しました' }, { status: 500 });
}

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { entryId } = await params;
  try {
    const entry = await getEntryById(entryId);
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(entry);
  } catch (e) {
    console.error('GET /api/entries/[entryId] failed:', e);
    return NextResponse.json({ error: '参加表明の取得に失敗しました' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const { entryId } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!body.token && !user) {
    return NextResponse.json({ error: '編集にはXログインまたは編集トークンが必要です' }, { status: 400 });
  }

  try {
    const updated = await updateEntry(entryId, {
      token: body.token ? String(body.token) : undefined,
      authUserId: user?.id ?? null,
      comment: body.comment !== undefined ? String(body.comment) : undefined,
      participationDate: body.participationDate ? String(body.participationDate) : undefined,
      tweetUrl: body.tweetUrl !== undefined ? String(body.tweetUrl) : undefined,
      cosplayInfo: body.cosplayInfo as Parameters<typeof updateEntry>[1]['cosplayInfo'],
      photographerInfo: body.photographerInfo as Parameters<typeof updateEntry>[1]['photographerInfo'],
    });
    await refreshOgImage(entryId);
    return NextResponse.json(updated);
  } catch (e) {
    return errorResponse(e, 'PUT /api/entries/[entryId]');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const { entryId } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!body.token && !user) {
    return NextResponse.json({ error: '削除にはXログインまたは編集トークンが必要です' }, { status: 400 });
  }

  try {
    await hideEntry(entryId, {
      token: body.token ? String(body.token) : undefined,
      authUserId: user?.id ?? null,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return errorResponse(e, 'DELETE /api/entries/[entryId]');
  }
}
