import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createEvent, findDuplicateEvents } from '@/lib/events';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: NextRequest) {
  if (!rateLimit(`event-create:${getClientIp(request)}`, 5, 60_000)) {
    return NextResponse.json({ error: 'リクエストが多すぎます。少し時間をおいてください。' }, { status: 429 });
  }

  // なりすまし・スパム抑止のためログイン必須
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'イベント登録にはXログインが必要です' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 });
  }

  const name = String(body.name ?? '').trim();
  const date = String(body.date ?? '').trim();
  const location = String(body.location ?? '').trim();
  const force = body.force === true;

  if (!name || !date || !location) {
    return NextResponse.json({ error: 'イベント名・開催日・会場は必須です' }, { status: 400 });
  }
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: '開催日の形式が正しくありません' }, { status: 400 });
  }
  if (name.length > 100 || location.length > 100 || String(body.description ?? '').length > 1000) {
    return NextResponse.json({ error: '入力内容が長すぎます' }, { status: 400 });
  }

  // 重複警告（force=false のときだけ）
  if (!force) {
    const duplicates = await findDuplicateEvents(name, date).catch(() => []);
    if (duplicates.length > 0) {
      return NextResponse.json(
        {
          error: 'duplicate',
          duplicates: duplicates.map((e) => ({ id: e.id, name: e.name, date: e.date, location: e.location })),
        },
        { status: 409 }
      );
    }
  }

  try {
    const event = await createEvent(
      {
        name,
        date,
        location,
        region: body.region ? String(body.region).trim() : undefined,
        officialUrl: body.officialUrl ? String(body.officialUrl).trim() : undefined,
        xUrl: body.xUrl ? String(body.xUrl).trim() : undefined,
        hashtag: body.hashtag ? String(body.hashtag).trim() : undefined,
        description: body.description ? String(body.description).trim() : undefined,
        organizer: body.organizer ? String(body.organizer).trim() : undefined,
        address: body.address ? String(body.address).trim() : undefined,
      },
      user.id
    );
    return NextResponse.json({ event }, { status: 201 });
  } catch (e) {
    console.error('POST /api/events failed:', e);
    return NextResponse.json({ error: 'イベントの登録に失敗しました' }, { status: 500 });
  }
}
