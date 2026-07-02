import type {
  ParticipationType,
  CosplayShootingStatus,
  PhotographerFirstMeetStatus,
  PhotographerShootingStyle,
  ParticipationEntry,
  EntryFilter,
  CosplayPlan,
  ShootingTarget,
  TimeBand,
  GreetingLevel,
  ShootingPolicy,
  InteractionType,
} from '@/types';

/** 意思表示ボタンのラベル（未選択時） */
export const INTERACTION_LABELS: Record<InteractionType, string> = {
  want_to_shoot: '撮りたい',
  want_to_be_shot: '撮られたい',
  want_to_meet: '交流したい',
};

/** 意思表示ボタンのラベル（選択済み） */
export const INTERACTION_DONE_LABELS: Record<InteractionType, string> = {
  want_to_shoot: '撮りたい済み',
  want_to_be_shot: '撮られたい済み',
  want_to_meet: '交流したい済み',
};

export const INTERACTION_TYPES: InteractionType[] = [
  'want_to_shoot',
  'want_to_be_shot',
  'want_to_meet',
];

export function isInteractionType(v: unknown): v is InteractionType {
  return v === 'want_to_shoot' || v === 'want_to_be_shot' || v === 'want_to_meet';
}

/**
 * 対象の参加種別に応じて出すべき意思表示の種類を返す。
 * - カメラマン宛: 「撮りたい」は出さない（カメラマンを撮る対象としない）
 * - コスプレ宛: 「撮られたい」は出さない（コスプレに撮ってもらう関係ではない）
 */
export function availableInteractionTypes(targetType?: ParticipationType): InteractionType[] {
  return INTERACTION_TYPES.filter((t) => {
    if (targetType === 'photographer' && t === 'want_to_shoot') return false;
    if (targetType === 'cosplay' && t === 'want_to_be_shot') return false;
    return true;
  });
}

export const PARTICIPATION_TYPE_LABELS: Record<ParticipationType, string> = {
  cosplay: 'コスプレ',
  photographer: 'カメラマン',
  general: '一般参加',
  undecided: '未定',
};

export const COSPLAY_SHOOTING_STATUS_LABELS: Record<CosplayShootingStatus, string> = {
  greeting_welcome: '挨拶歓迎',
  mutual_ok: '相互なら撮影相談OK',
  acquaintance_only: '知り合いのみ',
  after_meeting_ok: '当日交流後ならOK',
  planned: '撮影予定あり',
  no_shooting: '撮影不可',
};

export const PHOTOGRAPHER_FIRST_MEET_LABELS: Record<PhotographerFirstMeetStatus, string> = {
  ok: 'OK',
  mutual_only: '相互のみ',
  acquaintance_only: '知り合いのみ',
  negotiable: '要相談',
};

export const PHOTOGRAPHER_SHOOTING_STYLE_LABELS: Record<PhotographerShootingStyle, string> = {
  natural_light: '自然光中心',
  strobe_ok: 'ストロボ可',
  portrait: 'ポートレート寄り',
  recreation: '作品再現寄り',
  social: '交流メイン',
};

export const TIME_BAND_LABELS: Record<TimeBand, string> = {
  morning: '午前',
  noon: '昼',
  evening: '夕方',
  night: '夜',
  allday: '終日',
  undecided: '未定',
};

export const GREETING_LEVEL_LABELS: Record<GreetingLevel, string> = {
  welcome: '挨拶歓迎',
  mutual: '相互ならOK',
  acquaintance: '知り合いのみ',
  quiet: '控えめ',
};

export const SHOOTING_POLICY_LABELS: Record<ShootingPolicy, string> = {
  ok: '撮影OK',
  mutual: '相互ならOK',
  acquaintance: '知り合いのみ',
  no: '撮影不可',
};

export const GREETING_LEVEL_COLORS: Record<GreetingLevel, string> = {
  welcome: 'bg-emerald-100 text-emerald-800',
  mutual: 'bg-blue-100 text-blue-800',
  acquaintance: 'bg-yellow-100 text-yellow-800',
  quiet: 'bg-gray-100 text-gray-600',
};

export const SHOOTING_POLICY_COLORS: Record<ShootingPolicy, string> = {
  ok: 'bg-violet-100 text-violet-800',
  mutual: 'bg-blue-100 text-blue-800',
  acquaintance: 'bg-yellow-100 text-yellow-800',
  no: 'bg-red-100 text-red-800',
};

export const PARTICIPATION_TYPE_COLORS: Record<ParticipationType, string> = {
  cosplay: 'bg-pink-100 text-pink-800',
  photographer: 'bg-blue-100 text-blue-800',
  general: 'bg-green-100 text-green-800',
  undecided: 'bg-gray-100 text-gray-600',
};

