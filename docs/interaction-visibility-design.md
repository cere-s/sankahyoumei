# 意思表示の可視性改善 設計書

## 背景

現在、「撮りたい」「撮られたい」「交流したい」の意思表示は、主にマイページの「交流」欄で確認する設計になっている。そのため、ユーザーはイベントページや参加表明詳細を見ているだけでは、自分に届いた意思表示に気づきにくい。

既存実装では、イベント参加者カードや参加表明詳細に意思表示ボタンと件数表示はあるが、本人向けに「誰から届いたか」をイベント文脈で確認する導線が不足している。

## 目的

マイページに移動しなくても、ユーザーが自分に届いた意思表示をイベントページ・参加表明詳細ページ上で把握できるようにする。

## 方針

まずは DB スキーマを変更せず、既存の `interaction_intents` / `interaction_hides` / `user_blocks` を使って改善する。

未読管理や通知バッジの正確な既読状態は、今回の MVP には含めない。必要になった段階で `read_at` または `last_seen_interactions_at` を追加して実装する。

## MVP の実装範囲

### 1. イベントページに本人向け受信サマリーを表示する

ログイン中のユーザーに対して、そのイベント内で自分に届いている意思表示をイベントページ上部に表示する。

表示条件:

- ログイン済み
- 対象イベント内で、自分宛の意思表示が 1 件以上ある
- 非表示済みの意思表示は表示しない
- ブロック関係にある相手からの意思表示は表示しない

表示場所:

- `src/app/events/[eventId]/page.tsx`
- イベントのヒーローカード下、参加者一覧の前が望ましい

表示内容:

- 「このイベントで届いた意思表示」見出し
- 件数サマリー
  - 例: `撮りたい 2` / `撮られたい 1` / `交流したい 3`
- 直近数件の送信者
  - 送信者名
  - X ユーザー名
  - 意思表示種別
  - 対象の参加表明へのリンク
  - X で連絡するリンク
- マイページの交流欄へのリンク

UI 方針:

- 常時大きく主張しすぎず、白背景の小さな通知パネルにする
- 「通知」ではなく「届いた意思表示」と表現し、未読であるかのような表現は避ける
- 相手への連絡は既存方針通り X に誘導する

### 2. 自分の参加表明カードに受信サマリーを表示する

イベント参加者一覧で、自分の参加表明カードには意思表示ボタンの代わりに、受信サマリーを表示する。

現在 `InteractionButtons` は自分の参加表明に対して `自分の参加表明には追加できません` を表示している。ここをより有用な表示に変更する。

表示例:

```text
届いた意思表示
撮りたい 2 / 交流したい 1
```

注意:

- 誰から届いたかの一覧はカード内では出さない
- 他人には送信者情報を見せない
- 件数は既存の `countsByEntry` を使える

対象ファイル候補:

- `src/components/InteractionButtons.tsx`
- または `src/components/EntryCard.tsx` 側で自分のカードだけ別表示にする

推奨:

- `InteractionButtons` の自分宛表示を改善するより、`EntryCard` 側で `interaction.viewerUserId === entry.userId` のときに専用の受信サマリーを表示する方が責務が明確。
- `InteractionButtons` は「他人に意思表示する UI」に寄せる。

### 3. 参加表明詳細ページに本人向け受信一覧を表示する

自分の参加表明詳細ページを開いたとき、その参加表明に届いた意思表示を表示する。

表示条件:

- ログイン済み
- `entry.userId === user.id`
- その参加表明に届いた意思表示が 1 件以上ある

表示場所:

- `src/app/events/[eventId]/entries/[entryId]/page.tsx`
- 参加表明カード内の上部、または意思表示ボタンが出る位置

表示内容:

- 「この参加表明に届いた意思表示」
- 送信者名
- X ユーザー名
- 意思表示種別
- X で連絡するリンク
- マイページの交流欄へのリンク

## データ取得設計

### 既存関数

現在、以下の関数がある。

- `getEventInteractionContext(eventId, viewerUserId)`
  - イベント内の件数
  - 自分が送った意思表示
  - ブロック相手
- `getReceivedInteractions(userId)`
  - 自分に届いた意思表示一覧
  - 非表示・ブロック除外済み
  - イベント情報・送信者プロフィール付き

### 追加する関数案

`src/lib/interactions.ts` にイベント・参加表明単位で受信一覧を絞り込む関数を追加する。

```ts
export async function getReceivedInteractionsForEvent(
  userId: string,
  eventId: string
): Promise<ReceivedInteraction[]>
```

```ts
export async function getReceivedInteractionsForEntry(
  userId: string,
  entryId: string
): Promise<ReceivedInteraction[]>
```

実装方針:

- `getReceivedInteractions(userId)` を呼んでアプリ側で filter してもよい
- ただし件数が増える可能性を考えると、DB クエリ段階で `.eq('event_id', eventId)` / `.eq('to_entry_id', entryId)` する実装が望ましい
- 非表示・ブロック除外・プロフィール解決のロジックは重複しやすいため、内部 helper に切り出す

候補 helper:

```ts
async function listReceivedInteractions(
  userId: string,
  filters?: { eventId?: string; entryId?: string }
): Promise<ReceivedInteraction[]>
```

