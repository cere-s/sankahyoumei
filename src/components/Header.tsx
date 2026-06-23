import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-violet-600 text-lg leading-tight">
          コスプレ参加表明
        </Link>
        <nav>
          <Link
            href="/events"
            className="text-sm text-gray-600 hover:text-violet-600 transition-colors"
          >
            イベント一覧
          </Link>
        </nav>
      </div>
    </header>
  );
}
