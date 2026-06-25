import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  // デモ版は全面的に検索エンジンへ載せない
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 個人ページ・認証・APIはインデックスさせない（プライバシー配慮）
      disallow: ['/api/', '/auth/', '/mypage', '/participants/', '/events/*/entries/'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
