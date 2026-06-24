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

3. Deploy

---

## ファイル構成

```
src/
├── app/
│   ├── api/entries/            # エントリー CRUD API
│   ├── events/[eventId]/
│   │   ├── entries/new/        # 参加表明フォーム
│   │   └── entries/[entryId]/
│   │       ├── page.tsx        # 参加表明詳細
│   │       └── edit/page.tsx   # 参加表明編集
│   └── page.tsx                # トップ
├── components/
├── lib/
│   ├── supabase/server.ts      # サーバー用Supabaseクライアント
│   ├── events.ts               # イベントDB操作
│   ├── entries.ts              # 参加表明DB操作（createEntry/updateEntry/hideEntry）
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
| 削除パスワード | 任意。DBにはSHA-256ハッシュのみ保存 |
| RLS | 参加表明のUPDATE/DELETEはRLS禁止。サーバー側でトークン検証後にservice_roleで実行 |
| 編集URL | `/events/[id]/entries/[id]/edit?token=xxx`。再表示不可 |

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
- X IDの本人確認は行っていません
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
