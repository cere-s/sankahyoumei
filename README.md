# コスプレ参加表明

コスプレイベントへの参加を表明・検索できるサービスです。

> **現在は身内検証中です。**  
> 入力内容はURLを知っている方から閲覧される可能性があります。  
> 個人情報や公開したくない情報は入力しないでください。  
> 参加表明は撮影許可を意味しません。

---

## 技術スタック

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Supabase (Database + RLS)
- Vercel (ホスティング)
- Cloudflare Workers（`@opennextjs/cloudflare`、Vercelと並行稼働）

---

## Webページ仕様

### サービス概要

「コスいく」は、コスプレイベントごとに参加予定者が任意で予定を共有する参加表明サービスです。
イベント参加申込・チケット購入・公式受付を代替するものではありません。参加者は必ず主催者の公式案内、参加規約、チケット情報に従う必要があります。

### 公開ページ

| パス | 内容 |
|---|---|
| `/` | トップページ。新着の参加表明、開催予定イベント、参加人数ランキングを表示 |
| `/events` | イベント一覧。キーワード検索、地方タブ、開催予定・終了イベントの分離表示に対応 |
| `/search` | 作品・キャラで参加表明を横断検索。作品／キャラのチップを選ぶと該当するコスプレ参加表明を一覧表示 |
| `/events/[eventId]` | イベント詳細。日付、会場、公式URL、公式X、参加表明一覧、交流ボタンを表示 |
| `/events/new` | ログインユーザーによるイベント登録フォーム |
| `/events/[eventId]/entries/new` | ログインユーザーによる参加表明フォーム |
| `/events/[eventId]/entries/[entryId]` | 参加表明詳細。作品・キャラ、撮影相談可否、画像、X導線などを表示 |
| `/events/[eventId]/entries/[entryId]/edit` | 参加表明編集ページ。本人ログインまたは編集トークンで編集可能 |
| `/participants/[xId]` | 指定Xアカウントの参加表明一覧 |
| `/mypage` | ログインユーザーの参加表明、登録イベント、受信・送信した交流意思表示、ブロック一覧 |
| `/organizers` | 主催者向け案内ページ |
| `/contact` | お問い合わせフォーム |
| `/terms` | 利用規約 |
| `/privacy` | プライバシーポリシー |
| `/disclaimer` | 免責事項 |
| `/admin/events` | 管理者向けイベント確認ページ。`ADMIN_USER_IDS` に含まれるユーザーのみ閲覧可能 |

### イベント仕様

- イベントは `published` / `pending` / `removed` の状態を持ちます。
- 初期データや外部インポートイベントは原則 `published` として表示されます。
- ユーザーが `/events/new` から登録したイベントは `pending` として作成され、ページ上に「運営確認待ち」バッジを表示します。
- `removed` のイベントは公開ページ、参加表明作成、参加表明API取得の対象外です。
- イベント登録には X ログインが必須です。
- イベント登録時は、公式サイトURLまたは公式X URLのどちらかが必須です。
- 公式サイトURLは `http:` / `https:` のみ、公式X URLは `x.com` / `twitter.com` のみ許可します。
- 同一日・近いイベント名の既存イベントがある場合は重複候補を表示し、利用者が確認してから登録できます。
- ユーザー投稿イベントは、作成者本人が `pending` かつ参加表明0件の場合のみ取り下げできます。
- 管理者は `/admin/events` からイベントの公開、取り下げ、内容修正を行えます。

### 参加表明仕様

