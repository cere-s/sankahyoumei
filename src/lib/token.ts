import { randomBytes, createHash } from 'crypto';

/** 64文字のランダムトークンを生成 */
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/** SHA-256 ハッシュ（DB保存用） */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
