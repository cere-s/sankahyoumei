import { randomUUID } from 'crypto';
import { imageSize } from 'image-size';
import { r2Put, r2PublicUrl } from './r2';

const MAX_BYTES = 3 * 1024 * 1024; // 3MB
const TYPE_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);

export interface ValidatedImage {
  buffer: Buffer;
  contentType: string;
  /** 正規化した拡張子 */
  ext: string;
  width: number;
  height: number;
}

/** Content-Type と拡張子の両方を検証し、寸法も取得する。不正なら利用者向けエラーを throw */
export async function validateImageFile(file: File): Promise<ValidatedImage> {
  const contentType = file.type;
  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  if (!TYPE_EXT[contentType] || !ALLOWED_EXT.has(ext)) {
    throw new Error('jpg / jpeg / png / webp 形式の画像のみアップロードできます');
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    throw new Error('画像は3MB以下にしてください');
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  let width = 0;
  let height = 0;
  try {
    const dim = imageSize(buffer);
    width = dim.width ?? 0;
    height = dim.height ?? 0;
  } catch {
    throw new Error('画像を解析できませんでした');
  }
  if (!width || !height) throw new Error('画像を解析できませんでした');
  return { buffer, contentType, ext: TYPE_EXT[contentType], width, height };
}

export interface UploadedImage {
  imageUrl: string;
  imageKey: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
}

/** 検証済み画像を R2 へアップロードして DB保存用の値を返す */
export async function uploadEntryImage(
  v: ValidatedImage,
  userId: string,
  entryId: string,
  displayName: string
): Promise<UploadedImage> {
  const key = `${userId}/${entryId}/${randomUUID()}.${v.ext}`;
  await r2Put(key, v.buffer, v.contentType);
  return {
    imageUrl: r2PublicUrl(key),
    imageKey: key,
    imageAlt: `${displayName} の参加表明画像`,
    imageWidth: v.width,
    imageHeight: v.height,
  };
}
