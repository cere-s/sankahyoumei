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
  {
    id: 'demo-ev-6',
    name: 'ナガシマコスプレデー',
    date: '2026-07-26',
    location: 'ナガシマリゾート（三重県桑名市）',
    officialUrl: '',
    hashtag: 'ナガシマコス',
    description: '遊園地を貸し切ってのコスプレデー。アトラクションも楽しめる。',
    isImported: true,
    region: '東海',
    sourceSite: 'cos-cam.work',
    sourceUrl: 'https://example.com/nagashima',
  },
  {
    id: 'demo-ev-7',
    name: 'お台場サマーコスプレ 2026',
    date: '2026-08-01',
    location: 'お台場・青海エリア（東京都江東区）',
    officialUrl: 'https://example.com/odaiba',
    hashtag: 'お台場コス',
    description: '海沿いロケが人気の夏の大型イベント。',
    isImported: false,
    region: '関東',
  },
  {
    id: 'demo-ev-8',
    name: '神戸ハーバーコスプレイベント',
    date: '2026-08-08',
    location: 'メリケンパーク（兵庫県神戸市）',
    officialUrl: '',
    hashtag: '神戸コス',
    description: '港町の景観を活かしたロケーション撮影。',
    isImported: false,
    region: '関西',
  },
  {
    id: 'demo-ev-9',
    name: '横浜赤レンガコスプレ',
    date: '2026-08-15',
    location: '横浜赤レンガ倉庫（神奈川県横浜市）',
    officialUrl: '',
    hashtag: '赤レンガコス',
    description: 'レトロな赤レンガを背景に撮影できる人気スポット。',
    isImported: false,
    region: '関東',
  },
  {
    id: 'demo-ev-10',
    name: '名古屋城下町コスプレ',
    date: '2026-08-22',
    location: '名古屋城周辺（愛知県名古屋市）',
    officialUrl: '',
    hashtag: '',
    description: '和装・歴史系キャラにぴったりのロケーション。',
    isImported: true,
    region: '東海',
    sourceSite: 'cos-cam.work',
    sourceUrl: 'https://example.com/nagoyajo',
  },
  {
    id: 'demo-ev-11',
    name: '大阪城公園コスプレピクニック',
    date: '2026-08-29',
    location: '大阪城公園（大阪府大阪市）',
    officialUrl: '',
    hashtag: '大阪城コス',
    description: '広い公園でのんびり撮影＆交流。',
    isImported: false,
    region: '関西',
  },
  {
    id: 'demo-ev-12',
    name: '幕張メッセ大型コスプレ即売会',
    date: '2026-09-05',
    location: '幕張メッセ（千葉県千葉市）',
    officialUrl: 'https://example.com/makuhari',
    hashtag: '幕張コス',
    description: '屋内大型会場。即売会と同時開催の人気イベント。',
    isImported: false,
    region: '関東',
  },
];

function entry(e: Partial<ParticipationEntry> & Pick<ParticipationEntry, 'id' | 'eventId' | 'displayName' | 'xId' | 'participationType' | 'participationDate' | 'createdAt'>): ParticipationEntry {
  return {
    comment: '',
    authStatus: 'verified_x',
    ...e,
  } as ParticipationEntry;
}

type CosplayInfo = NonNullable<ParticipationEntry['cosplayInfo']>;
const C = (workName: string, characterName: string, shootingStatus: CosplayInfo['shootingStatus']): CosplayInfo =>
  ({ workName, characterName, shootingStatus });

