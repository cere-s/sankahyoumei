import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { imageSize } from 'image-size';
import { getCurrentUser } from '@/lib/auth';
import { getEntryImageInfo, setEntryImage, clearEntryImage } from '@/lib/entries';
import { r2Configured, r2Put, r2Delete, r2PublicUrl } from '@/lib/r2';
import { refreshOgImage } from '@/lib/og';
import { isAdmin } from '@/lib/admin';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { DEMO } from '@/lib/demo';

type Params = Promise<{ entryId: string }>;

const MAX_BYTES = 3 * 1024 * 1024; // 3MB
// Content-Type → 正規化した拡張子
const TYPE_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);

// ---- アップロード ----
export async function POST(request: NextRequest, { params }: { params: Params }) {
  const { entryId } = await params;

  if (!rateLimit(`image:${getClientIp(request)}`, 12, 60_000)) {
    return NextResponse.json({ error: 'リクエストが多すぎます。少し時間をおいてください。' }, { status: 429 });
  }

  // 未ログインは拒否
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: '画像ファイルが必要です' }, { status: 400 });
  }

  // Content-Type と拡張子の両方を検証
  const contentType = file.type;
  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  if (!TYPE_EXT[contentType] || !ALLOWED_EXT.has(ext)) {
    return NextResponse.json(
      { error: 'jpg / jpeg / png / webp 形式の画像のみアップロードできます' },
      { status: 400 }
    );
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: '画像は3MB以下にしてください' }, { status: 400 });
  }

  // 所有者チェック（自分の参加表明のみ）
  const info = await getEntryImageInfo(entryId);
  if (!info) {
    return NextResponse.json({ error: '参加表明が見つかりません' }, { status: 404 });
  }
  if (info.userId !== user.id) {
    return NextResponse.json({ error: '自分の参加表明にのみ画像を設定できます' }, { status: 403 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // 寸法を取得（破損・偽装ファイルの簡易検証も兼ねる）
  let width = 0;
  let height = 0;
  try {
    const dim = imageSize(buffer);
    width = dim.width ?? 0;
    height = dim.height ?? 0;
  } catch {
    return NextResponse.json({ error: '画像を解析できませんでした' }, { status: 400 });
  }
  if (!width || !height) {
    return NextResponse.json({ error: '画像を解析できませんでした' }, { status: 400 });
  }

  // デモモードはR2を使わずプレビュー用の応答を返す
  if (DEMO) {
    return NextResponse.json({
      imageUrl: 'https://placehold.co/1200x675/ede9fe/7c3aed?text=DEMO+IMAGE',
      imageWidth: 1200,
      imageHeight: 675,
    });
  }

  if (!r2Configured()) {
    console.error('R2 未設定のため画像アップロードを受け付けられません');
    return NextResponse.json({ error: '画像アップロードは現在利用できません' }, { status: 503 });
  }

  const normalizedExt = TYPE_EXT[contentType];
  const key = `${user.id}/${entryId}/${randomUUID()}.${normalizedExt}`;
  const imageUrl = r2PublicUrl(key);
  const imageAlt = `${info.displayName} の参加表明画像`;

  try {
    await r2Put(key, buffer, contentType);
    await setEntryImage(entryId, { imageUrl, imageKey: key, imageAlt, imageWidth: width, imageHeight: height });

    // 差し替え時は古いオブジェクトを削除
    if (info.imageKey && info.imageKey !== key) {
      try {
        await r2Delete(info.imageKey);
      } catch (e) {
        console.error('古い画像の削除に失敗:', e);
      }
    }
  } catch (e) {
    console.error('画像アップロード失敗:', e);
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 502 });
  }

  // 画像が変わったのでOGP画像を再生成
  await refreshOgImage(entryId);

  return NextResponse.json({ imageUrl, imageWidth: width, imageHeight: height, imageAlt });
}

// ---- 削除 ----
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const { entryId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
  }

  const info = await getEntryImageInfo(entryId);
  if (!info) {
    return NextResponse.json({ error: '参加表明が見つかりません' }, { status: 404 });
  }
  // 所有者または管理者のみ
  const owner = info.userId === user.id;
  if (!owner && !isAdmin(user.id)) {
    return NextResponse.json({ error: 'この画像を削除する権限がありません' }, { status: 403 });
  }

  if (DEMO) {
    return NextResponse.json({ success: true });
  }

  try {
    if (info.imageKey && r2Configured()) {
      await r2Delete(info.imageKey);
    }
    await clearEntryImage(entryId);
  } catch (e) {
    console.error('画像削除失敗:', e);
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 502 });
  }

  // 画像が変わったのでOGP画像を再生成
  await refreshOgImage(entryId);

  return NextResponse.json({ success: true });
}
