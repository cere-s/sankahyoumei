import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';
import { getAllEvents } from '@/lib/events';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticPaths = ['', '/events', '/organizers', '/terms', '/privacy', '/disclaimer', '/contact'];
  const staticPages: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
  }));

  // イベント詳細は公開情報なので掲載（個人の参加表明ページは掲載しない）
  let eventPages: MetadataRoute.Sitemap = [];
  try {
    const events = await getAllEvents();
    eventPages = events.map((e) => ({ url: `${base}/events/${e.id}`, lastModified: now }));
  } catch {
    eventPages = [];
  }

  return [...staticPages, ...eventPages];
}
