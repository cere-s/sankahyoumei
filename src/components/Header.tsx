import Link from 'next/link';
import { getCurrentAuth } from '@/lib/auth';
import { XLoginButton } from '@/components/auth/XLoginButton';
import { LogoutButton } from '@/components/auth/LogoutButton';

export async function Header() {
  const { user, profile } = await getCurrentAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" className="w-8 h-8" />
          <span className="font-bold text-lg leading-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">
            コスいく
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/events" className="text-sm text-gray-600 hover:text-pink-500 transition-colors">
            イベント一覧
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/mypage"
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                {profile?.xAvatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.xAvatarUrl} alt="" className="w-6 h-6 rounded-full" />
                )}
                <span className="text-xs text-gray-600 hidden sm:inline">
                  {profile?.xUsername ? `@${profile.xUsername}` : 'マイページ'}
                </span>
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <XLoginButton
              label="Xでログイン"
              className="inline-flex items-center gap-1.5 bg-black text-white rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-gray-800 transition-colors"
            />
          )}
        </nav>
      </div>
    </header>
  );
}
