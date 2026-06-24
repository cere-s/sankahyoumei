import Link from 'next/link';
import { getCurrentAuth } from '@/lib/auth';
import { XLoginButton } from '@/components/auth/XLoginButton';
import { LogoutButton } from '@/components/auth/LogoutButton';

export async function Header() {
  const { user, profile } = await getCurrentAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="font-bold text-violet-600 text-lg leading-tight shrink-0">
          コスプレ参加表明
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/events" className="text-sm text-gray-600 hover:text-violet-600 transition-colors">
            イベント一覧
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              {profile?.xAvatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.xAvatarUrl} alt="" className="w-6 h-6 rounded-full" />
              )}
              {profile?.xUsername && (
                <span className="text-xs text-gray-600 hidden sm:inline">@{profile.xUsername}</span>
              )}
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
