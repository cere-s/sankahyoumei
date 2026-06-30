/**
 * 入力値の共通バリデーション／サニタイズ。
 * 作成APIと更新APIで同じ規則を使い、保存前に安全な値へ正規化する。
 */
import type {
  ParticipationType,
  CosplayShootingStatus,
  PhotographerFirstMeetStatus,
  PhotographerShootingStyle,
  CosplayInfo,
  CosplayPlan,
  ShootingTarget,
  PhotographerInfo,
  TimeBand,
  GreetingLevel,
  ShootingPolicy,
} from '@/types';

// ---- イベント投稿フォームと共通の地方一覧 ----
export const REGIONS = ['北海道', '東北', '関東', '東海', '関西', '中国四国', '九州', '沖縄'] as const;

// ---- 文字数・件数の上限（既存データを壊さないよう余裕を持たせる）----
export const LIMITS = {
  displayName: 50,
  comment: 1000,
  note: 500,
  likedWorks: 500,
  wantWorks: 500,
  url: 500,
  // イベント
  eventName: 100,
  eventLocation: 100,
  eventDescription: 1000,
  eventOrganizer: 100,
  eventAddress: 200,
  eventHashtag: 200,
  // ネスト項目
  workTitle: 100,
  characterName: 100,
  costumeLabel: 60,
  timeSlot: 60,
  planMemo: 300,
  targetWorks: 200,
  availableHours: 100,
  memo: 300,
  // 配列件数
  plans: 20,
  targets: 20,
} as const;

/** 文字列を trim して上限で切り詰める。空なら undefined */
export function clampText(v: unknown, max: number): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  if (!t) return undefined;
  return t.length > max ? t.slice(0, max) : t;
}

/**
 * 安全な http(s) URL だけを許可して返す。それ以外（javascript:, data:, 不正な形式、
 * 長すぎる）は null。hostAllowlist を渡すとホストも限定する。
 */
export function safeHttpUrl(
  raw: unknown,
  opts: { hostAllowlist?: string[]; maxLen?: number } = {}
): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const maxLen = opts.maxLen ?? LIMITS.url;
  if (trimmed.length > maxLen) return null;

  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;

  if (opts.hostAllowlist) {
    const host = u.hostname.replace(/^www\./, '').replace(/^mobile\./, '').toLowerCase();
    if (!opts.hostAllowlist.includes(host)) return null;
  }
  return u.toString();
}

/** X(Twitter) のURLだけ許可する（公式X用） */
export function safeXUrl(raw: unknown): string | null {
  return safeHttpUrl(raw, { hostAllowlist: ['x.com', 'twitter.com'] });
}

// ---- enum 判定（不正値は undefined にして握りつぶす）----
const PARTICIPATION_TYPES: ParticipationType[] = ['cosplay', 'photographer', 'general', 'undecided'];
const COSPLAY_STATUSES: CosplayShootingStatus[] = [
  'greeting_welcome', 'mutual_ok', 'acquaintance_only', 'after_meeting_ok', 'planned', 'no_shooting',
];
const FIRST_MEET_STATUSES: PhotographerFirstMeetStatus[] = ['ok', 'mutual_only', 'acquaintance_only', 'negotiable'];
const SHOOTING_STYLES: PhotographerShootingStyle[] = ['natural_light', 'strobe_ok', 'portrait', 'recreation', 'social'];
const TIME_BANDS: TimeBand[] = ['morning', 'noon', 'evening', 'night', 'allday', 'undecided'];
const GREETING_LEVELS: GreetingLevel[] = ['welcome', 'mutual', 'acquaintance', 'quiet'];
const SHOOTING_POLICIES: ShootingPolicy[] = ['ok', 'mutual', 'acquaintance', 'no'];

export function isParticipationType(v: unknown): v is ParticipationType {
  return typeof v === 'string' && PARTICIPATION_TYPES.includes(v as ParticipationType);
}
const inEnum = <T extends string>(list: T[], v: unknown): T | undefined =>
  typeof v === 'string' && list.includes(v as T) ? (v as T) : undefined;

export const asTimeBand = (v: unknown) => inEnum(TIME_BANDS, v);
export const asGreetingLevel = (v: unknown) => inEnum(GREETING_LEVELS, v);
export const asShootingPolicy = (v: unknown) => inEnum(SHOOTING_POLICIES, v);
export const asRegion = (v: unknown): string | undefined =>
  typeof v === 'string' && (REGIONS as readonly string[]).includes(v.trim()) ? v.trim() : undefined;

// ---- ネスト項目のサニタイズ ----
export function sanitizeCosplayInfo(v: CosplayInfo | undefined): CosplayInfo | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const status = inEnum(COSPLAY_STATUSES, v.shootingStatus);
  const workName = clampText(v.workName, LIMITS.workTitle) ?? '';
  const characterName = clampText(v.characterName, LIMITS.characterName) ?? '';
  if (!status && !workName && !characterName) return undefined;
  return { workName, characterName, shootingStatus: status ?? 'greeting_welcome' };
}

export function sanitizeCosplayPlans(v: CosplayPlan[] | undefined): CosplayPlan[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.slice(0, LIMITS.plans).map((p) => ({
    workTitle: clampText(p?.workTitle, LIMITS.workTitle) ?? '',
    characterName: clampText(p?.characterName, LIMITS.characterName) ?? '',
    costumeLabel: clampText(p?.costumeLabel, LIMITS.costumeLabel),
    timeSlot: clampText(p?.timeSlot, LIMITS.timeSlot),
    planMemo: clampText(p?.planMemo, LIMITS.planMemo),
    imageUrl: safeHttpUrl(p?.imageUrl) ?? undefined,
  }));
  return out;
}

export function sanitizeShootingTargets(v: ShootingTarget[] | undefined): ShootingTarget[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v.slice(0, LIMITS.targets).map((t) => ({
    workTitle: clampText(t?.workTitle, LIMITS.workTitle) ?? '',
    characterName: clampText(t?.characterName, LIMITS.characterName),
    timeSlot: clampText(t?.timeSlot, LIMITS.timeSlot),
    memo: clampText(t?.memo, LIMITS.memo),
  }));
}

export function sanitizePhotographerInfo(v: PhotographerInfo | undefined): PhotographerInfo | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const styles = Array.isArray(v.shootingStyles)
    ? v.shootingStyles.filter((s): s is PhotographerShootingStyle => SHOOTING_STYLES.includes(s))
    : [];
  return {
    targetWorks: clampText(v.targetWorks, LIMITS.targetWorks) ?? '',
    availableHours: clampText(v.availableHours, LIMITS.availableHours) ?? '',
    firstMeetStatus: inEnum(FIRST_MEET_STATUSES, v.firstMeetStatus) ?? 'negotiable',
    portfolioUrl: safeHttpUrl(v.portfolioUrl) ?? '',
    shootingStyles: styles,
  };
}
