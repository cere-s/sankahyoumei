import type { Metadata } from 'next';
import Link from 'next/link';
import { Geist } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { Header } from '@/components/Header';
import { BetaBanner } from '@/components/BetaBanner';
import './globals.css';

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'コスプレ参加表明',
  description: 'コスプレイベントへの参加を簡単に表明・検索できるサービス',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-gray-50 antialiased">
        <BetaBanner />
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-100 bg-white mt-12 py-6 text-center text-xs text-gray-400 space-y-2">
          <p>
            本サービスの利用により生じた損害・トラブルについて運営者は一切の責任を負いません。
          </p>
          <p className="flex items-center justify-center gap-3 flex-wrap">
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
          <p>コスプレ参加表明 — イベント参加をもっと楽しく</p>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
