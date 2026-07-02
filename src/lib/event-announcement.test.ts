import { describe, expect, it } from 'vitest';
import { buildEventAnnouncementText } from './event-announcement';
import type { Event } from '@/types';

const baseEvent: Event = {
  id: 'event-1',
  name: 'テストイベント',
  date: '2026-08-09',
  location: '東京ビッグサイト',
  officialUrl: '',
  hashtag: '#テストイベント',
  description: '',
  region: '関東',
  status: 'published',
  createdBy: 'user-1',
};

describe('buildEventAnnouncementText', () => {
  it('イベント情報と参加表明ページURLを含む告知文を生成する', () => {
    const text = buildEventAnnouncementText(baseEvent, 'https://example.com/');

    expect(text).toContain('【イベント掲載のお知らせ】');
    expect(text).toContain('イベント：テストイベント');
    expect(text).toContain('開催日：2026年8月9日');
    expect(text).toContain('会場：東京ビッグサイト');
    expect(text).toContain('地域：関東');
    expect(text).toContain('https://example.com/events/event-1');
  });

  it('イベントハッシュタグにサービス共通タグを追加する', () => {
    const text = buildEventAnnouncementText(baseEvent, 'https://example.com');

    expect(text).toContain('#テストイベント #コスいく');
  });

  it('origin が空なら相対URLを使う', () => {
    const text = buildEventAnnouncementText(baseEvent, '');

    expect(text).toContain('/events/event-1');
  });
});
