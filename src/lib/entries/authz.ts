/**
 * 参加表明の編集・削除権限の判定（純粋関数）。
 * updateEntry / hideEntry で同じ判定を使い、認可仕様を1か所に固定する。
 */
import { verifyToken } from '../token';

export interface EditPermissionInput {
  /** ログイン中ユーザーのID（未ログインなら null/undefined） */
  authUserId?: string | null;
  /** 参加表明の所有者ユーザーID（本人紐付けが無ければ null） */
  ownerUserId?: string | null;
  /** 旧トークン方式の編集トークン（平文） */
  token?: string | null;
  /** 保存済み編集トークンのハッシュ（無ければ null） */
  editTokenHash?: string | null;
}

/**
 * 編集・削除を許可してよいか。
 * - ログイン本人（authUserId === ownerUserId、いずれも空でない）なら許可
 * - 正しい編集トークンなら許可
 * それ以外（他人・誤トークン・未ログイン&トークン無し）は不許可。
 */
export function canEditEntry(input: EditPermissionInput): boolean {
  const ownerMatch = Boolean(
    input.authUserId && input.ownerUserId && input.authUserId === input.ownerUserId
  );
  const tokenMatch = Boolean(input.token && verifyToken(input.token, input.editTokenHash));
  return ownerMatch || tokenMatch;
}