- 参加表明の作成には X ログインが必須です。
- X ID はフォーム入力ではなく、ログイン中の Supabase Auth / X プロフィールから確定します。
- 参加スタイルは `cosplay` / `photographer` / `general` / `undecided` の4種類です。
- コスプレ参加者は作品名・キャラ名・複数予定キャラ・撮影や交流のスタンスを登録できます。
- カメラマンは撮りたい作品・キャラ、作例URL、撮影スタイルを登録できます。
- 一般参加・未定は好きな作品、会いたい作品、参加時間帯、挨拶歓迎度、撮影相談可否を登録できます。
- 参加表明には任意で画像を添付できます。対応形式は `jpg` / `jpeg` / `png` / `webp`、上限は3MBです。
- 参加表明作成時に編集トークンを発行します。DBにはトークンのSHA-256ハッシュのみ保存します。
- 編集は、作成者本人のログインまたは編集トークンで行えます。
- 削除は物理削除ではなく `is_hidden` による非表示です。
- 参加表明詳細ページでは、URL上のイベントIDと参加表明のイベントIDが一致しない場合は404にします。
- 入力値はサーバー側で文字数制限、URL制限、enum制限、配列件数制限を行います。

### 交流機能

- ログインユーザーは他ユーザーの参加表明に対して、次の意思表示を送れます。
  - 撮りたい
  - 撮られたい
  - 交流したい
- 自分自身の参加表明には意思表示できません。
- 同じ参加表明・同じ種類の意思表示はトグルで取り消しできます。
- 受信した意思表示はマイページで確認できます。
- 受信した意思表示は自分の画面から非表示にできます。
- ユーザー単位のブロックに対応し、ブロック関係にある相手とは相互に意思表示できません。

### OGP / 共有仕様

- イベントページと参加表明ページは OGP 画像に対応しています。
- 参加表明作成・編集・画像更新時に、可能であれば R2 に静的OGP画像を生成して保存します。
- R2未設定または生成失敗時は `/api/og/event` / `/api/og/participation` の動的生成にフォールバックします。
- 参加表明詳細には X 投稿用の共有テキスト導線があります。

### 検索・公開範囲

- イベント一覧はイベント名、会場、ハッシュタグ、主催者名で検索できます。
- `/search` では作品・キャラで参加表明を横断検索できます。対象はコスプレ参加表明で、当日の予定（`cosplay_plans`）を主対象に、旧データの作品名・キャラ名も部分一致で拾います（初期表示は最大100件）。
- 地方タブは登録済みイベントの `region` をもとに表示されます。
- 参加表明は非表示でない限り、URLを知っている利用者から閲覧できます。
- `sitemap.xml` には静的ページとイベント詳細を掲載します。個人の参加表明ページは掲載しません。
- `robots.txt` では認証、管理、一般APIのクロールを抑制します。OGP画像APIはSNSクローラ向けに許可します。

### 管理・通報・問い合わせ

- 参加表明詳細から通報できます。通報は Resend 経由で運営宛に送信します。
- `/contact` から要望、不具合、質問、その他のお問い合わせを送信できます。
- メール送信には `RESEND_API_KEY` と送信先メール環境変数が必要です。
- 管理者判定は `ADMIN_USER_IDS` による Supabase Auth ユーザーIDの allowlist です。

---

## セットアップ手順

### 1. Supabase プロジェクト作成

