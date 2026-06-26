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
      // OGP画像APIはSNSクローラに読ませる
      allow: ['/', '/api/og/'],
      // 認証・管理・APIは取得不可に。
      // 参加表明/参加者ページは SNS の OGP 取得を許可するため robots では禁止せず、
      // ページ側の noindex メタで検索インデックスのみ抑止する。
      disallow: ['/api/', '/auth/', '/mypage'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
