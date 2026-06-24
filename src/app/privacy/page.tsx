import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プライバシーポリシー — コスプレ参加表明',
  description: '本サービスのプライバシーポリシー',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-900 mb-2">プライバシーポリシー</h1>
      <p className="text-sm text-gray-500 mb-6">最終更新日：2026年6月24日</p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-6 text-sm text-gray-700 leading-relaxed">
        <section>
          <h2 className="font-bold text-gray-900 mb-1.5">1. Xログイン時に取得する情報</h2>
          <p>Xアカウントでログインした場合、X（Twitter）から以下の公開情報を取得する場合があります。</p>
          <ul className="list-disc pl-5 mt-1 space-y-0.5">
            <li>XユーザーID</li>
            <li>Xユーザー名（@で始まるID）</li>
            <li>表示名</li>
            <li>アイコン画像のURL</li>
          </ul>
          <p className="mt-1">
            X投稿、フォロー、DM、いいねなどの情報は取得しません。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-1.5">2. 利用目的</h2>
          <ul className="list-disc pl-5 space-y-0.5">
            <li>なりすまし防止（Xログイン確認済み表示）</li>
            <li>参加表明の表示</li>
            <li>アカウント管理（本人の参加表明の編集・削除）</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-1.5">3. 取得情報の取り扱い</h2>
          <p>
            取得した上記のXプロフィール情報は本サービスのデータベースに保存し、参加表明の表示などに利用します。
            Xのアクセストークンその他の秘密情報を第三者に公開することはありません。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-1.5">4. 参加表明情報の公開について</h2>
          <p>
            入力・登録された参加表明の情報（表示名・X ID・コメント等）は、
            本サービスを利用する他のユーザーから閲覧される可能性があります。
            公開を望まない情報は入力しないでください。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-1.5">5. お問い合わせ</h2>
          <p>
            本ポリシーに関するお問い合わせは
            <Link href="/contact" className="text-violet-600 hover:underline">お問い合わせフォーム</Link>
            よりご連絡ください。
          </p>
        </section>
      </div>

      <div className="mt-6 text-center">
        <Link href="/" className="text-sm text-violet-600 hover:underline">← トップへ戻る</Link>
      </div>
    </div>
  );
}
