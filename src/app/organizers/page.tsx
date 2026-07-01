import type { Metadata } from 'next';
import Link from 'next/link';
import { OrganizerAnnouncementCard } from '@/components/OrganizerAnnouncementCard';

export const metadata: Metadata = {
  title: '主催者の方へ',
  description:
    'コスいくは、参加予定者が任意で予定を共有するための補助的な参加表明サービスです。イベント参加申込・チケット購入・公式受付ではありません。掲載・修正・削除のご相談も承ります。',
};

// TODO: 主催者専用の問い合わせ導線が用意された場合は、この定数を差し替える
const CONTACT_HREF = '/contact';

const FEATURES: { title: string; desc: string }[] = [
  { title: '作品名・キャラ名を登録', desc: '当日どのキャラで参加するかを事前に共有できます。' },
  { title: '参加時間帯を登録', desc: '午前・昼・夜など、会える時間帯の目安がわかります。' },
  { title: '撮影相談可否を表示', desc: '撮影の相談ができるかどうかを本人が選んで表示できます。' },
  { title: '挨拶歓迎度を表示', desc: '声かけ・挨拶をどの程度歓迎するかを伝えられます。' },
  { title: '複数キャラを登録', desc: '1つのイベントで複数の予定キャラを登録できます。' },
  { title: 'カメラマンの撮りたい作品', desc: 'カメラマンは撮りたい作品・キャラを登録できます。' },
  { title: 'Xログインで本人性を確認', desc: 'Xログインにより、本人のアカウントであることを確認できます。' },
  { title: '参加表明画像を登録', desc: '衣装やイメージがわかる画像を任意で添えられます。' },
];

const MERITS: string[] = [
  'イベント前の盛り上がりが見えるようになります。',
  'X上に散らばりがちな参加表明を、イベント単位で確認しやすくなります。',
  '参加者同士の交流や、当日の撮影予定づくりにつながります。',
  '「誰が来るか」が見えることで、初参加の方の不安軽減につながります。',
  '告知やリポストのネタとしても使いやすくなります。',
];

const WORKLOAD: { label: string; value: string }[] = [
  { label: '費用', value: '現時点では無料でご利用いただけます。' },
  { label: '作業', value: '告知・リポストのみでもご利用いただけます。' },
  { label: '修正', value: '掲載内容の修正依頼に対応します。' },
  { label: '削除', value: '掲載停止（削除）の依頼に対応します。' },
  { label: '問い合わせ', value: 'コスいく上の表示・登録内容はコスいく側で確認します。' },
];

const STEPS: { title: string; desc: string }[] = [
  { title: 'コスいくがイベントページを作成', desc: 'イベント情報をもとに、参加表明ページを用意します。' },
  { title: '主催者様が必要に応じて案内・リポスト', desc: '参加者向けの補助導線として、任意でご案内いただけます。' },
  { title: '参加者が予定を登録', desc: '参加者が作品・キャラ・参加時間帯・撮影相談可否などを登録します。' },
];

const REQUESTS: string[] = [
  'イベントページを作成してほしい',
  'イベント情報を修正してほしい',
  '公式URLやハッシュタグを追加してほしい',
  '掲載を停止してほしい',
  '参加者向けの案内文がほしい',
];

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: 'コスいくを使うのに費用はかかりますか？',
    a: '現時点では、主催者様・参加者様ともに無料でご利用いただけます。',
  },
  {
    q: '公式サービスとして案内する必要がありますか？',
    a: '必須ではありません。まずは参加者向けの補助的な参加表明ページとしてご案内いただく形で問題ありません。',
  },
  {
    q: 'イベント参加申込と間違われませんか？',
    a: 'ページ上で、コスいくは参加申込・チケット購入とは別の参加予定共有サービスであることを明記しています。',
  },
  {
    q: '掲載をやめたい場合はどうすればいいですか？',
    a: 'お問い合わせよりご連絡ください。確認のうえ、イベントページの修正または掲載停止に対応します。',
  },
  {
    q: '参加者同士のトラブル対応はどうなりますか？',
    a: 'コスいく上の登録内容・表示・問い合わせについてはコスいく側で確認します。会場内のルール、参加条件、撮影ルールについては主催者様の公式案内に従う形です。',
  },
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-gray-900 mb-3">{children}</h2>;
}

