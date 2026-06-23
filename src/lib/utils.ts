import type {
  ParticipationType,
  CosplayShootingStatus,
  PhotographerFirstMeetStatus,
  PhotographerShootingStyle,
  ParticipationEntry,
  EntryFilter,
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

export const COSPLAY_STATUS_COLORS: Record<CosplayShootingStatus, string> = {
  greeting_welcome: 'bg-emerald-100 text-emerald-800',
  mutual_ok: 'bg-blue-100 text-blue-800',
  acquaintance_only: 'bg-yellow-100 text-yellow-800',
  after_meeting_ok: 'bg-orange-100 text-orange-800',
  planned: 'bg-violet-100 text-violet-800',
  no_shooting: 'bg-red-100 text-red-800',
};

/** ローカルタイムゾーンの今日を YYYY-MM-DD で返す */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

export function filterEntries(entries: ParticipationEntry[], filter: EntryFilter): ParticipationEntry[] {
  return entries.filter((entry) => {
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase();
      const target = [
        entry.displayName,
        entry.xId,
        entry.cosplayInfo?.workName ?? '',
        entry.cosplayInfo?.characterName ?? '',
        entry.comment,
      ]
        .join(' ')
        .toLowerCase();
      if (!target.includes(kw)) return false;
    }
    if (filter.participationType && entry.participationType !== filter.participationType) return false;
    if (
      filter.workName &&
      !entry.cosplayInfo?.workName.toLowerCase().includes(filter.workName.toLowerCase())
    )
      return false;
    if (
      filter.characterName &&
      !entry.cosplayInfo?.characterName.toLowerCase().includes(filter.characterName.toLowerCase())
    )
      return false;
    if (filter.shootingStatus && entry.cosplayInfo?.shootingStatus !== filter.shootingStatus)
      return false;
    return true;
  });
}
