export type ParticipationType = 'cosplay' | 'photographer' | 'general' | 'undecided';

export type CosplayShootingStatus =
  | 'greeting_welcome'
  | 'mutual_ok'
  | 'acquaintance_only'
  | 'after_meeting_ok'
  | 'planned'
  | 'no_shooting';

export type PhotographerFirstMeetStatus =
  | 'ok'
  | 'mutual_only'
  | 'acquaintance_only'
  | 'negotiable';

export type PhotographerShootingStyle =
  | 'natural_light'
  | 'strobe_ok'
  | 'portrait'
  | 'recreation'
  | 'social';

/** イベントの公開状態（ユーザー登録イベントの確認フロー用） */
export type EventStatus = 'pending' | 'published' | 'removed';

export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  officialUrl: string;
  hashtag: string;
  description: string;
  isImported?: boolean;
  sourceSite?: string;
  sourceUrl?: string;
  organizer?: string;
  address?: string;
  xUrl?: string;
  region?: string;
  /** 'pending'=運営確認待ち / 'published'=確認済み（既定） */
  status?: EventStatus;
  /** 登録したXログインユーザーのID（あればユーザー投稿） */
  createdBy?: string;
}

export interface CosplayInfo {
  workName: string;
  characterName: string;
  shootingStatus: CosplayShootingStatus;
}

/** 当日の予定キャラ（1イベントに複数登録できる） */
export interface CosplayPlan {
  workTitle: string;
  characterName: string;
  /** 衣装ラベル（例: 通常衣装 / 私服 など） */
  costumeLabel?: string;
  /** 時間帯（例: 昼〜夕方 / 夜 など） */
  timeSlot?: string;
  planMemo?: string;
  imageUrl?: string;
}

/** カメラマンの撮りたい作品・キャラ（複数登録できる） */
export interface ShootingTarget {
  workTitle: string;
  characterName?: string;
  timeSlot?: string;
  memo?: string;
}

/** 参加時間帯 */
export type TimeBand = 'morning' | 'noon' | 'evening' | 'night' | 'allday' | 'undecided';
/** 挨拶歓迎度 */
export type GreetingLevel = 'welcome' | 'mutual' | 'acquaintance' | 'quiet';
/** 撮影相談可否 */
export type ShootingPolicy = 'ok' | 'mutual' | 'acquaintance' | 'no';

export interface PhotographerInfo {
  targetWorks: string;
  availableHours: string;
  firstMeetStatus: PhotographerFirstMeetStatus;
  portfolioUrl: string;
  shootingStyles: PhotographerShootingStyle[];
}

/** 参加表明の認証状態 */
export type AuthStatus = 'verified_x' | 'unverified' | 'legacy_token' | 'hidden';

/** Xログインユーザーのプロフィール（profiles テーブル） */
export interface Profile {
  id: string;
  xUserId?: string;
  xUsername?: string;
  xDisplayName?: string;
  xAvatarUrl?: string;
}

export interface ParticipationEntry {
  id: string;
  eventId: string;
  displayName: string;
  xId: string;
  participationType: ParticipationType;
  participationDate: string;
  comment: string;
  note?: string;
  imageUrl?: string;
  imageKey?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  ogImageUrl?: string;
  ogImageKey?: string;
  tweetUrl?: string;
  isVerifiedX?: boolean;
  userId?: string;
  xUserId?: string;
  xUsernameSnapshot?: string;
  authStatus: AuthStatus;
  /** 後方互換: 1件目の予定 + 撮影スタンス */
  cosplayInfo?: CosplayInfo;
  /** 当日の予定キャラ（複数可） */
  cosplayPlans?: CosplayPlan[];
  photographerInfo?: PhotographerInfo;
  /** カメラマンの撮りたい作品・キャラ（複数可） */
  shootingTargets?: ShootingTarget[];
  /** 見つけてもらう設定 */
  timeBand?: TimeBand;
  greetingLevel?: GreetingLevel;
  shootingPolicy?: ShootingPolicy;
  /** 一般・未定向けの軽い情報 */
  likedWorks?: string;
  wantWorks?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============================================================
// ユーザー同士の軽い交流（意思表示）
// ============================================================

/** 意思表示の種類 */
export type InteractionType = 'want_to_shoot' | 'want_to_be_shot' | 'want_to_meet';

/** 交流相手の公開プロフィール（Xユーザー名が無い場合は連絡導線を出さない） */
export interface InteractionParty {
  userId: string;
  xUsername?: string;
  displayName?: string;
  avatarUrl?: string;
}

/** 自分に届いた意思表示（一覧表示用に相手・イベント情報を含む） */
export interface ReceivedInteraction {
  id: string;
  intentType: InteractionType;
  createdAt: string;
  from: InteractionParty;
  eventId: string;
  eventName?: string;
  toEntryId: string;
}

/** 自分が送った意思表示（相手・イベント情報を含む） */
export interface SentInteraction {
  id: string;
  intentType: InteractionType;
  createdAt: string;
  to: InteractionParty;
  eventId: string;
  eventName?: string;
  toEntryId: string;
}

/**
 * イベント参加者一覧で意思表示ボタンを描画するための、閲覧者ごとの状態。
 * - viewerUserId: 未ログインなら null
 * - myIntents: 自分が送信済みの意思表示（参加表明ID → 種別配列）
 * - countsByEntry: 参加表明ごとの受信数（第三者には人数のみ見せる。ブロック分は除外済み）
 * - restrictedUserIds: 自分が関与するブロック相手（双方向）。この相手には意思表示できない
 */
export interface EventInteractionContext {
  viewerUserId: string | null;
  myIntents: Record<string, InteractionType[]>;
  countsByEntry: Record<string, Partial<Record<InteractionType, number>>>;
  restrictedUserIds: string[];
}

/** 参加表明作成APIのレスポンス */
export interface CreateEntryResult {
  entry: ParticipationEntry;
  editToken: string;
}

export interface EntryFilter {
  keyword: string;
  participationType: ParticipationType | '';
  workName: string;
  characterName: string;
  shootingStatus: CosplayShootingStatus | '';
}
