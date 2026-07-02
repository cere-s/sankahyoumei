import type { Event } from '@/types';
import { formatDate, tweetHashtags } from './utils';

export function buildEventAnnouncementText(event: Event, origin: string): string {
  const site = origin.replace(/\/+$/, '');
  const eventUrl = site ? `${site}/events/${event.id}` : `/events/${event.id}`;
  const tags = tweetHashtags(event.hashtag).map((tag) => `#${tag}`);
  const lines = [
    '【イベント掲載のお知らせ】',
    '',
    '新しく登録されたイベントを確認し、コスいくに掲載しました。',
    '',
    `イベント：${event.name}`,
    `開催日：${formatDate(event.date)}`,
    `会場：${event.location}`,
  ];

  if (event.region) lines.push(`地域：${event.region}`);

  lines.push('', '参加予定の方は、こちらから参加表明できます。', eventUrl);

  if (tags.length > 0) lines.push('', tags.join(' '));

  return lines.join('\n');
}