/** 参加者カードの種別ごとの色（淡い背景＋色付き枠。文字は濃いまま＝視認性確保） */
export const PARTICIPATION_TYPE_CARD: Record<ParticipationType, string> = {
  cosplay: 'bg-pink-50 border-pink-200 group-hover:border-pink-300',
  photographer: 'bg-blue-50 border-blue-200 group-hover:border-blue-300',
  general: 'bg-emerald-50 border-emerald-200 group-hover:border-emerald-300',
  undecided: 'bg-gray-50 border-gray-200 group-hover:border-gray-300',
};

/** 参加者カード左端の種別カラー帯（EntryCard/LatestEntryCard） */
export const PARTICIPATION_TYPE_SPINE: Record<ParticipationType, string> = {
  cosplay: 'bg-pink-500',
  photographer: 'bg-blue-500',
  general: 'bg-emerald-500',
  undecided: 'bg-gray-300',
};

/** 参加者カードの枠線（白背景・ホバーで種別カラーに寄せる） */
export const PARTICIPATION_TYPE_BORDER: Record<ParticipationType, string> = {
  cosplay: 'border-gray-100 group-hover:border-pink-200',
  photographer: 'border-gray-100 group-hover:border-blue-200',
  general: 'border-gray-100 group-hover:border-emerald-200',
  undecided: 'border-gray-100 group-hover:border-gray-200',
};

/** アイコンのリング色（種別を色でも識別できるように） */
export const PARTICIPATION_TYPE_RING: Record<ParticipationType, string> = {
  cosplay: 'ring-pink-400',
  photographer: 'ring-blue-400',
  general: 'ring-emerald-400',
  undecided: 'ring-gray-300',
};

export const COSPLAY_STATUS_COLORS: Record<CosplayShootingStatus, string> = {
  greeting_welcome: 'bg-emerald-100 text-emerald-800',
  mutual_ok: 'bg-blue-100 text-blue-800',
  acquaintance_only: 'bg-yellow-100 text-yellow-800',
  after_meeting_ok: 'bg-orange-100 text-orange-800',
  planned: 'bg-violet-100 text-violet-800',
  no_shooting: 'bg-red-100 text-red-800',
};

