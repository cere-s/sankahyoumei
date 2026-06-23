import { randomBytes, createHash, timingSafeEqual } from 'crypto';

/** 64文字のランダムトークンを生成 */
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/** SHA-256 ハッシュ（DB保存用） */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** 平文トークンと保存済みハッシュを定数時間で照合する */
export function verifyToken(token: string, storedHash: string | null | undefined): boolean {
  if (!storedHash) return false;
  const a = Buffer.from(hashToken(token), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
