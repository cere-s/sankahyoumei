/**
 * DB行 -> ParticipationEntry の変換（純粋関数）。
 * Supabase など外部には依存しないので、そのままユニットテストできる。
 */
import type {
  ParticipationEntry,
  ParticipationType,
  CosplayShootingStatus,
  PhotographerFirstMeetStatus,
  PhotographerShootingStyle,
  CosplayPlan,
  ShootingTarget,
  TimeBand,
  GreetingLevel,
  ShootingPolicy,
} from '@/types';

export interface DBEntry {
  id: string;
  event_id: string;
  display_name: string;
  x_id: string;
  participation_type: string;
  participation_day: string;
  work_name: string | null;
  character_name: string | null;
  shooting_status: string | null;
  cosplay_plans: unknown;
  photographer_target_works: string | null;
  photographer_available_time: string | null;
  photographer_availability: string | null;
  portfolio_url: string | null;
  shooting_style: string[] | null;
  shooting_targets: unknown;
  time_band: string | null;
  greeting_level: string | null;
  shooting_policy: string | null;
  liked_works: string | null;
  want_works: string | null;
  image_url: string | null;
  image_key: string | null;
  image_alt: string | null;
  image_width: number | null;
  image_height: number | null;
  image_updated_at: string | null;
  og_image_url: string | null;
  og_image_key: string | null;
  tweet_url: string | null;
  comment: string | null;
  note: string | null;
  edit_token_hash: string | null;
  delete_password_hash: string | null;
  user_id: string | null;
  x_user_id: string | null;
  x_username_snapshot: string | null;
  auth_status: string | null;
  is_verified_x: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

/** cosplay_plans(JSONB) を正規化。空なら単一 work/character を1件目として後方互換 */
export function parsePlans(raw: unknown, workName: string | null, characterName: string | null): CosplayPlan[] {
  if (Array.isArray(raw)) {
    const plans = (raw as unknown[])
      .map((p) => {
        const o = (p ?? {}) as Record<string, unknown>;
        return {
          workTitle: String(o.workTitle ?? '').trim(),
          characterName: String(o.characterName ?? '').trim(),
          costumeLabel: o.costumeLabel ? String(o.costumeLabel) : undefined,
          timeSlot: o.timeSlot ? String(o.timeSlot) : undefined,
          planMemo: o.planMemo ? String(o.planMemo) : undefined,
          imageUrl: o.imageUrl ? String(o.imageUrl) : undefined,
        } as CosplayPlan;
      })
      .filter((p) => p.workTitle || p.characterName);
    if (plans.length) return plans;
  }
  if (workName || characterName) {
    return [{ workTitle: workName ?? '', characterName: characterName ?? '' }];
  }
  return [];
}

/** 撮りたい作品・キャラ配列を正規化。空なら targetWorks を1件目として後方互換 */
export function parseTargets(raw: unknown, targetWorks: string | null): ShootingTarget[] {
  if (Array.isArray(raw)) {
    const targets = (raw as unknown[])
      .map((p) => {
        const o = (p ?? {}) as Record<string, unknown>;
        return {
          workTitle: String(o.workTitle ?? '').trim(),
          characterName: o.characterName ? String(o.characterName).trim() : undefined,
          timeSlot: o.timeSlot ? String(o.timeSlot) : undefined,
          memo: o.memo ? String(o.memo) : undefined,
        } as ShootingTarget;
      })
      .filter((p) => p.workTitle);
    if (targets.length) return targets;
  }
  if (targetWorks) return [{ workTitle: targetWorks }];
  return [];
}

/** DB行を ParticipationEntry へ変換（null → undefined/空文字/既定値の正規化を含む） */
export function dbToEntry(row: DBEntry): ParticipationEntry {
  const entry: ParticipationEntry = {
    id: row.id,
    eventId: row.event_id,
    displayName: row.display_name,
    xId: row.x_id,
    participationType: row.participation_type as ParticipationType,
    participationDate: row.participation_day,
    comment: row.comment ?? '',
    note: row.note ?? undefined,
    imageUrl: row.image_url ?? undefined,
    imageKey: row.image_key ?? undefined,
    imageAlt: row.image_alt ?? undefined,
    imageWidth: row.image_width ?? undefined,
    imageHeight: row.image_height ?? undefined,
    ogImageUrl: row.og_image_url ?? undefined,
    ogImageKey: row.og_image_key ?? undefined,
    tweetUrl: row.tweet_url ?? undefined,
    isVerifiedX: row.is_verified_x ?? false,
    userId: row.user_id ?? undefined,
    xUserId: row.x_user_id ?? undefined,
    xUsernameSnapshot: row.x_username_snapshot ?? undefined,
    authStatus: (row.auth_status as ParticipationEntry['authStatus']) ?? 'unverified',
    timeBand: (row.time_band as TimeBand | null) ?? undefined,
    greetingLevel: (row.greeting_level as GreetingLevel | null) ?? undefined,
    shootingPolicy: (row.shooting_policy as ShootingPolicy | null) ?? undefined,
    likedWorks: row.liked_works ?? undefined,
    wantWorks: row.want_works ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };

  if (row.participation_type === 'cosplay') {
    const plans = parsePlans(row.cosplay_plans, row.work_name, row.character_name);
    entry.cosplayPlans = plans;
    entry.cosplayInfo = {
      workName: plans[0]?.workTitle ?? '',
      characterName: plans[0]?.characterName ?? '',
      shootingStatus: (row.shooting_status ?? 'greeting_welcome') as CosplayShootingStatus,
    };
  }

  if (row.participation_type === 'photographer') {
    entry.photographerInfo = {
      targetWorks: row.photographer_target_works ?? '',
      availableHours: row.photographer_available_time ?? '',
      firstMeetStatus: (row.photographer_availability ?? 'negotiable') as PhotographerFirstMeetStatus,
      portfolioUrl: row.portfolio_url ?? '',
      shootingStyles: (row.shooting_style ?? []) as PhotographerShootingStyle[],
    };
    entry.shootingTargets = parseTargets(row.shooting_targets, row.photographer_target_works);
  }

  return entry;
}
