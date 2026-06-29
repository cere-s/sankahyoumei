import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '免責事項',
  description: '本サービスの利用にあたっての免責事項',
};

export default function DisclaimerPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-900 mb-2">免責事項</h1>
      <p className="text-sm text-gray-500 mb-6">最終更新日：2026年6月24日</p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-6 text-sm text-gray-700 leading-relaxed">
        <section>
          <h2 className="font-bold text-gray-900 mb-1.5">1. 利用にあたっての基本方針</h2>
          <p>
            本サービス「コスいく」（以下「本サービス」）は、利用者ご自身の責任においてご利用ください。
            本サービスの利用または利用できなかったことによって生じたいかなる損害・不利益・トラブルについても、
            運営者は一切の責任を負いません。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-1.5">2. 掲載情報について</h2>
          <p>
            本サービスに掲載される情報（イベント情報、参加表明の内容を含みます）の正確性・最新性・完全性について、
            運営者は保証しません。とくに外部サイトから自動取得したイベント情報は「参加表明の対象候補」として
            提供するものであり、公式の開催情報そのものではありません。日程・会場・参加条件などは変更される場合があるため、
            参加前に必ず公式の情報をご確認ください。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-1.5">3. 利用者間のやり取りについて</h2>
          <p>
            参加表明や撮影・交流に関する利用者間のやり取り、約束、トラブル等について、運営者は一切関与せず、
            責任を負いません。参加表明は撮影や交流の許可を保証するものではなく、当日の対応は当事者間で
            合意のうえ行ってください。トラブルが生じた場合は当事者間で解決していただきます。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-1.5">4. 本人確認について</h2>
          <p>
            本サービスに表示されるX（旧Twitter）IDその他のアカウント情報について、運営者は本人確認を行っていません。
            なりすましや虚偽情報が含まれる可能性があることを理解したうえでご利用ください。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-1.5">5. 入力情報の取り扱いについて</h2>
          <p>
            本サービスに入力・登録された情報は、URLを知っている第三者から閲覧される可能性があります。
            個人情報や公開を望まない情報は入力しないでください。入力情報の公開によって生じた損害について、
            運営者は責任を負いません。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-1.5">6. サービスの変更・停止について</h2>
          <p>
            運営者は、利用者に事前に通知することなく、本サービスの内容を変更し、または提供を一時的・恒久的に
            停止することがあります。これによって生じた損害について、運営者は責任を負いません。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-1.5">7. 免責事項の変更について</h2>
          <p>
            本免責事項の内容は、予告なく変更されることがあります。変更後の内容は、本ページに掲載された時点で
            効力を生じるものとします。
          </p>
        </section>
      </div>

      <div className="mt-6 text-center">
        <Link href="/" className="text-sm text-violet-600 hover:underline">
          ← トップへ戻る
        </Link>
      </div>
    </div>
  );
}