/** ハッシュタグ文字列を複数タグ（#なし）に分解する。区切り: 空白 / カンマ(半角全角) / 読点 / # */
export function parseHashtags(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[\s,、，#＃]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** サービス共通ハッシュタグ（参加表明ツイートに必ず付与する） */
export const SERVICE_HASHTAG = 'コスいく';

/** イベントのハッシュタグ（#なし配列）に、必ず #コスいく を含めて返す（重複は除去） */
export function tweetHashtags(eventHashtag?: string): string[] {
  const tags = parseHashtags(eventHashtag);
  return tags.includes(SERVICE_HASHTAG) ? tags : [...tags, SERVICE_HASHTAG];
}

/**
 * 日本時間(JST)の今日を YYYY-MM-DD で返す。
 * Vercel のサーバーは UTC で動くため、必ずタイムゾーンを指定する
 * （指定しないと日本の深夜〜朝に「前日」と判定され、当日のイベントが残る）。
 */
export function todayISO(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' });
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** イベント一覧カードの日付半券用（月・日・曜日）。不正な日付なら null */
export function formatDateStub(dateStr: string): { month: string; day: string; weekday: string } | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return null;
  return {
    month: `${d.getMonth() + 1}月`,
    day: String(d.getDate()).padStart(2, '0'),
    weekday: d.toLocaleDateString('ja-JP', { weekday: 'short' }),
  };
}

/** 表示・検索用に予定一覧を取り出す（cosplayPlans 優先、無ければ cosplayInfo を1件目として後方互換） */
export function getEntryPlans(entry: ParticipationEntry): CosplayPlan[] {
  if (entry.cosplayPlans?.length) return entry.cosplayPlans;
  if (entry.cosplayInfo && (entry.cosplayInfo.workName || entry.cosplayInfo.characterName)) {
    return [{ workTitle: entry.cosplayInfo.workName, characterName: entry.cosplayInfo.characterName }];
  }
  return [];
}

/** カメラマンの撮りたい作品・キャラ（shootingTargets 優先、無ければ targetWorks を1件目として後方互換） */
export function getEntryTargets(entry: ParticipationEntry): ShootingTarget[] {
  if (entry.shootingTargets?.length) return entry.shootingTargets;
  if (entry.photographerInfo?.targetWorks) {
    return [{ workTitle: entry.photographerInfo.targetWorks }];
  }
  return [];
}

/** 挨拶歓迎度を取得（新フィールド優先。無ければ旧 shootingStatus / firstMeetStatus から推定） */
export function getGreetingLevel(e: ParticipationEntry): GreetingLevel | null {
  if (e.greetingLevel) return e.greetingLevel;
  if (e.participationType === 'cosplay' && e.cosplayInfo) {
    const s = e.cosplayInfo.shootingStatus;
    if (s === 'greeting_welcome') return 'welcome';
    if (s === 'mutual_ok' || s === 'after_meeting_ok') return 'mutual';
    if (s === 'acquaintance_only') return 'acquaintance';
    if (s === 'no_shooting') return 'quiet';
    return 'welcome';
  }
  if (e.participationType === 'photographer' && e.photographerInfo) {
    const f = e.photographerInfo.firstMeetStatus;
    if (f === 'ok' || f === 'negotiable') return 'welcome';
    if (f === 'mutual_only') return 'mutual';
    return 'acquaintance';
  }
  return null;
}

/** 撮影相談可否を取得（新フィールド優先。無ければ旧フィールドから推定） */
export function getShootingPolicy(e: ParticipationEntry): ShootingPolicy | null {
  if (e.shootingPolicy) return e.shootingPolicy;
  if (e.participationType === 'cosplay' && e.cosplayInfo) {
    const s = e.cosplayInfo.shootingStatus;
    if (s === 'greeting_welcome' || s === 'planned') return 'ok';
    if (s === 'mutual_ok' || s === 'after_meeting_ok') return 'mutual';
    if (s === 'acquaintance_only') return 'acquaintance';
    if (s === 'no_shooting') return 'no';
    return 'ok';
  }
  if (e.participationType === 'photographer' && e.photographerInfo) {
    const f = e.photographerInfo.firstMeetStatus;
    if (f === 'ok' || f === 'negotiable') return 'ok';
    if (f === 'mutual_only') return 'mutual';
    if (f === 'acquaintance_only') return 'acquaintance';
  }
  return null;
}

export function getTimeBand(e: ParticipationEntry): TimeBand | null {
  return e.timeBand ?? null;
}

/** 挨拶歓迎 */
export function isGreetingWelcome(e: ParticipationEntry): boolean {
  return getGreetingLevel(e) === 'welcome';
}

/** 撮影相談OK（撮影が歓迎・相談可能） */
export function isShootingConsultOk(e: ParticipationEntry): boolean {
  const p = getShootingPolicy(e);
  return p === 'ok' || p === 'mutual';
}

export interface EventStats {
  total: number;
  cosplay: number;
  photographer: number;
  shootingOk: number;
  greeting: number;
}

export function computeEventStats(entries: ParticipationEntry[]): EventStats {
  return {
    total: entries.length,
    cosplay: entries.filter((e) => e.participationType === 'cosplay').length,
    photographer: entries.filter((e) => e.participationType === 'photographer').length,
    shootingOk: entries.filter(isShootingConsultOk).length,
    greeting: entries.filter(isGreetingWelcome).length,
  };
}

export interface TagCount {
  name: string;
  count: number;
}

/** 人気作品・人気キャラを「人数（同一人物は1）」で集計し降順に */
export function computePopularTags(entries: ParticipationEntry[]): { works: TagCount[]; characters: TagCount[] } {
  const workPeople = new Map<string, number>();
  const charPeople = new Map<string, number>();
  for (const e of entries) {
    const plans = getEntryPlans(e);
    const works = new Set(plans.map((p) => p.workTitle.trim()).filter(Boolean));
    const chars = new Set(plans.map((p) => p.characterName.trim()).filter(Boolean));
    for (const w of works) workPeople.set(w, (workPeople.get(w) ?? 0) + 1);
    for (const c of chars) charPeople.set(c, (charPeople.get(c) ?? 0) + 1);
  }
  const sort = (m: Map<string, number>): TagCount[] =>
    [...m.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ja'));
  return { works: sort(workPeople), characters: sort(charPeople) };
}

export function filterEntries(entries: ParticipationEntry[], filter: EntryFilter): ParticipationEntry[] {
  return entries.filter((entry) => {
    const plans = getEntryPlans(entry);
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase();
      const target = [
        entry.displayName,
        entry.xId,
        ...plans.map((p) => p.workTitle),
        ...plans.map((p) => p.characterName),
        entry.comment,
      ]
        .join(' ')
        .toLowerCase();
      if (!target.includes(kw)) return false;
    }
    if (filter.participationType && entry.participationType !== filter.participationType) return false;
    if (
      filter.workName &&
      !plans.some((p) => p.workTitle.toLowerCase().includes(filter.workName.toLowerCase()))
    )
      return false;
    if (
      filter.characterName &&
      !plans.some((p) => p.characterName.toLowerCase().includes(filter.characterName.toLowerCase()))
    )
      return false;
    if (filter.shootingStatus && entry.cosplayInfo?.shootingStatus !== filter.shootingStatus)
      return false;
    return true;
  });
}
