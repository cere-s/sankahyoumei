import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createEvent, findDuplicateEvents } from '@/lib/events';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { safeHttpUrl, safeXUrl, asRegion, clampText, LIMITS } from '@/lib/validation';

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
  const rawOfficialUrl = String(body.officialUrl ?? '').trim();
  const rawXUrl = String(body.xUrl ?? '').trim();
  const force = body.force === true;

  if (!name || !date || !location) {
    return NextResponse.json({ error: 'イベント名・開催日・会場は必須です' }, { status: 400 });
  }
  if (!rawOfficialUrl && !rawXUrl) {
    return NextResponse.json(
      { error: '公式サイトURL か 公式XのURL のどちらかは必須です' },
      { status: 400 }
    );
  }
  // URLは http(s) のみ許可（javascript: などを弾く）。公式Xは x.com / twitter.com のみ
  const officialUrl = rawOfficialUrl ? safeHttpUrl(rawOfficialUrl) : null;
  const xUrl = rawXUrl ? safeXUrl(rawXUrl) : null;
  if (rawOfficialUrl && !officialUrl) {
    return NextResponse.json({ error: '公式サイトURLは https:// から始まる正しいURLを入力してください' }, { status: 400 });
  }
  if (rawXUrl && !xUrl) {
    return NextResponse.json({ error: '公式XのURLは https://x.com/... の形式で入力してください' }, { status: 400 });
  }
  if (!officialUrl && !xUrl) {
    return NextResponse.json(
      { error: '公式サイトURL か 公式XのURL のどちらかは必須です' },
      { status: 400 }
    );
  }
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: '開催日の形式が正しくありません' }, { status: 400 });
  }
  if (name.length > LIMITS.eventName || location.length > LIMITS.eventLocation || String(body.description ?? '').length > LIMITS.eventDescription) {
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
        region: asRegion(body.region),
        officialUrl: officialUrl || undefined,
        xUrl: xUrl || undefined,
        hashtag: clampText(body.hashtag, LIMITS.eventHashtag),
        description: clampText(body.description, LIMITS.eventDescription),
        organizer: clampText(body.organizer, LIMITS.eventOrganizer),
        address: clampText(body.address, LIMITS.eventAddress),
      },
      user.id
    );
    return NextResponse.json({ event }, { status: 201 });
  } catch (e) {
    console.error('POST /api/events failed:', e);
    return NextResponse.json({ error: 'イベントの登録に失敗しました' }, { status: 500 });
  }
}
