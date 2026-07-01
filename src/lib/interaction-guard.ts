/**
 * 交流（意思表示）の送信可否の判定（純粋関数）。
 * 自己宛・非表示・所有者不明・ブロック関係を1か所で弾く。
 */
export interface SendInteractionInput {
  /** 送信しようとしているログインユーザーのID */
  viewerUserId: string;
  /** 対象参加表明の所有者ユーザーID（本人紐付けが無ければ null） */
  targetUserId?: string | null;
  /** 対象参加表明が非表示か */
  targetHidden?: boolean;
  /** 自分が関与するブロック相手（双方向）の user_id 集合 */
  restrictedUserIds: Iterable<string>;
}

/**
 * 意思表示を送ってよいか。
 * - 対象に所有者(user_id)がない、または非表示なら送信不可
 * - 自分自身の参加表明には送信不可
 * - ブロック関係（自分→相手／相手→自分どちらでも）があれば送信不可
 * それ以外は送信可能。
 */
export function canSendInteraction(input: SendInteractionInput): boolean {
  const { viewerUserId, targetUserId, targetHidden } = input;
  if (!targetUserId) return false;
  if (targetHidden) return false;
  if (targetUserId === viewerUserId) return false;
  const restricted =
    input.restrictedUserIds instanceof Set
      ? input.restrictedUserIds
      : new Set(input.restrictedUserIds);
  if (restricted.has(targetUserId)) return false;
  return true;
}
