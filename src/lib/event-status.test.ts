import { describe, it, expect } from 'vitest';
import {
  isPublicEventStatus,
  canCreateEntryForEvent,
  canWithdrawOwnEvent,
} from './event-status';

describe('isPublicEventStatus', () => {
  it('published は公開対象', () => {
    expect(isPublicEventStatus('published')).toBe(true);
  });

  it('removed は公開対象外', () => {
    expect(isPublicEventStatus('removed')).toBe(false);
  });

  it('現行仕様: pending も公開対象（運営確認待ちでも参加者に見せる）', () => {
    expect(isPublicEventStatus('pending')).toBe(true);
  });

  it('status 未設定(null/undefined)は published 扱いで公開対象', () => {
    expect(isPublicEventStatus(null)).toBe(true);
    expect(isPublicEventStatus(undefined)).toBe(true);
  });
});

describe('canCreateEntryForEvent', () => {
  it('published イベントには参加表明できる', () => {
    expect(canCreateEntryForEvent({ status: 'published' })).toBe(true);
  });

  it('現行仕様: pending イベントにも参加表明できる', () => {
    expect(canCreateEntryForEvent({ status: 'pending' })).toBe(true);
  });

  it('removed イベントには参加表明できない', () => {
    expect(canCreateEntryForEvent({ status: 'removed' })).toBe(false);
  });

  it('存在しない(null/undefined)イベントには参加表明できない', () => {
    expect(canCreateEntryForEvent(null)).toBe(false);
    expect(canCreateEntryForEvent(undefined)).toBe(false);
  });
});

describe('canWithdrawOwnEvent', () => {
  const base = { createdBy: 'u1', status: 'pending' as const };

  it('作成者本人・pending・参加表明0件なら取り下げ可能', () => {
    expect(canWithdrawOwnEvent({ event: base, userId: 'u1', entryCount: 0 })).toBe(true);
  });

  it('作成者本人でも参加表明があれば取り下げ不可', () => {
    expect(canWithdrawOwnEvent({ event: base, userId: 'u1', entryCount: 1 })).toBe(false);
  });

  it('他人のイベントは取り下げ不可', () => {
    expect(canWithdrawOwnEvent({ event: base, userId: 'u2', entryCount: 0 })).toBe(false);
  });

  it('pending 以外（published/removed）は取り下げ不可', () => {
    expect(
      canWithdrawOwnEvent({ event: { createdBy: 'u1', status: 'published' }, userId: 'u1', entryCount: 0 })
    ).toBe(false);
  });

  it('存在しないイベントは取り下げ不可', () => {
    expect(canWithdrawOwnEvent({ event: null, userId: 'u1', entryCount: 0 })).toBe(false);
  });
});
