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
  createdAt: string;
  updatedAt?: string;
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
