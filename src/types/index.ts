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
