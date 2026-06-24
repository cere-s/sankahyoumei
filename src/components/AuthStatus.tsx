import type { AuthStatus } from '@/types';

/** 一覧カード用のコンパクトな認証バッジ */
export function AuthStatusBadge({ status }: { status: AuthStatus }) {
  if (status === 'verified_x') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded-full font-medium self-center">
        Xログイン確認済み
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-full font-medium self-center">
      X未確認
    </span>
  );
}

/** 詳細ページ用の説明付き認証ブロック */
export function AuthStatusNotice({ status, xId }: { status: AuthStatus; xId: string }) {
  if (status === 'verified_x') {
    return (
      <div className="bg-sky-50 border border-sky-200 rounded-lg px-3 py-2.5 text-xs text-sky-800 leading-relaxed">
        <p className="font-bold">Xログイン確認済み</p>
        <p>この参加表明は @{xId} のXアカウントでログインして作成されています。</p>
        <p className="mt-1 text-sky-700/80">
          ※ Xログイン確認は本人のアカウントであることのみを示します。撮影・交流の許可を意味するものではありません。
        </p>
      </div>
    );
  }
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-xs text-gray-600 leading-relaxed">
      <p className="font-bold text-gray-700">X未確認</p>
      <p>この参加表明はXログイン確認されていません。表示されているX IDが本人のものとは限りません。</p>
    </div>
  );
}
