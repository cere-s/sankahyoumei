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
  tweetUrl?: string;
  isVerifiedX?: boolean;
  userId?: string;
  xUserId?: string;
  xUsernameSnapshot?: string;
  authStatus: AuthStatus;
  cosplayInfo?: CosplayInfo;
  photographerInfo?: PhotographerInfo;
  createdAt: string;
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
