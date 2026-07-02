# Xログインのアクセストークン取り扱いについての調査報告

## 背景

分析データから、参加表明フォームで「Xログインが必要」というゲート画面に到達したユーザーの多くが、ログインCTAを押さずに離脱していることが分かった([entry-form-funnel関連の分析]参照)。運営側の仮説として「Xログインに対する不安(勝手に投稿される・フォローされる等)がハードルになっているのでは」という指摘があり、その裏付けとして「現状、ログイン後のアクセストークンは保存・利用しておらず、悪用しようにもできない実装になっている」という認識が正しいかを実装レベルで確認した。

## 調査対象

- `src/app/auth/callback/route.ts`
- `src/lib/auth.ts`
- `src/components/auth/XLoginButton.tsx`
- `src/middleware.ts`
- `src/lib/tweet.ts`
- `supabase/add_auth.sql`(`profiles`テーブル定義)
- リポジトリ全体を `provider_token` / `providerToken` / `refresh_token` でgrep

## 調査結果

### 1. OAuthコールバック処理

`src/app/auth/callback/route.ts:18` は `supabase.auth.exchangeCodeForSession(code)` を呼ぶのみで、戻り値の `data.session`(アクセストークンを含む)は参照せず破棄している。その後 `supabase.auth.getUser()`(同ファイル28行目)でユーザー情報を取得し、`syncProfileFromUser` にプロフィール情報のみを渡している。

### 2. プロフィール抽出処理

`src/lib/auth.ts:35-62` の `extractXProfile()` はX APIを一切呼び出さず、ログイン時にSupabaseが返す `user.user_metadata` / `user.identities[].identity_data` から以下のみを取り出している。

- `x_user_id`
- `x_username`
- `x_display_name`
- `x_avatar_url`

### 3. DBスキーマ

`supabase/add_auth.sql:14-21` の `profiles` テーブルのカラムは `id, x_user_id, x_username, x_display_name, x_avatar_url, created_at, updated_at` のみ。アクセストークン・リフレッシュトークンを格納するカラムは存在しない。

### 4. OAuthリクエスト時のスコープ

`src/components/auth/XLoginButton.tsx:31-34` の `signInWithOAuth({ provider: 'x', options: { redirectTo } })` には `scopes` オプションの指定がない。投稿・フォロー・DM等の操作に必要な追加スコープをアプリコード側からは要求していない(Supabaseダッシュボード側のプロバイダ設定自体は本調査の対象外。後述の「留意点」参照)。

### 5. X APIへの通信箇所

リポジトリ内でXへ通信している唯一の箇所は `src/lib/tweet.ts:71-73` の `verifyTweetForXId()` で、`https://publish.twitter.com/oembed` という**認証不要の公開エンドポイント**を叩き、参加表明に紐づくツイートの投稿者ハンドルを照合する用途のみに使用している。ユーザーの代理でツイート投稿・フォロー・DM・ブロック等を行うコードパスはリポジトリ内に存在しない。

### 6. ミドルウェア

`src/middleware.ts:5-6` にも「Supabase Authのみを呼び、X APIへはアクセスしない」旨のコメントがあり、実装も `supabase.auth.getUser()` によるセッション更新のみ。

## 結論

**「アクセストークンをログイン後に保存・利用していないため、悪用しようにもできない」という認識は、アプリコードのレベルでは正しい。**

- アクセストークン/リフレッシュトークンを保存する処理・カラムが存在しない
- 投稿・フォロー・DM等に必要な追加スコープを要求していない
- ユーザーの代理でX APIを操作するコードパスが存在しない

## 留意点(本調査で確認できなかった範囲)

- SupabaseダッシュボードのX(Twitter)OAuthプロバイダ設定(要求スコープ等)はリポジトリにファイルとして存在しないため、本調査では確認できていない。ただしアプリコード側がprovider_tokenを一切要求・参照していないため、仮にダッシュボード側で追加スコープが有効になっていても、そのトークンをアプリが受け取って利用するパスは現状存在しない。
- 今後の実装変更で `provider_token` / `scopes` 等を追加する場合は、この文書の前提が崩れるため、ユーザー向けの説明文言(ゲート画面・告知ツイート等)も合わせて見直す必要がある。

## この調査結果を使った施策

- 参加表明フォームのXログインゲート画面の文言改善(「投稿しません」を運営の意図表明ではなく技術的な裏付けとして説明する)の材料として使用
- 告知用ツイート文言(技術寄り版)のドラフトを作成済み

## 関連

- 分析: エントリーフォームのログインゲート離脱データ(2026-07-01分析)
