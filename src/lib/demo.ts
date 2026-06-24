import type { User } from '@supabase/supabase-js';
import type { Event, ParticipationEntry, Profile } from '@/types';

/** デモモード判定（NEXT_PUBLIC のためサーバー/クライアント両方で有効） */
export const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

/** デモログイン中かどうかを示す Cookie 名 */
export const DEMO_SESSION_COOKIE = 'demo_session';
export const DEMO_USER_ID = 'demo-user-1';

export const demoProfile: Profile = {
  id: DEMO_USER_ID,
  xUserId: '1000000000000000001',
  xUsername: 'demo_user',
  xDisplayName: 'デモユーザー',
  xAvatarUrl: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png',
};

export function demoUser(): User {
  return {
    id: DEMO_USER_ID,
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: '2026-06-01T00:00:00Z',
  } as User;
}

export const demoEvents: Event[] = [
  {
    id: 'demo-ev-1',
    name: '池袋コスプレフェスティバル 2026夏',
    date: '2026-07-04',
    location: '池袋エリア（東京都豊島区）',
    officialUrl: 'https://example.com/ikebukuro',
    hashtag: '池袋コスフェス',
    description: '街全体がコスプレOKになる大型イベント。初参加歓迎。',
    isImported: false,
    region: '関東',
  },
  {
    id: 'demo-ev-2',
    name: '大阪南港コスプレイベント',
    date: '2026-07-11',
    location: 'ATCホール（大阪府大阪市）',
    officialUrl: '',
    hashtag: '南港コス',
    description: '屋内スタジオ＆屋外ロケが楽しめる関西の定番イベント。',
    isImported: false,
    region: '関西',
  },
  {
    id: 'demo-ev-3',
    name: '名古屋オアシスコスプレデー',
    date: '2026-07-12',
    location: 'オアシス21（愛知県名古屋市）',
    officialUrl: '',
    hashtag: 'オアシスコス',
    description: '名古屋の中心地で開催。アクセス良好。',
    isImported: true,
    region: '東海',
    sourceSite: 'cos-cam.work',
    sourceUrl: 'https://example.com/oasis',
  },
  {
    id: 'demo-ev-4',
    name: 'さいたまスタジオ撮影会',
    date: '2026-07-19',
    location: '大宮スタジオ（埼玉県さいたま市）',
    officialUrl: '',
    hashtag: '',
    description: '少人数制のスタジオ撮影会。',
    isImported: false,
    region: '関東',
  },
  {
    id: 'demo-ev-5',
    name: '京都和装ロケ撮影',
    date: '2026-07-20',
    location: '嵐山（京都府京都市）',
    officialUrl: '',
    hashtag: '京都和装',
    description: '和装・和風キャラ向けのロケーション撮影。',
    isImported: false,
    region: '関西',
  },
];

function entry(e: Partial<ParticipationEntry> & Pick<ParticipationEntry, 'id' | 'eventId' | 'displayName' | 'xId' | 'participationType' | 'participationDate' | 'createdAt'>): ParticipationEntry {
  return {
    comment: '',
    authStatus: 'verified_x',
    ...e,
  } as ParticipationEntry;
}

