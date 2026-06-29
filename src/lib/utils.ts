import type {
  ParticipationType,
  CosplayShootingStatus,
  PhotographerFirstMeetStatus,
  PhotographerShootingStyle,
  ParticipationEntry,
  EntryFilter,
  CosplayPlan,
} from '@/types';

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

/** 表示・検索用に予定一覧を取り出す（cosplayPlans 優先、無ければ cosplayInfo を1件目として後方互換） */
export function getEntryPlans(entry: ParticipationEntry): CosplayPlan[] {
  if (entry.cosplayPlans?.length) return entry.cosplayPlans;
  if (entry.cosplayInfo && (entry.cosplayInfo.workName || entry.cosplayInfo.characterName)) {
    return [{ workTitle: entry.cosplayInfo.workName, characterName: entry.cosplayInfo.characterName }];
  }
  return [];
}

/** 挨拶歓迎（コスプレ・挨拶歓迎スタンス） */
export function isGreetingWelcome(e: ParticipationEntry): boolean {
  return e.participationType === 'cosplay' && e.cosplayInfo?.shootingStatus === 'greeting_welcome';
}

const COSPLAY_SHOOTING_OK: CosplayShootingStatus[] = ['greeting_welcome', 'mutual_ok', 'after_meeting_ok', 'planned'];
const PHOTO_SHOOTING_OK: PhotographerFirstMeetStatus[] = ['ok', 'negotiable', 'mutual_only'];

/** 撮影相談OK（撮影が歓迎・相談可能なコスプレイヤー / カメラマン） */
export function isShootingConsultOk(e: ParticipationEntry): boolean {
  if (e.participationType === 'cosplay')
    return Boolean(e.cosplayInfo && COSPLAY_SHOOTING_OK.includes(e.cosplayInfo.shootingStatus));
  if (e.participationType === 'photographer')
    return Boolean(e.photographerInfo && PHOTO_SHOOTING_OK.includes(e.photographerInfo.firstMeetStatus));
  return false;
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
