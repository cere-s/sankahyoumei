'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Tab {
  href: string;
  label: string;
  /** 現在地判定用のパス接頭辞（"/" は完全一致） */
  match: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  {
    href: '/',
    label: 'ホーム',
    match: '/',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" />
    ),
  },
  {
    href: '/events',
    label: '探す',
    match: '/events',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
    ),
  },
  {
    href: '/search',
    label: '参加表明',
    match: '/search',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 3.5l5 5M4 20l1-4L16.5 4.5a2.12 2.12 0 013 3L8 19l-4 1z" />
    ),
  },
  {
    href: '/#ranking',
    label: 'ランキング',
    match: '__none__',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21V10m7 11V4m7 17v-7" />
    ),
  },
  {
    href: '/mypage',
    label: 'マイページ',
    match: '/mypage',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8.5a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0zM4.5 20a7.5 7.5 0 0115 0" />
    ),
  },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-100 bg-white/95 backdrop-blur sm:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map((tab) => {
          const active = tab.match === '/' ? pathname === '/' : tab.match !== '__none__' && pathname.startsWith(tab.match);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  active ? 'text-violet-600' : 'text-gray-400 hover:text-violet-500'
                }`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  {tab.icon}
                </svg>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