export const demoEntries: ParticipationEntry[] = [
  entry({
    id: 'demo-en-1',
    eventId: 'demo-ev-1',
    displayName: 'レムコス花子',
    xId: 'demo_user',
    userId: DEMO_USER_ID,
    xUsernameSnapshot: 'demo_user',
    participationType: 'cosplay',
    participationDate: '2026-07-04',
    comment: 'はじめまして！1日目参加します。お気軽に声かけてください。',
    cosplayInfo: { workName: 'Re:ゼロから始める異世界生活', characterName: 'レム', shootingStatus: 'greeting_welcome' },
    createdAt: '2026-06-20T10:00:00Z',
  }),
  entry({
    id: 'demo-en-2',
    eventId: 'demo-ev-1',
    displayName: 'カメラ太郎',
    xId: 'camera_taro',
    participationType: 'photographer',
    participationDate: '2026-07-04',
    comment: '自然光メインで撮ります。作例DMします。',
    photographerInfo: { targetWorks: 'リゼロ、青春ブタ野郎', availableHours: '11:00〜15:00', firstMeetStatus: 'ok', portfolioUrl: 'https://example.com/portfolio', shootingStyles: ['natural_light', 'portrait'] },
    createdAt: '2026-06-21T09:30:00Z',
  }),
  entry({
    id: 'demo-en-3',
    eventId: 'demo-ev-1',
    displayName: 'ごじょー',
    xId: 'cos_hanako',
    participationType: 'cosplay',
    participationDate: '2026-07-04',
    comment: '相互の方ぜひ！',
    cosplayInfo: { workName: '呪術廻戦', characterName: '五条悟', shootingStatus: 'mutual_ok' },
    createdAt: '2026-06-22T12:00:00Z',
  }),
  entry({
    id: 'demo-en-4',
    eventId: 'demo-ev-1',
    displayName: 'いっぱん参加者',
    xId: 'ippan_san',
    participationType: 'general',
    participationDate: '2026-07-04',
    comment: '見て回ります〜',
    createdAt: '2026-06-22T15:00:00Z',
  }),
  entry({
    id: 'demo-en-5',
    eventId: 'demo-ev-3',
    displayName: 'レムコス花子',
    xId: 'demo_user',
    userId: DEMO_USER_ID,
    xUsernameSnapshot: 'demo_user',
    participationType: 'cosplay',
    participationDate: '2026-07-12',
    comment: '名古屋も行きます！',
    cosplayInfo: { workName: '原神', characterName: '雷電将軍', shootingStatus: 'greeting_welcome' },
    createdAt: '2026-06-23T11:00:00Z',
  }),
  entry({
    id: 'demo-en-6',
    eventId: 'demo-ev-2',
    displayName: 'みくみく',
    xId: 'miku_cos',
    participationType: 'cosplay',
    participationDate: '2026-07-11',
    comment: '',
    cosplayInfo: { workName: '初音ミク', characterName: '初音ミク', shootingStatus: 'planned' },
    createdAt: '2026-06-23T18:00:00Z',
  }),
];

export function demoGetEventById(id: string): Event | null {
  return demoEvents.find((e) => e.id === id) ?? null;
}

export function demoCountsByEvent(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of demoEntries) counts[e.eventId] = (counts[e.eventId] ?? 0) + 1;
  return counts;
}

/** 不明なID（デモ作成直後など）には汎用のデモ参加表明を返して404を避ける */
export function demoGetEntryById(id: string): ParticipationEntry | null {
  const found = demoEntries.find((e) => e.id === id);
  if (found) return found;
  return entry({
    id,
    eventId: 'demo-ev-1',
    displayName: 'デモ参加表明',
    xId: 'demo_user',
    userId: DEMO_USER_ID,
    participationType: 'cosplay',
    participationDate: '2026-07-04',
    comment: 'これはデモ用に生成された参加表明です。',
    cosplayInfo: { workName: 'サンプル作品', characterName: 'サンプルキャラ', shootingStatus: 'greeting_welcome' },
    createdAt: new Date().toISOString(),
  });
}

export function demoCosplaySuggestions() {
  const works = new Set<string>();
  const allCharacters = new Set<string>();
  const charactersByWork: Record<string, string[]> = {};
  for (const e of demoEntries) {
    const w = e.cosplayInfo?.workName;
    const c = e.cosplayInfo?.characterName;
    if (w) works.add(w);
    if (c) allCharacters.add(c);
    if (w && c) (charactersByWork[w] ??= []).push(c);
  }
  return { works: [...works], charactersByWork, allCharacters: [...allCharacters] };
}
