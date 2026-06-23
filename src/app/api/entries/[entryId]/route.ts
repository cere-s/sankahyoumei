import { NextRequest, NextResponse } from 'next/server';
import { getEntryById, updateEntry, hideEntry } from '@/lib/entries';

type Params = Promise<{ entryId: string }>;

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { entryId } = await params;
  try {
    const entry = await getEntryById(entryId);
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(entry);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
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

  if (!body.token) {
    return NextResponse.json({ error: '編集トークンが必要です' }, { status: 400 });
  }

  try {
    const updated = await updateEntry(entryId, {
      token: String(body.token),
      comment: body.comment !== undefined ? String(body.comment) : undefined,
      participationDate: body.participationDate ? String(body.participationDate) : undefined,
      cosplayInfo: body.cosplayInfo as Parameters<typeof updateEntry>[1]['cosplayInfo'],
      photographerInfo: body.photographerInfo as Parameters<typeof updateEntry>[1]['photographerInfo'],
    });
    return NextResponse.json(updated);
  } catch (e) {
    const msg = String(e);
    const status = msg.includes('権限') ? 403 : msg.includes('見つかりません') ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
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

  if (!body.token) {
    return NextResponse.json({ error: '編集トークンが必要です' }, { status: 400 });
  }

  try {
    await hideEntry(entryId, String(body.token));
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = String(e);
    const status = msg.includes('権限') ? 403 : msg.includes('見つかりません') ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