既存の `getReceivedInteractions(userId)` はこの helper を呼ぶ形に置き換える。

## 型設計

既存の `ReceivedInteraction` をそのまま使う。

必要に応じて `InteractionParty` に不足があれば追加するが、現状は以下で足りる。

- `userId`
- `xUsername`
- `displayName`
- `avatarUrl`

## コンポーネント設計

### 新規コンポーネント案: `ReceivedInteractionSummary`

配置:

- `src/components/ReceivedInteractionSummary.tsx`

Props:

```ts
interface Props {
  title: string;
  interactions: ReceivedInteraction[];
  compact?: boolean;
  showEventName?: boolean;
  showEntryLink?: boolean;
}
```

責務:

- 意思表示種別ごとの件数集計
- 直近数件の表示
- X 連絡リンク表示
- 参加表明リンク表示
- マイページへの導線表示

注意:

- `hide` や `block` は MVP では入れなくてよい
- 操作まで入れると `InteractionInbox` と責務が重く重複するため、MVP では閲覧と導線に絞る

### 新規コンポーネント案: `EntryReceivedInteractionCounts`

配置:

- `src/components/EntryReceivedInteractionCounts.tsx`

Props:

```ts
interface Props {
  counts: Partial<Record<InteractionType, number>>;
}
```

責務:

- 自分の参加表明カードに届いた意思表示件数を表示する
- 件数が 0 の場合は何も表示しない、または薄い案内文にする

## 画面ごとの変更

### `src/app/events/[eventId]/page.tsx`

変更内容:

- `getCurrentUser()` の結果 `user` がある場合、`getReceivedInteractionsForEvent(user.id, eventId)` を取得
- `ReceivedInteractionSummary` をヒーロー下に表示
- 既存の `getEventInteractionContext` は維持

注意:

- 現在 `Promise.all` の後に `getEventInteractionContext` を呼んでいる
- 受信一覧取得も同じタイミングで取得してよい
- 取得失敗時は空配列に fallback し、画面全体を壊さない

### `src/components/EntryCard.tsx`

変更内容:

- `interaction` が渡されていて、かつ `interaction.viewerUserId === entry.userId` の場合は、意思表示ボタンではなく `EntryReceivedInteractionCounts` を表示
- 他人の参加表明では従来通り `InteractionButtons` を表示

注意:

- 送信者一覧は表示しない
- `counts` は既存の `interaction.counts` を使う

### `src/app/events/[eventId]/entries/[entryId]/page.tsx`

変更内容:

- `isOwner` が true の場合、`getReceivedInteractionsForEntry(user.id, entry.id)` を取得
- 受信があれば `ReceivedInteractionSummary` を表示
- 他人の参加表明では従来通り `InteractionButtons` を表示

注意:

- 自分の詳細ページでは、今の `InteractionButtons` が「自分の参加表明には追加できません」を表示するだけなので、受信一覧に置き換える方が良い

## セキュリティ・プライバシー

- 送信者の一覧は、意思表示を受け取った本人にだけ表示する
- 他人には件数のみ表示する
- ブロック関係にある相手は既存ロジックと同じく除外する
- 非表示済みの意思表示は表示しない
- X への連絡導線は、`xUsername` がある場合のみ表示する

## 受け入れ条件

- ログイン済みユーザーがイベントページを開いたとき、そのイベント内で自分に届いた意思表示があれば表示される
- 意思表示がない場合は余計な空枠を表示しない
- 非ログイン時は受信サマリーを表示しない
- 他人の参加表明カードでは、従来通り意思表示ボタンが表示される
- 自分の参加表明カードでは、意思表示ボタンではなく受信件数サマリーが表示される
- 自分の参加表明詳細ページでは、その参加表明に届いた意思表示の送信者を確認できる
- ブロック済み・非表示済みの意思表示は表示されない
- `npm run build` が通る

## 今回はやらないこと

- 未読 / 既読管理
- push 通知
- メール通知
- アプリ内リアルタイム通知
- DB スキーマ変更
- 意思表示に自由入力コメントを付ける機能
- マイページの交流機能の削除

## 将来拡張

### ヘッダー通知バッジ

全ページで気づけるようにするには、ヘッダーのマイページ導線に受信バッジを出す。

ただし、単純な総件数バッジだと常に表示され続けるため、実装するなら既読管理を追加する。

候補:

- `profiles.last_seen_interactions_at`
- または `interaction_intents.read_at`

推奨:

- 個別既読が不要なら `profiles.last_seen_interactions_at` の方が単純
- 「この意思表示だけ既読/未読」を扱いたいなら `interaction_intents.read_at` または別テーブルが必要

### イベントページ内のフィルター

将来的には、参加者一覧に以下のフィルターを追加できる。

- 自分に意思表示してくれた人
- 自分が意思表示した人
- 相互に意思表示している人

これはマッチング用途として有用だが、MVP では UI が複雑になるため含めない。

## 実装時の注意

- 既存の `InteractionInbox` はマイページ用の管理 UI として維持する
- 新しいサマリーコンポーネントには、非表示・ブロック操作を入れない
- DB 取得エラーでイベントページ全体を落とさない
- 既存の `availableInteractionTypes` による参加種別ごとの制御は維持する
- 既存の文言「連絡はXで行ってください」という方針に合わせる