1. [supabase.com](https://supabase.com) でアカウント作成
2. "New Project" でプロジェクト作成
3. **Settings → API** から以下をメモ
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

### 2. DBスキーマを作成

Supabase ダッシュボードの **SQL Editor** で `supabase/schema.sql` を実行します。

### 3. 初期イベントデータを投入

同じく SQL Editor で `supabase/seed.sql` を実行します。

### 4. 環境変数を設定

```bash
cp .env.example .env.local
```

`.env.local` を編集：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

必要に応じて、次の環境変数も設定します。詳細は `.env.example` を参照してください。

| 用途 | 変数 |
|---|---|
| Supabase公開キー | `NEXT_PUBLIC_SUPABASE_ANON_KEY` または `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| デモモード | `NEXT_PUBLIC_DEMO_MODE` |
| 通報・問い合わせメール | `RESEND_API_KEY`, `REPORT_EMAIL_TO`, `REPORT_EMAIL_FROM`, `CONTACT_EMAIL_TO` |
| 画像アップロード / 静的OGP画像 | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL` |
| 管理者 | `ADMIN_USER_IDS` |
| OGP一括再生成 | `OG_REFRESH_SECRET` |

> `.env.local` は Git にコミットしないでください（.gitignore 済み）

### 5. ローカル起動

```bash
npm install
npm run dev
# → http://localhost:3000
```

---

## Vercel デプロイ手順

1. [vercel.com](https://vercel.com) でリポジトリをインポート
2. **Settings → Environment Variables** で以下を設定

   | 変数名 | 値 |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
   | `NEXT_PUBLIC_SITE_URL` | デプロイURL（例: `https://yourapp.vercel.app`） |
   | `RESEND_API_KEY` | 通報・問い合わせメール送信用。メール機能を使う場合に設定 |
   | `REPORT_EMAIL_TO` | 通報メールの送信先 |
   | `CONTACT_EMAIL_TO` | お問い合わせメールの送信先。未設定時は `REPORT_EMAIL_TO` を使用 |
   | `R2_ACCOUNT_ID` などの R2 変数 | 画像アップロードと静的OGP画像を使う場合に設定 |
   | `ADMIN_USER_IDS` | 管理者の Supabase Auth ユーザーID。カンマ区切り |
   | `OG_REFRESH_SECRET` | `/api/admin/refresh-og` を使う場合に設定 |

3. Deploy

---

## Cloudflare Workers デプロイ手順

Vercelと並行して、[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) を使い Cloudflare Workers上でも同じアプリを動かせます（静的サイトではなく、SSR・API routes・middlewareがフル動作するWorkers上での実行です）。

### 1. リポジトリ連携（Workers Builds）

1. [Cloudflareダッシュボード](https://dash.cloudflare.com/) → **Workers & Pages** → **Import a repository** から本リポジトリを接続
2. Build command: `npx opennextjs-cloudflare build`
3. Deploy command: `npx opennextjs-cloudflare deploy`

push するたびに自動でビルド・デプロイされます（Workers Builds）。

### 2. 環境変数の設定

Cloudflareでは設定場所が2箇所に分かれます。

- **ビルド時に必要な変数**（Workers Builds の **Settings → Build → Build variables and secrets**）
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`（または `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`）
  - `NEXT_PUBLIC_SITE_URL` — デプロイ先のURL（例: `https://sankahyoumei.your-subdomain.workers.dev`）。**Cloudflareには Vercel の `VERCEL_URL` に相当する自動環境変数が無いため、必ず明示的に設定してください**（[`src/lib/site.ts`](src/lib/site.ts) の `getSiteUrl()` は `NEXT_PUBLIC_SITE_URL` を最優先し、未設定だと `localhost` にフォールバックしてしまいます）
  - `NEXT_PUBLIC_DEMO_MODE`（デモ環境の場合）
- **サーバー専用シークレット**（Worker本体の **Settings → Variables and Secrets**、Secret種別で設定）
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY`, `REPORT_EMAIL_TO`, `REPORT_EMAIL_FROM`, `CONTACT_EMAIL_TO`
  - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL`
  - `ADMIN_USER_IDS`
  - `OG_REFRESH_SECRET`

### 3. Supabase側の追加設定

SupabaseのAuth設定（Redirect URLs）に、Cloudflareの本番URL（`*.workers.dev` またはカスタムドメイン）を追加してください。追加しないと、Cloudflare上でのXログイン後のリダイレクトが失敗します。

### 4. ローカルでの動作確認

```bash
npm run build      # next build
npm run preview    # opennextjs-cloudflare build && opennextjs-cloudflare preview（Workers runtime相当でローカル確認）
npm run deploy:cf   # opennextjs-cloudflare build && opennextjs-cloudflare deploy（CLIから手動デプロイしたい場合）
```

### 5. 技術的な補足

- 全ページ `export const dynamic = 'force-dynamic'` で、ISR/`revalidate` は未使用のため、Incremental Cache用R2バケットや `WORKER_SELF_REFERENCE` バインディングは設定していません
- `wrangler.jsonc` の `nodejs_compat` フラグにより、`@aws-sdk/client-s3`（[`src/lib/r2.ts`](src/lib/r2.ts)）、`resend`、`@supabase/ssr`（[`src/middleware.ts`](src/middleware.ts)）がそのまま動作します
- DB（Supabase Postgres）・認証（Supabase Auth）・画像ストレージ（Cloudflare R2）は変更していません。Cloudflareに移すのはNext.jsのサーバー処理（Workers）のみです

### 6. 将来のTODO：`@vercel/analytics` の撤去

現時点では `@vercel/analytics`（[`src/app/layout.tsx`](src/app/layout.tsx) の `<Analytics />`）をそのまま残しています。Cloudflare上ではこの計測ビーコンが単に404するだけで、表示・機能には影響しません。VercelとCloudflareの並行稼働を検証し、Vercel側の運用を縮小・廃止するタイミングで、`<Analytics />` と `import`、`package.json` の依存を削除してください（内製の `AnalyticsTracker` はVercelに依存しないため、この撤去とは無関係にそのまま使えます）。

---

## ファイル構成

```
src/
├── app/
│   ├── api/entries/            # 参加表明 CRUD API
│   ├── api/events/             # イベント登録・取り下げ API
│   ├── api/interactions/       # 交流意思表示・ブロック API
│   ├── api/og/                 # OGP画像生成 API
│   ├── admin/events/           # 管理者向けイベント確認
│   ├── events/                 # イベント一覧・イベント登録
│   ├── events/[eventId]/
│   │   ├── entries/new/        # 参加表明フォーム
│   │   └── entries/[entryId]/
│   │       ├── page.tsx        # 参加表明詳細
│   │       └── edit/page.tsx   # 参加表明編集
│   ├── mypage/                 # マイページ
│   ├── organizers/             # 主催者向け案内
│   ├── participants/[xId]/     # Xアカウント別の参加表明一覧
│   └── page.tsx                # トップ
├── components/
├── lib/
│   ├── supabase/server.ts      # サーバー用Supabaseクライアント
│   ├── events.ts               # イベントDB操作
│   ├── entries.ts              # 参加表明DB操作（createEntry/updateEntry/hideEntry）
│   ├── interactions.ts         # 交流意思表示・ブロック操作
│   ├── validation.ts           # 入力値の共通バリデーション
│   ├── token.ts                # トークン生成・ハッシュ（SHA-256）
│   └── site.ts                 # サイトURL取得
└── types/index.ts
supabase/
├── schema.sql                  # DBスキーマ・RLS設定
└── seed.sql                    # 初期イベントデータ
```

---

## セキュリティ設計

| 項目 | 実装 |
|---|---|
| 編集トークン | 作成時に自動生成（64文字hex）。DBにはSHA-256ハッシュのみ保存 |
| Xログイン | 参加表明・イベント登録はXログイン必須。X IDはログイン情報から確定 |
| RLS | 本人名義の作成・更新をRLSで制限。トークン編集や管理操作はサーバー側検証後にservice_roleで実行 |
| 編集URL | `/events/[id]/entries/[id]/edit?token=xxx`。再表示不可 |
| URL検証 | 外部リンクはサーバー側で `http:` / `https:` のみ許可。公式Xは `x.com` / `twitter.com` のみ |
| 入力制限 | 文字数、enum、配列件数、画像形式・サイズをサーバー側で検証 |

---

## 外部イベントデータのインポート

cos-cam.work のイベント一覧を取得して Supabase に登録するスクリプトです。

### 事前準備

Supabase ダッシュボードの **SQL Editor** で `supabase/add_import_columns.sql` を実行してください（`schema.sql` 実行済みの場合）。  
新規セットアップの場合は `schema.sql` に既に含まれています。

### 実行方法

```bash
# 確認のみ（DBへの書き込みなし）
npm run import:cos-cam -- --dry-run

# 実際に登録
npm run import:cos-cam
```

### 注意事項

- 取得したイベントは**参加表明対象の候補**として扱います。公式情報として断定しないでください。
- 取得元サイトへの過剰アクセスを避けるため、cron などの自動実行は設定しないでください。
- 同一イベントの重複登録は自動で防止されます（upsert）。
- UI 上では「外部取得」バッジが表示され、免責事項が案内されます。

---

## 身内検証時の注意点

- URLを知っている人は全員の参加表明を閲覧できます
- 編集URLは作成直後の画面でのみ表示されます。保存し忘れた場合は再発行不可です
- 「Xログイン確認済み」は、そのXアカウントでログインして作成されたことのみを示します。実在の人物や身元、撮影許可を保証するものではありません
- 参加表明は撮影許可を意味しません

---

## Xログイン機能（なりすまし防止）

参加表明の作成には **X（Twitter）ログイン** を必須にしています。Supabase Auth の X / Twitter OAuth 2.0 を利用し、ログイン中のXアカウント名で「Xログイン確認済み」の参加表明を作成できます。

> **「Xログイン確認済み」と「本人確認済み」は異なります。**
> 「Xログイン確認済み」は、そのXアカウントでログインして作成されたことのみを示します。実在の人物や身元、撮影許可を保証するものではありません。表示文言は必ず「Xログイン確認済み」を使用してください。

### 仕組み / X API 課金を抑える設計

- Xの情報は**ログイン時に1回だけ** Supabase Auth の metadata から取得し、`profiles` テーブルに保存します。
- 一覧・詳細表示では `profiles` / `participation_entries` に保存済みの情報のみを使用し、**ページ表示ごとにX APIを叩きません**。
- X投稿・投稿取得・フォロー・DM・いいねの取得は行いません（Read only）。
- 利用量は X Developer Console の **Usage / Billing** で確認してください。

### X Developer Console の設定

1. [developer.x.com](https://developer.x.com) でアプリを作成
2. **User authentication settings** を編集
   - **App type: Web App**
   - **App permissions: Read only**（Write / DM 権限は不要）
   - **Type of App: OAuth 2.0**（OAuth 1.0a は使わない）
3. **Callback URI / Redirect URL** に Supabase のコールバックURLを登録
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - ※ **完全一致**が必要です（末尾スラッシュやスキームの違いに注意）
4. **Website URL / Terms of service / Privacy policy** を設定
   - Terms: `https://<your-domain>/terms`
   - Privacy: `https://<your-domain>/privacy`
5. **Client ID / Client Secret** を控える

### Supabase の設定

1. **Authentication → Providers → Twitter (X)** を有効化
2. X Developer Console で取得した **Client ID / Client Secret** を登録
   - Client Secret は Supabase Dashboard にのみ保存し、**Next.js / Vercel の環境変数には置かない**でください
3. **Authentication → URL Configuration**
   - Site URL に本番URL（例 `https://<your-domain>`）
   - Redirect URLs に `https://<your-domain>/auth/callback`（ローカル開発時は `http://localhost:3000/auth/callback` も追加）
4. DB マイグレーションを実行（Supabase SQL Editor）
   - 新規: `supabase/schema.sql`
   - 既存DB: `supabase/add_auth.sql`（profiles 作成・entries カラム追加・RLS 更新）

### 動作確認

```bash
npm run lint
npm run build
```

ローカル開発時は OAuth の redirect URL がローカルを指すため、Supabase の Redirect URLs に localhost を追加しておく必要があります。可能であれば **Vercel 本番URL でも**ログインをテストしてください。
