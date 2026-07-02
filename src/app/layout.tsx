import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Geist, Zen_Kaku_Gothic_New, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { Header } from '@/components/Header';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';
import { MobileTabBar } from '@/components/MobileTabBar';
import { DemoBanner } from '@/components/DemoBanner';
import { InstallAppPrompt } from '@/components/InstallAppPrompt';
import { DEMO } from '@/lib/demo';
import { getSiteUrl } from '@/lib/site';
import './globals.css';

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
});

// 参加者カード・イベントヒーローの見出しにのみ使う強調書体（本文は引き続き Geist）
const zenKaku = Zen_Kaku_Gothic_New({
  variable: '--font-display',
  weight: ['700', '900'],
  subsets: ['latin'],
});

// 時間帯・件数などの計測値表示に使う等幅書体
const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono-data',
  weight: ['500', '700'],
  subsets: ['latin'],
});

const siteName = DEMO ? 'コスいく（デモ版）' : 'コスいく';
const description = '好きでつながる、コスプレ参加表明サイト。誰がどの作品・キャラで来るかが一覧でわかります。';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: siteName,
  title: { default: siteName, template: `%s｜コスいく` },
  description,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  // デモ版は検索エンジンに載せない
  robots: DEMO ? { index: false, follow: false } : undefined,
  openGraph: {
    title: siteName,
    description,
    type: 'website',
    locale: 'ja_JP',
    siteName: 'コスいく',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: '#ec4899',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geist.variable} ${zenKaku.variable} ${jetbrainsMono.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-gradient-to-b from-pink-50 via-white to-white antialiased">
        {DEMO && <DemoBanner />}
        <Header />
        <main className="flex-1 pb-16 sm:pb-0">{children}</main>
        <footer className="border-t border-gray-100 bg-white mt-12 py-6 pb-20 sm:pb-6 text-center text-xs text-gray-400 space-y-2">
          <p>
            本サービスの利用により生じた損害・トラブルについて運営者は一切の責任を負いません。
          </p>
          <p className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/organizers" className="text-gray-500 hover:text-violet-600 hover:underline">
              主催者の方へ
            </Link>
            <span className="text-gray-300">·</span>
            <Link href="/terms" className="text-gray-500 hover:text-violet-600 hover:underline">
              利用規約
            </Link>
            <span className="text-gray-300">·</span>
            <Link href="/privacy" className="text-gray-500 hover:text-violet-600 hover:underline">
              プライバシーポリシー
            </Link>
            <span className="text-gray-300">·</span>
            <Link href="/disclaimer" className="text-gray-500 hover:text-violet-600 hover:underline">
              免責事項
            </Link>
            <span className="text-gray-300">·</span>
            <Link href="/contact" className="text-gray-500 hover:text-violet-600 hover:underline">
              お問い合わせ
            </Link>
          </p>
          <p className="flex items-center justify-center gap-1.5 text-gray-500">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" className="w-4 h-4" />
            コスいく — 好きでつながる、コスプレ参加表明サイト
          </p>
        </footer>
        <AnalyticsTracker />
        <MobileTabBar />
        <InstallAppPrompt />
        <Analytics />
      </body>
    </html>
  );
}
