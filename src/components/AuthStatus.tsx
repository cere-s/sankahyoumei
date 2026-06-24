import type { AuthStatus } from '@/types';

/** 一覧カード用のコンパクトな認証バッジ。Xログイン確認済みは既定のため表示せず、未確認のみ警告する */
export function AuthStatusBadge({ status }: { status: AuthStatus }) {
  if (status === 'verified_x') return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-full font-medium self-center">
      X未確認
    </span>
  );
}

/** 詳細ページ用の認証ブロック。Xログイン確認済みは表示せず、未確認のみ注意を表示する */
export function AuthStatusNotice({ status }: { status: AuthStatus; xId?: string }) {
  if (status === 'verified_x') return null;
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-xs text-gray-600 leading-relaxed">
      <p className="font-bold text-gray-700">X未確認</p>
      <p>この参加表明はXログイン確認されていません。表示されているX IDが本人のものとは限りません。</p>
    </div>
  );
}