export default function OrganizersPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
      {/* 1. ファーストビュー */}
      <section>
        <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-violet-500 text-white p-6 sm:p-8 shadow-sm">
          <p className="text-xs font-bold text-violet-100 mb-2">主催者の方へ</p>
          <h1 className="text-2xl sm:text-3xl font-bold leading-snug mb-3">
            コスプレイベントの参加表明を、もっと見つけやすく
          </h1>
          <p className="text-sm sm:text-base text-violet-50 leading-relaxed">
            コスいくは、イベント前に「誰に会えるか」「何を撮れるか」を見えるようにする参加表明サービスです。
          </p>
        </div>

        {/* 位置づけの注記カード */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800 leading-relaxed">
            コスいくは、<span className="font-bold">イベント参加申込・チケット購入・公式受付を代替するものではありません</span>。
            参加予定者が任意で予定を共有するための補助サービスです。
          </p>
        </div>

        {/* CTA */}
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <Link
            href={CONTACT_HREF}
            className="flex-1 text-center bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-xl px-5 py-3 font-bold text-sm hover:opacity-90 transition-opacity"
          >
            イベント掲載について問い合わせる
          </Link>
          <a
            href="#template"
            className="flex-1 text-center bg-white border border-violet-200 text-violet-700 rounded-xl px-5 py-3 font-bold text-sm hover:bg-violet-50 transition-colors"
          >
            サンプルの案内文を見る
          </a>
        </div>
      </section>

      {/* 2. コスいくでできること */}
      <section>
        <SectionHeading>コスいくでできること</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-bold text-gray-900 mb-1">{f.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 主催者様にとってのメリット */}
      <section>
        <SectionHeading>主催者様にとってのメリット</SectionHeading>
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          参加者向けの補助的な導線として、次のような形でお使いいただけます。
        </p>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <ul className="space-y-2.5">
            {MERITS.map((m) => (
              <li key={m} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
                <svg className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4. 主催者様側の作業について */}
      <section>
        <SectionHeading>主催者様側の作業について</SectionHeading>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <dl className="divide-y divide-gray-100">
            {WORKLOAD.map((w) => (
              <div key={w.label} className="flex gap-3 px-4 py-3">
                <dt className="w-20 shrink-0 text-sm font-bold text-violet-700">{w.label}</dt>
                <dd className="text-sm text-gray-700 leading-relaxed">{w.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 5. 利用の流れ */}
      <section>
        <SectionHeading>利用の流れ</SectionHeading>
        <ol className="space-y-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <span className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 text-white text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-bold text-gray-900">{s.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 6. 参加申込ではないことの明記（視認性高） */}
      <section>
        <div className="rounded-2xl border-2 border-orange-300 bg-orange-50 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-base font-bold text-orange-800">参加申込ではありません</p>
          </div>
          <p className="text-sm text-orange-800 leading-relaxed">
            コスいくは、イベント参加申込・チケット購入・公式受付ではありません。
            参加者は必ず主催者様の公式案内、参加規約、チケット情報に従う必要があります。
          </p>
        </div>
      </section>

      {/* 7. 掲載・修正・削除について */}
      <section>
        <SectionHeading>掲載・修正・削除について</SectionHeading>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-600 mb-3 leading-relaxed">次のようなご相談を承っています。</p>
          <ul className="space-y-2">
            {REQUESTS.map((r) => (
              <li key={r} className="flex gap-2 text-sm text-gray-700">
                <span className="text-violet-400 shrink-0">・</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
          <Link
            href={CONTACT_HREF}
            className="mt-5 inline-block w-full sm:w-auto text-center bg-violet-600 text-white rounded-xl px-6 py-3 font-bold text-sm hover:bg-violet-700 transition-colors"
          >
            掲載・修正・削除について問い合わせる
          </Link>
        </div>
      </section>

      {/* 8. 主催者向け案内文テンプレート */}
      <section id="template" className="scroll-mt-20">
        <SectionHeading>主催者向け案内文テンプレート</SectionHeading>
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          そのままXに投稿できる案内文です。ご自由にご利用ください。
        </p>
        <OrganizerAnnouncementCard />
      </section>

      {/* 9. FAQ */}
      <section>
        <SectionHeading>よくあるご質問</SectionHeading>
        <div className="space-y-2.5">
          {FAQS.map((f) => (
            <details key={f.q} className="group bg-white rounded-xl border border-gray-100 shadow-sm">
              <summary className="cursor-pointer list-none px-4 py-3.5 flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-gray-900">{f.q}</span>
                <svg className="w-4 h-4 text-gray-400 shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <p className="px-4 pb-4 pt-0 text-sm text-gray-600 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 10. 最下部CTA */}
      <section>
        <div className="rounded-2xl bg-gradient-to-br from-pink-500 to-violet-500 text-white p-6 sm:p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold mb-2">イベント掲載・修正のご相談はこちら</h2>
          <p className="text-sm text-pink-50 leading-relaxed mb-5">
            イベントページの作成、掲載内容の修正、削除依頼、参加者向け案内文の作成などは、お問い合わせよりご連絡ください。
          </p>
          <Link
            href={CONTACT_HREF}
            className="inline-block bg-white text-violet-700 rounded-xl px-8 py-3 font-bold text-sm hover:bg-violet-50 transition-colors"
          >
            主催者として問い合わせる
          </Link>
        </div>
      </section>

      <div className="text-center">
        <Link href="/" className="text-sm text-violet-600 hover:underline">← トップへ戻る</Link>
      </div>
    </div>
  );
}
