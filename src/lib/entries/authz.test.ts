import { describe, it, expect } from 'vitest';
import { canEditEntry } from './authz';
import { hashToken } from '../token';

const TOKEN = 'a'.repeat(64);
const TOKEN_HASH = hashToken(TOKEN);

describe('canEditEntry', () => {
  it('authUserId === ownerUserId なら編集可能', () => {
    expect(canEditEntry({ authUserId: 'u1', ownerUserId: 'u1' })).toBe(true);
  });

  it('正しい編集トークンなら編集可能', () => {
    expect(canEditEntry({ token: TOKEN, editTokenHash: TOKEN_HASH })).toBe(true);
  });

  it('他人ユーザーは編集不可', () => {
    expect(canEditEntry({ authUserId: 'u2', ownerUserId: 'u1' })).toBe(false);
  });

  it('間違ったトークンでは編集不可', () => {
    expect(canEditEntry({ token: 'wrong', editTokenHash: TOKEN_HASH })).toBe(false);
  });

  it('ログインなし・トークンなしでは編集不可', () => {
    expect(canEditEntry({})).toBe(false);
    expect(canEditEntry({ authUserId: null, token: null })).toBe(false);
  });

  it('ownerUserId が null なら本人一致でも編集不可', () => {
    // authUserId があっても owner 側が null なら誤って一致扱いにしない
    expect(canEditEntry({ authUserId: 'u1', ownerUserId: null })).toBe(false);
  });

  it('editTokenHash が null ならトークン編集不可', () => {
    expect(canEditEntry({ token: TOKEN, editTokenHash: null })).toBe(false);
  });

  it('本人一致とトークンのどちらか一方が成立すれば可能', () => {
    // 本人不一致でも正しいトークンがあれば true
    expect(canEditEntry({ authUserId: 'u2', ownerUserId: 'u1', token: TOKEN, editTokenHash: TOKEN_HASH })).toBe(true);
  });
});
