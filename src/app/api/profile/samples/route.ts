import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { imageSize } from 'image-size';
import { getCurrentUser, addPhotographerSample, removePhotographerSample } from '@/lib/auth';
import { r2Configured, r2Put, r2Delete, r2PublicUrl } from '@/lib/r2';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { DEMO } from '@/lib/demo';

const MAX_BYTES = 3 * 1024 * 1024; // 3MB
const TYPE_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);

/** 被写体のXアカウント（任意）：先頭の@は許容、英数字とアンダースコアのみ、15文字まで */
function normalizeSubjectXId(raw: FormDataEntryValue | null): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim().replace(/^@/, '');
  if (!trimmed) return undefined;
  if (!/^[A-Za-z0-9_]{1,15}$/.test(trimmed)) {
    throw new Error('被写体のXアカウントの形式が正しくありません');
  }
  return trimmed;
}

// ---- 作例を1件追加 ----
export async function POST(request: NextRequest) {
  if (!rateLimit(`photographer-sample:${getClientIp(request)}`, 12, 60_000)) {
    return NextResponse.json({ error: 'リクエストが多すぎます。少し時間をおいてください。' }, { status: 429 });
  }

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

  let subjectXId: string | undefined;
  try {
    subjectXId = normalizeSubjectXId(form.get('subjectXId'));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '入力が正しくありません' }, { status: 400 });
  }

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

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const dim = imageSize(buffer);
    if (!dim.width || !dim.height) throw new Error();
  } catch {
    return NextResponse.json({ error: '画像を解析できませんでした' }, { status: 400 });
  }

  if (DEMO) {
    return NextResponse.json({
      samples: [{ url: 'https://placehold.co/600x600/dbeafe/1e40af?text=SAMPLE', key: `demo-${randomUUID()}`, subjectXId }],
    });
  }

  if (!r2Configured()) {
    console.error('R2 未設定のため作例アップロードを受け付けられません');
    return NextResponse.json({ error: '画像アップロードは現在利用できません' }, { status: 503 });
  }

  const normalizedExt = TYPE_EXT[contentType];
  const key = `${user.id}/samples/${randomUUID()}.${normalizedExt}`;
  const url = r2PublicUrl(key);

  try {
    await r2Put(key, buffer, contentType);
  } catch (e) {
    console.error('作例アップロード失敗:', e);
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 502 });
  }

  try {
    const samples = await addPhotographerSample(user.id, { url, key, subjectXId });
    return NextResponse.json({ samples });
  } catch (e) {
    // DB保存に失敗した場合はアップロード済みのR2オブジェクトを片付ける
    try {
      await r2Delete(key);
    } catch {
      // 片付け失敗はログのみ（次回一覧に出ない孤立ファイルとして残る）
      console.error('孤立した作例ファイルの削除に失敗:', key);
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : '保存に失敗しました' }, { status: 400 });
  }
}

// ---- 作例を1件削除 ----
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
  }

  const key = request.nextUrl.searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'keyが必要です' }, { status: 400 });
  }

  if (DEMO) {
    return NextResponse.json({ samples: [] });
  }

  try {
    const { removed, next } = await removePhotographerSample(user.id, key);
    if (removed && r2Configured()) {
      try {
        await r2Delete(removed.key);
      } catch (e) {
        console.error('作例ファイルの削除に失敗:', e);
      }
    }
    return NextResponse.json({ samples: next });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '削除に失敗しました' }, { status: 400 });
  }
}
