import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '利用規約 — コスプレ参加表明',
  description: '本サービスの利用規約',
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-900 mb-2">利用規約</h1>
      <p className="text-sm text-gray-500 mb-6">最終更新日：2026年6月24日</p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-6 text-sm text-gray-700 leading-relaxed">
        <section>
          <h2 className="font-bold text-gray-900 mb-1.5">1. サービスの位置づけ</h2>
          <p>
            本サービス「コスプレ参加表明」（以下「本サービス」）は、コスプレイベントへの参加表明の作成・検索を補助する
            <span className="font-medium">非公式サービス</span>です。各イベントの公式運営とは関係ありません。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-1.5">2. イベント情報について</h2>
          <p>
            本サービスに掲載されるイベント情報は変更・中止される場合があります。参加にあたっては、
            必ず各イベントの公式サイト・公式SNSで最新情報をご確認ください。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-1.5">3. 参加表明と撮影・交流について</h2>
          <p>
            参加表明は<span className="font-medium">撮影や交流の許可を意味するものではありません</span>。
            撮影・交流は本人の意思と当日の状況を最優先してください。Xログイン確認済みの表示も、
            本人のXアカウントであることを示すのみで、撮影許可を意味しません。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-1.5">4. 禁止事項</h2>
          <p>以下の行為を禁止します。</p>
          <ul className="list-disc pl-5 mt-1 space-y-0.5">
            <li>他人へのなりすまし</li>
            <li>晒し行為、誹謗中傷、嫌がらせなどの迷惑行為</li>
            <li>無断撮影、および撮影マナーに反する行為</li>
            <li>法令または公序良俗に反する行為</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-1.5">5. 免責</h2>
          <p>
            本サービスの利用により生じた損害・トラブルについて、運営者は一切の責任を負いません。
            詳細は<Link href="/disclaimer" className="text-violet-600 hover:underline">免責事項</Link>をご確認ください。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-1.5">6. 規約の変更</h2>
          <p>本規約は予告なく変更されることがあります。変更後の内容は本ページに掲載した時点で効力を生じます。</p>
        </section>
      </div>

      <div className="mt-6 text-center">
        <Link href="/" className="text-sm text-violet-600 hover:underline">← トップへ戻る</Link>
      </div>
    </div>
  );
}
