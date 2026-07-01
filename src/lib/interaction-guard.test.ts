import { describe, it, expect } from 'vitest';
import { canSendInteraction } from './interaction-guard';

describe('canSendInteraction', () => {
  it('ブロックなし・別ユーザー・公開なら送信可能', () => {
    expect(
      canSendInteraction({ viewerUserId: 'me', targetUserId: 'other', targetHidden: false, restrictedUserIds: [] })
    ).toBe(true);
  });

  it('自分自身の参加表明には送信不可', () => {
    expect(
      canSendInteraction({ viewerUserId: 'me', targetUserId: 'me', restrictedUserIds: [] })
    ).toBe(false);
  });

  it('対象参加表明が非表示なら送信不可', () => {
    expect(
      canSendInteraction({ viewerUserId: 'me', targetUserId: 'other', targetHidden: true, restrictedUserIds: [] })
    ).toBe(false);
  });

  it('対象に user_id がなければ送信不可', () => {
    expect(canSendInteraction({ viewerUserId: 'me', targetUserId: null, restrictedUserIds: [] })).toBe(false);
    expect(canSendInteraction({ viewerUserId: 'me', targetUserId: undefined, restrictedUserIds: [] })).toBe(false);
  });

  it('ブロック関係（双方向どちらでも）があれば送信不可', () => {
    // restrictedUserIds は「自分が関与するブロック相手」の集合なので、向きに関わらず対象が含まれれば不可
    expect(
      canSendInteraction({ viewerUserId: 'me', targetUserId: 'other', restrictedUserIds: ['other'] })
    ).toBe(false);
    // Set でも受け付ける
    expect(
      canSendInteraction({ viewerUserId: 'me', targetUserId: 'other', restrictedUserIds: new Set(['other']) })
    ).toBe(false);
  });
});
