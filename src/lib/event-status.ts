/**
 * イベントの公開状態・参加表明可否・取り下げ可否の判定（純粋関数）。
 * DBアクセスから切り離し、公開仕様を1か所に固定する。
 */
import type { Event, EventStatus } from '@/types';

/**
 * 公開対象の状態か。
 * 'removed'（取り下げ）だけが公開対象外で、'published' と 'pending' は公開対象。
 * status が未設定(null/undefined)の場合も published 扱い（既定）で公開対象とする。
 */
export function isPublicEventStatus(status?: EventStatus | null): boolean {
  return status !== 'removed';
}

/**
 * このイベントに参加表明を作成してよいか。
 * 取り下げ済み('removed')・存在しない(null/undefined)イベントには作成できない。
 * 現行仕様では 'pending'（運営確認待ち）のイベントにも参加表明できる。
 */
export function canCreateEntryForEvent(
  event: Pick<Event, 'status'> | null | undefined
): boolean {
  if (!event) return false;
  return isPublicEventStatus(event.status);
}

export interface WithdrawOwnEventInput {
  event: { createdBy?: string | null; status?: EventStatus | null } | null | undefined;
  userId: string;
  entryCount: number;
}

/**
 * 登録者本人による取り下げが可能か。
 * 作成者本人・かつ 'pending'・かつ参加表明が0件のときだけ取り下げできる。
 * 他人のイベント、参加表明が1件以上あるイベントは取り下げ不可。
 */
export function canWithdrawOwnEvent({ event, userId, entryCount }: WithdrawOwnEventInput): boolean {
  if (!event) return false;
  if (event.createdBy !== userId) return false;
  if (event.status !== 'pending') return false;
  if (entryCount > 0) return false;
  return true;
}