export const demoEntries: ParticipationEntry[] = [
  // ===== demo-ev-1 池袋コスプレフェスティバル（人気・参加者多数）=====
  entry({
    id: 'demo-en-1', eventId: 'demo-ev-1', displayName: 'レムコス花子', xId: 'demo_user',
    userId: DEMO_USER_ID, xUsernameSnapshot: 'demo_user',
    participationType: 'cosplay', participationDate: '2026-07-04',
    comment: 'はじめまして！1日目参加します。お気軽に声かけてください。',
    cosplayInfo: C('Re:ゼロから始める異世界生活', 'レム', 'greeting_welcome'),
    createdAt: '2026-06-20T10:00:00Z',
  }),
  entry({
    id: 'demo-en-2', eventId: 'demo-ev-1', displayName: 'カメラ太郎', xId: 'camera_taro',
    participationType: 'photographer', participationDate: '2026-07-04',
    comment: '自然光メインで撮ります。作例DMします。',
    photographerInfo: { targetWorks: 'リゼロ、青春ブタ野郎', availableHours: '11:00〜15:00', firstMeetStatus: 'ok', portfolioUrl: 'https://example.com/portfolio', shootingStyles: ['natural_light', 'portrait'] },
    createdAt: '2026-06-21T09:30:00Z',
  }),
  entry({
    id: 'demo-en-3', eventId: 'demo-ev-1', displayName: 'ごじょー', xId: 'cos_satoru',
    participationType: 'cosplay', participationDate: '2026-07-04', comment: '相互の方ぜひ！',
    cosplayInfo: C('呪術廻戦', '五条悟', 'mutual_ok'),
    createdAt: '2026-06-22T12:00:00Z',
  }),
  entry({
    id: 'demo-en-4', eventId: 'demo-ev-1', displayName: 'いっぱん参加者', xId: 'ippan_san',
    participationType: 'general', participationDate: '2026-07-04', comment: '見て回ります〜',
    createdAt: '2026-06-22T15:00:00Z',
  }),
  entry({
    id: 'demo-en-5', eventId: 'demo-ev-1', displayName: 'まきま', xId: 'makima_cos',
    participationType: 'cosplay', participationDate: '2026-07-04', comment: '午後から参加です。',
    cosplayInfo: C('チェンソーマン', 'マキマ', 'after_meeting_ok'),
    createdAt: '2026-06-23T08:00:00Z',
  }),
  entry({
    id: 'demo-en-6', eventId: 'demo-ev-1', displayName: 'ぶるあか提督', xId: 'ba_sensei',
    participationType: 'cosplay', participationDate: '2026-07-04', comment: '',
    cosplayInfo: C('ブルーアーカイブ', 'アロナ', 'greeting_welcome'),
    createdAt: '2026-06-23T20:10:00Z',
  }),
  entry({
    id: 'demo-en-7', eventId: 'demo-ev-1', displayName: 'すとろぼ写真館', xId: 'strobe_ph',
    participationType: 'photographer', participationDate: '2026-07-04', comment: 'ストロボ持ち込みOK。',
    photographerInfo: { targetWorks: '何でも', availableHours: '終日', firstMeetStatus: 'mutual_only', portfolioUrl: '', shootingStyles: ['strobe_ok', 'recreation'] },
    createdAt: '2026-06-24T07:00:00Z',
  }),

  // ===== demo-ev-7 お台場サマーコスプレ（人気2位）=====
  entry({
    id: 'demo-en-8', eventId: 'demo-ev-7', displayName: 'レムコス花子', xId: 'demo_user',
    userId: DEMO_USER_ID, xUsernameSnapshot: 'demo_user',
    participationType: 'cosplay', participationDate: '2026-08-01', comment: '夏コスします！',
    cosplayInfo: C('ホロライブ', '兎田ぺこら', 'greeting_welcome'),
    createdAt: '2026-06-24T09:00:00Z',
  }),
  entry({
    id: 'demo-en-9', eventId: 'demo-ev-7', displayName: 'フリーレン推し', xId: 'frieren_x',
    participationType: 'cosplay', participationDate: '2026-08-01', comment: '海背景で撮りたい。',
    cosplayInfo: C('葬送のフリーレン', 'フリーレン', 'mutual_ok'),
    createdAt: '2026-06-24T09:20:00Z',
  }),
  entry({
    id: 'demo-en-10', eventId: 'demo-ev-7', displayName: 'アクア', xId: 'aqua_kono',
    participationType: 'cosplay', participationDate: '2026-08-01', comment: '',
    cosplayInfo: C('この素晴らしい世界に祝福を！', 'アクア', 'planned'),
    createdAt: '2026-06-24T10:00:00Z',
  }),
  entry({
    id: 'demo-en-11', eventId: 'demo-ev-7', displayName: 'ポトレ専門', xId: 'portrait_pro',
    participationType: 'photographer', participationDate: '2026-08-01', comment: 'ポートレート寄りで撮ります。',
    photographerInfo: { targetWorks: '女性キャラ全般', availableHours: '13:00〜17:00', firstMeetStatus: 'negotiable', portfolioUrl: 'https://example.com/pf2', shootingStyles: ['natural_light', 'portrait', 'social'] },
    createdAt: '2026-06-24T10:30:00Z',
  }),
  entry({
    id: 'demo-en-12', eventId: 'demo-ev-7', displayName: 'まだ未定さん', xId: 'mitei_x',
    participationType: 'undecided', participationDate: '2026-08-01', comment: '行けたら行きます。',
    createdAt: '2026-06-24T11:00:00Z',
  }),

  // ===== demo-ev-3 名古屋オアシス（本人参加）=====
  entry({
    id: 'demo-en-13', eventId: 'demo-ev-3', displayName: 'レムコス花子', xId: 'demo_user',
    userId: DEMO_USER_ID, xUsernameSnapshot: 'demo_user',
    participationType: 'cosplay', participationDate: '2026-07-12', comment: '名古屋も行きます！',
    cosplayInfo: C('原神', '雷電将軍', 'greeting_welcome'),
    createdAt: '2026-06-23T11:00:00Z',
  }),
  entry({
    id: 'demo-en-14', eventId: 'demo-ev-3', displayName: 'ぜんぜろ勢', xId: 'zzz_agent',
    participationType: 'cosplay', participationDate: '2026-07-12', comment: '',
    cosplayInfo: C('ゼンレスゾーンゼロ', '星見雅', 'mutual_ok'),
    createdAt: '2026-06-23T16:00:00Z',
  }),
  entry({
    id: 'demo-en-15', eventId: 'demo-ev-3', displayName: '名古屋カメラ', xId: 'nagoya_cam',
    participationType: 'photographer', participationDate: '2026-07-12', comment: '',
    photographerInfo: { targetWorks: 'ゲーム系', availableHours: '10:00〜14:00', firstMeetStatus: 'ok', portfolioUrl: '', shootingStyles: ['natural_light'] },
    createdAt: '2026-06-23T17:30:00Z',
  }),

  // ===== demo-ev-2 大阪南港 =====
  entry({
    id: 'demo-en-16', eventId: 'demo-ev-2', displayName: 'みくみく', xId: 'miku_cos',
    participationType: 'cosplay', participationDate: '2026-07-11', comment: '',
    cosplayInfo: C('初音ミク', '初音ミク', 'planned'),
    createdAt: '2026-06-23T18:00:00Z',
  }),
  entry({
    id: 'demo-en-17', eventId: 'demo-ev-2', displayName: 'ねずこ', xId: 'nezuko_kmt',
    participationType: 'cosplay', participationDate: '2026-07-11', comment: '相互のみでお願いします。',
    cosplayInfo: C('鬼滅の刃', '竈門禰豆子', 'acquaintance_only'),
    createdAt: '2026-06-24T06:30:00Z',
  }),

  // ===== demo-ev-12 幕張メッセ（人気3位）=====
  entry({
    id: 'demo-en-18', eventId: 'demo-ev-12', displayName: 'アーニャ', xId: 'anya_sxf',
    participationType: 'cosplay', participationDate: '2026-09-05', comment: 'わくわく！',
    cosplayInfo: C('SPY×FAMILY', 'アーニャ・フォージャー', 'greeting_welcome'),
    createdAt: '2026-06-24T12:00:00Z',
  }),
  entry({
    id: 'demo-en-19', eventId: 'demo-ev-12', displayName: 'ルビー', xId: 'oshinoko_ruby',
    participationType: 'cosplay', participationDate: '2026-09-05', comment: '',
    cosplayInfo: C('【推しの子】', '星野ルビー', 'mutual_ok'),
    createdAt: '2026-06-24T12:20:00Z',
  }),
  entry({
    id: 'demo-en-20', eventId: 'demo-ev-12', displayName: '即売会カメラ', xId: 'event_cam',
    participationType: 'photographer', participationDate: '2026-09-05', comment: '',
    photographerInfo: { targetWorks: '何でも', availableHours: '終日', firstMeetStatus: 'ok', portfolioUrl: '', shootingStyles: ['strobe_ok', 'portrait'] },
    createdAt: '2026-06-24T12:40:00Z',
  }),

  // ===== その他のイベント（各1〜2件）=====
  entry({
    id: 'demo-en-21', eventId: 'demo-ev-5', displayName: '和装れいむ', xId: 'reimu_wasou',
    participationType: 'cosplay', participationDate: '2026-07-20', comment: '和装で参加します。',
    cosplayInfo: C('東方Project', '博麗霊夢', 'greeting_welcome'),
    createdAt: '2026-06-22T19:00:00Z',
  }),
  entry({
    id: 'demo-en-22', eventId: 'demo-ev-6', displayName: 'ナガシマ太郎', xId: 'nagashima_t',
    participationType: 'general', participationDate: '2026-07-26', comment: 'アトラクションも楽しみます。',
    createdAt: '2026-06-23T13:00:00Z',
  }),
  entry({
    id: 'demo-en-23', eventId: 'demo-ev-8', displayName: '神戸みなと', xId: 'kobe_minato',
    participationType: 'cosplay', participationDate: '2026-08-08', comment: '',
    cosplayInfo: C('ラブライブ！', '高坂穂乃果', 'mutual_ok'),
    createdAt: '2026-06-24T08:30:00Z',
  }),
  entry({
    id: 'demo-en-24', eventId: 'demo-ev-9', displayName: 'レンガ撮影隊', xId: 'renga_ph',
    participationType: 'photographer', participationDate: '2026-08-15', comment: 'レトロ背景得意です。',
    photographerInfo: { targetWorks: '洋装・制服系', availableHours: '14:00〜18:00', firstMeetStatus: 'mutual_only', portfolioUrl: '', shootingStyles: ['natural_light', 'portrait'] },
    createdAt: '2026-06-24T09:50:00Z',
  }),
  entry({
    id: 'demo-en-25', eventId: 'demo-ev-11', displayName: 'ぴくにっく', xId: 'picnic_cos',
    participationType: 'general', participationDate: '2026-08-29', comment: 'のんびり交流したいです。',
    createdAt: '2026-06-24T10:10:00Z',
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
