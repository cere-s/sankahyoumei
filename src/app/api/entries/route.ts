import { NextRequest, NextResponse } from 'next/server';
import { createEntry, getEntriesByEventId, setEntryImage } from '@/lib/entries';
import { getCurrentAuth } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { validateImageFile, uploadEntryImage } from '@/lib/imageUpload';
import { r2Configured } from '@/lib/r2';
import { DEMO } from '@/lib/demo';
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
  if (!rateLimit(`entries:${getClientIp(request)}`, 10, 60_000)) {
    return NextResponse.json({ error: 'リクエストが多すぎます。少し時間をおいてください。' }, { status: 429 });
  }

  // multipart（画像同梱）と JSON の両対応
  let body: Record<string, unknown>;
  let imageFile: File | null = null;
  const contentTypeHeader = request.headers.get('content-type') ?? '';
  try {
    if (contentTypeHeader.includes('multipart/form-data')) {
      const form = await request.formData();
      body = JSON.parse(String(form.get('payload') ?? '{}'));
      const f = form.get('file');
      if (f instanceof File && f.size > 0) imageFile = f;
    } else {
      body = await request.json();
    }
  } catch {
    return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 });
  }

  // なりすまし防止：新規作成はXログイン必須。X IDはログイン情報から確定する
  const { user, profile } = await getCurrentAuth();
  if (!user) {
    return NextResponse.json({ error: 'Xログインが必要です' }, { status: 401 });
  }
  const xId = profile?.xUsername;
  if (!xId) {
    return NextResponse.json(
      { error: 'Xユーザー名を取得できませんでした。一度ログアウトして再度Xログインしてください。' },
      { status: 400 }
    );
  }

  const { eventId, displayName, participationType, participationDate } = body;
  if (!eventId || !displayName || !participationType || !participationDate) {
    return NextResponse.json({ error: '必須項目が入力されていません' }, { status: 400 });
  }
  if (String(displayName).length > 50 || String(body.comment ?? '').length > 1000) {
    return NextResponse.json({ error: '入力内容が長すぎます' }, { status: 400 });
  }

  // 画像があれば作成前に検証（不正なら作成せず弾く）
  let validatedImage = null;
  if (imageFile) {
    try {
      validatedImage = await validateImageFile(imageFile);
    } catch (e) {
      return NextResponse.json({ error: String(e).replace(/^Error:\s*/, '') }, { status: 400 });
    }
  }

  try {
    const result = await createEntry({
      eventId: String(eventId),
      displayName: String(displayName).trim(),
      xId, // 手入力ではなくログイン中のXユーザー名を使用
      participationType: String(participationType) as ParticipationType,
      participationDate: String(participationDate),
      comment: String(body.comment ?? '').trim(),
      note: body.note ? String(body.note).trim() : undefined,
      tweetUrl: body.tweetUrl ? String(body.tweetUrl).trim() : undefined,
      deletePassword: body.deletePassword ? String(body.deletePassword) : undefined,
      cosplayInfo: body.cosplayInfo as ParticipationEntry['cosplayInfo'] | undefined,
      photographerInfo: body.photographerInfo as ParticipationEntry['photographerInfo'] | undefined,
      userId: user.id,
      xUserId: profile?.xUserId,
      xUsernameSnapshot: profile?.xUsername,
    });

    // 検証済み画像を R2 へアップロードして紐づけ（失敗してもエントリーは作成済み）
    if (validatedImage && !DEMO && r2Configured()) {
      try {
        const img = await uploadEntryImage(validatedImage, user.id, result.entry.id, result.entry.displayName);
        await setEntryImage(result.entry.id, img);
        result.entry.imageUrl = img.imageUrl;
      } catch (e) {
        console.error('画像の添付に失敗:', e);
        return NextResponse.json(
          { ...result, imageWarning: '参加表明は作成されましたが、画像のアップロードに失敗しました。編集画面から再度お試しください。' },
          { status: 201 }
        );
      }
    }

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

