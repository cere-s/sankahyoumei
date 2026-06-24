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
  { id: 'demo-ev-1', name: '池袋コスプレフェスティバル 2026夏', date: '2026-07-04', location: '池袋エリア（東京都豊島区）', officialUrl: 'https://example.com/ikebukuro', hashtag: '池袋コスフェス', description: '街全体がコスプレOKになる大型イベント。初参加歓迎。', isImported: false, region: '関東' },
  { id: 'demo-ev-2', name: '大阪南港コスプレイベント', date: '2026-07-11', location: 'ATCホール（大阪府大阪市）', officialUrl: '', hashtag: '南港コス', description: '屋内スタジオ＆屋外ロケが楽しめる関西の定番イベント。', isImported: false, region: '関西' },
  { id: 'demo-ev-3', name: '名古屋オアシスコスプレデー', date: '2026-07-12', location: 'オアシス21（愛知県名古屋市）', officialUrl: '', hashtag: 'オアシスコス', description: '名古屋の中心地で開催。アクセス良好。', isImported: true, region: '東海', sourceSite: 'cos-cam.work', sourceUrl: 'https://example.com/oasis' },
  { id: 'demo-ev-4', name: 'さいたまスタジオ撮影会', date: '2026-07-19', location: '大宮スタジオ（埼玉県さいたま市）', officialUrl: '', hashtag: '', description: '少人数制のスタジオ撮影会。', isImported: false, region: '関東' },
  { id: 'demo-ev-5', name: '京都和装ロケ撮影', date: '2026-07-20', location: '嵐山（京都府京都市）', officialUrl: '', hashtag: '京都和装', description: '和装・和風キャラ向けのロケーション撮影。', isImported: false, region: '関西' },
  { id: 'demo-ev-6', name: 'ナガシマコスプレデー', date: '2026-07-26', location: 'ナガシマリゾート（三重県桑名市）', officialUrl: '', hashtag: 'ナガシマコス', description: '遊園地を貸し切ってのコスプレデー。アトラクションも楽しめる。', isImported: true, region: '東海', sourceSite: 'cos-cam.work', sourceUrl: 'https://example.com/nagashima' },
  { id: 'demo-ev-7', name: 'お台場サマーコスプレ 2026', date: '2026-08-01', location: 'お台場・青海エリア（東京都江東区）', officialUrl: 'https://example.com/odaiba', hashtag: 'お台場コス', description: '海沿いロケが人気の夏の大型イベント。', isImported: false, region: '関東' },
  { id: 'demo-ev-8', name: '神戸ハーバーコスプレイベント', date: '2026-08-08', location: 'メリケンパーク（兵庫県神戸市）', officialUrl: '', hashtag: '神戸コス', description: '港町の景観を活かしたロケーション撮影。', isImported: false, region: '関西' },
  { id: 'demo-ev-9', name: '横浜赤レンガコスプレ', date: '2026-08-15', location: '横浜赤レンガ倉庫（神奈川県横浜市）', officialUrl: '', hashtag: '赤レンガコス', description: 'レトロな赤レンガを背景に撮影できる人気スポット。', isImported: false, region: '関東' },
  { id: 'demo-ev-10', name: '名古屋城下町コスプレ', date: '2026-08-22', location: '名古屋城周辺（愛知県名古屋市）', officialUrl: '', hashtag: '', description: '和装・歴史系キャラにぴったりのロケーション。', isImported: true, region: '東海', sourceSite: 'cos-cam.work', sourceUrl: 'https://example.com/nagoyajo' },
  { id: 'demo-ev-11', name: '大阪城公園コスプレピクニック', date: '2026-08-29', location: '大阪城公園（大阪府大阪市）', officialUrl: '', hashtag: '大阪城コス', description: '広い公園でのんびり撮影＆交流。', isImported: false, region: '関西' },
  { id: 'demo-ev-12', name: '幕張メッセ大型コスプレ即売会', date: '2026-09-05', location: '幕張メッセ（千葉県千葉市）', officialUrl: 'https://example.com/makuhari', hashtag: '幕張コス', description: '屋内大型会場。即売会と同時開催の人気イベント。', isImported: false, region: '関東' },
];

function entry(e: Partial<ParticipationEntry> & Pick<ParticipationEntry, 'id' | 'eventId' | 'displayName' | 'xId' | 'participationType' | 'participationDate' | 'createdAt'>): ParticipationEntry {
  return { comment: '', authStatus: 'verified_x', ...e } as ParticipationEntry;
}

type CosplayInfo = NonNullable<ParticipationEntry['cosplayInfo']>;
const C = (workName: string, characterName: string, shootingStatus: CosplayInfo['shootingStatus']): CosplayInfo =>
  ({ workName, characterName, shootingStatus });

export const demoEntries: ParticipationEntry[] = [
  // ===== demo-ev-1 池袋コスプレフェスティバル =====
  entry({ id: 'demo-en-1', eventId: 'demo-ev-1', displayName: 'レムコス花子', xId: 'demo_user', userId: DEMO_USER_ID, xUsernameSnapshot: 'demo_user', participationType: 'cosplay', participationDate: '2026-07-04', comment: 'はじめまして！1日目参加します。お気軽に声かけてください。', cosplayInfo: C('Re:ゼロから始める異世界生活', 'レム', 'greeting_welcome'), createdAt: '2026-06-20T10:00:00Z' }),
  entry({ id: 'demo-en-2', eventId: 'demo-ev-1', displayName: 'カメラ太郎', xId: 'camera_taro', participationType: 'photographer', participationDate: '2026-07-04', comment: '自然光メインで撮ります。作例DMします。', photographerInfo: { targetWorks: 'リゼロ、青春ブタ野郎', availableHours: '11:00〜15:00', firstMeetStatus: 'ok', portfolioUrl: 'https://example.com/portfolio', shootingStyles: ['natural_light', 'portrait'] }, createdAt: '2026-06-21T09:30:00Z' }),
  entry({ id: 'demo-en-3', eventId: 'demo-ev-1', displayName: 'ごじょー', xId: 'cos_satoru', participationType: 'cosplay', participationDate: '2026-07-04', comment: '相互の方ぜひ！', cosplayInfo: C('呪術廻戦', '五条悟', 'mutual_ok'), createdAt: '2026-06-22T12:00:00Z' }),
  entry({ id: 'demo-en-4', eventId: 'demo-ev-1', displayName: 'いっぱん参加者', xId: 'ippan_san', participationType: 'general', participationDate: '2026-07-04', comment: '見て回ります〜', createdAt: '2026-06-22T15:00:00Z' }),
  entry({ id: 'demo-en-5', eventId: 'demo-ev-1', displayName: 'まきま', xId: 'makima_cos', participationType: 'cosplay', participationDate: '2026-07-04', comment: '午後から参加です。', cosplayInfo: C('チェンソーマン', 'マキマ', 'after_meeting_ok'), createdAt: '2026-06-23T08:00:00Z' }),
  entry({ id: 'demo-en-6', eventId: 'demo-ev-1', displayName: 'ぶるあか提督', xId: 'ba_sensei', participationType: 'cosplay', participationDate: '2026-07-04', comment: '', cosplayInfo: C('ブルーアーカイブ', 'アロナ', 'greeting_welcome'), createdAt: '2026-06-23T20:10:00Z' }),
  entry({ id: 'demo-en-7', eventId: 'demo-ev-1', displayName: 'すとろぼ写真館', xId: 'strobe_ph', participationType: 'photographer', participationDate: '2026-07-04', comment: 'ストロボ持ち込みOK。', photographerInfo: { targetWorks: '何でも', availableHours: '終日', firstMeetStatus: 'mutual_only', portfolioUrl: '', shootingStyles: ['strobe_ok', 'recreation'] }, createdAt: '2026-06-24T07:00:00Z' }),
  entry({ id: 'demo-en-26', eventId: 'demo-ev-1', displayName: 'ゆいエミ', xId: 'yui_emi', participationType: 'cosplay', participationDate: '2026-07-04', comment: '', cosplayInfo: C('Re:ゼロから始める異世界生活', 'エミリア', 'greeting_welcome'), createdAt: '2026-06-15T08:00:00Z' }),
  entry({ id: 'demo-en-27', eventId: 'demo-ev-1', displayName: 'いたどり推し', xId: 'itadori_x', participationType: 'cosplay', participationDate: '2026-07-04', comment: '相互だと嬉しいです。', cosplayInfo: C('呪術廻戦', '虎杖悠仁', 'mutual_ok'), createdAt: '2026-06-15T14:00:00Z' }),
  entry({ id: 'demo-en-28', eventId: 'demo-ev-1', displayName: 'たんじろう', xId: 'tanjiro_cos', participationType: 'cosplay', participationDate: '2026-07-04', comment: 'よろしくお願いします！', cosplayInfo: C('鬼滅の刃', '竈門炭治郎', 'greeting_welcome'), createdAt: '2026-06-16T09:00:00Z' }),
  entry({ id: 'demo-en-29', eventId: 'demo-ev-1', displayName: 'ほたる', xId: 'hutao_h', participationType: 'cosplay', participationDate: '2026-07-04', comment: '', cosplayInfo: C('原神', '胡桃', 'planned'), createdAt: '2026-06-16T18:30:00Z' }),
  entry({ id: 'demo-en-30', eventId: 'demo-ev-1', displayName: 'ひかりカメラ', xId: 'hikari_cam', participationType: 'photographer', participationDate: '2026-07-04', comment: '', photographerInfo: { targetWorks: 'リゼロ、原神', availableHours: '10:00〜16:00', firstMeetStatus: 'ok', portfolioUrl: 'https://example.com/pf/hikari', shootingStyles: ['natural_light', 'portrait'] }, createdAt: '2026-06-17T11:00:00Z' }),
  entry({ id: 'demo-en-31', eventId: 'demo-ev-1', displayName: 'せんちょー', xId: 'marine_cos', participationType: 'cosplay', participationDate: '2026-07-04', comment: '知り合いさん優先で。', cosplayInfo: C('ホロライブ', '宝鐘マリン', 'acquaintance_only'), createdAt: '2026-06-17T21:00:00Z' }),
  entry({ id: 'demo-en-32', eventId: 'demo-ev-1', displayName: 'ぶらり見学', xId: 'burari_x', participationType: 'general', participationDate: '2026-07-04', comment: '雰囲気見にいきます。', createdAt: '2026-06-18T07:30:00Z' }),
  entry({ id: 'demo-en-33', eventId: 'demo-ev-1', displayName: 'ヨルさん', xId: 'yor_cos', participationType: 'cosplay', participationDate: '2026-07-04', comment: '', cosplayInfo: C('SPY×FAMILY', 'ヨル・フォージャー', 'mutual_ok'), createdAt: '2026-06-18T19:00:00Z' }),
  entry({ id: 'demo-en-34', eventId: 'demo-ev-1', displayName: 'しろこ', xId: 'shiroko_ba', participationType: 'cosplay', participationDate: '2026-07-04', comment: 'はじめてのイベントです！', cosplayInfo: C('ブルーアーカイブ', 'シロコ', 'greeting_welcome'), createdAt: '2026-06-19T10:00:00Z' }),
  entry({ id: 'demo-en-35', eventId: 'demo-ev-1', displayName: 'スタジオ系撮影', xId: 'studio_ph', participationType: 'photographer', participationDate: '2026-07-04', comment: 'ストロボ・レフ持参。', photographerInfo: { targetWorks: '何でも', availableHours: '13:00〜18:00', firstMeetStatus: 'negotiable', portfolioUrl: '', shootingStyles: ['strobe_ok', 'portrait'] }, createdAt: '2026-06-19T16:00:00Z' }),

  // ===== demo-ev-2 大阪南港 =====
  entry({ id: 'demo-en-16', eventId: 'demo-ev-2', displayName: 'みくみく', xId: 'miku_cos', participationType: 'cosplay', participationDate: '2026-07-11', comment: '', cosplayInfo: C('ボーカロイド', '初音ミク', 'planned'), createdAt: '2026-06-23T18:00:00Z' }),
  entry({ id: 'demo-en-17', eventId: 'demo-ev-2', displayName: 'ねずこ', xId: 'nezuko_kmt', participationType: 'cosplay', participationDate: '2026-07-11', comment: '相互のみでお願いします。', cosplayInfo: C('鬼滅の刃', '竈門禰豆子', 'acquaintance_only'), createdAt: '2026-06-24T06:30:00Z' }),
  entry({ id: 'demo-en-36', eventId: 'demo-ev-2', displayName: 'まりさ', xId: 'marisa_t', participationType: 'cosplay', participationDate: '2026-07-11', comment: 'だぜ！', cosplayInfo: C('東方Project', '霧雨魔理沙', 'greeting_welcome'), createdAt: '2026-06-14T12:00:00Z' }),
  entry({ id: 'demo-en-37', eventId: 'demo-ev-2', displayName: 'かな推し', xId: 'kana_oshi', participationType: 'cosplay', participationDate: '2026-07-11', comment: '', cosplayInfo: C('【推しの子】', '有馬かな', 'mutual_ok'), createdAt: '2026-06-15T13:00:00Z' }),
  entry({ id: 'demo-en-38', eventId: 'demo-ev-2', displayName: '南港フォト', xId: 'nankou_ph', participationType: 'photographer', participationDate: '2026-07-11', comment: '屋内外どちらも対応。', photographerInfo: { targetWorks: '女性キャラ中心', availableHours: '11:00〜16:00', firstMeetStatus: 'ok', portfolioUrl: '', shootingStyles: ['natural_light'] }, createdAt: '2026-06-16T15:00:00Z' }),
  entry({ id: 'demo-en-39', eventId: 'demo-ev-2', displayName: 'かんう', xId: 'ganyu_g', participationType: 'cosplay', participationDate: '2026-07-11', comment: '', cosplayInfo: C('原神', '甘雨', 'planned'), createdAt: '2026-06-18T20:00:00Z' }),
  entry({ id: 'demo-en-40', eventId: 'demo-ev-2', displayName: '関西初参加', xId: 'kansai_new', participationType: 'general', participationDate: '2026-07-11', comment: 'はじめてなのでドキドキ。', createdAt: '2026-06-20T09:00:00Z' }),

  // ===== demo-ev-3 名古屋オアシス（本人参加）=====
  entry({ id: 'demo-en-13', eventId: 'demo-ev-3', displayName: 'レムコス花子', xId: 'demo_user', userId: DEMO_USER_ID, xUsernameSnapshot: 'demo_user', participationType: 'cosplay', participationDate: '2026-07-12', comment: '名古屋も行きます！', cosplayInfo: C('原神', '雷電将軍', 'greeting_welcome'), createdAt: '2026-06-23T11:00:00Z' }),
  entry({ id: 'demo-en-14', eventId: 'demo-ev-3', displayName: 'ぜんぜろ勢', xId: 'zzz_agent', participationType: 'cosplay', participationDate: '2026-07-12', comment: '', cosplayInfo: C('ゼンレスゾーンゼロ', '星見雅', 'mutual_ok'), createdAt: '2026-06-23T16:00:00Z' }),
  entry({ id: 'demo-en-15', eventId: 'demo-ev-3', displayName: '名古屋カメラ', xId: 'nagoya_cam', participationType: 'photographer', participationDate: '2026-07-12', comment: '', photographerInfo: { targetWorks: 'ゲーム系', availableHours: '10:00〜14:00', firstMeetStatus: 'ok', portfolioUrl: '', shootingStyles: ['natural_light'] }, createdAt: '2026-06-23T17:30:00Z' }),
  entry({ id: 'demo-en-41', eventId: 'demo-ev-3', displayName: 'ふしぐろ', xId: 'fushiguro_x', participationType: 'cosplay', participationDate: '2026-07-12', comment: '', cosplayInfo: C('呪術廻戦', '伏黒恵', 'mutual_ok'), createdAt: '2026-06-14T10:00:00Z' }),
  entry({ id: 'demo-en-42', eventId: 'demo-ev-3', displayName: 'フェルン', xId: 'fern_cos', participationType: 'cosplay', participationDate: '2026-07-12', comment: 'よろしくお願いします。', cosplayInfo: C('葬送のフリーレン', 'フェルン', 'greeting_welcome'), createdAt: '2026-06-15T11:30:00Z' }),
  entry({ id: 'demo-en-43', eventId: 'demo-ev-3', displayName: 'ぱわー', xId: 'power_cm', participationType: 'cosplay', participationDate: '2026-07-12', comment: '当日交流後ならOKです。', cosplayInfo: C('チェンソーマン', 'パワー', 'after_meeting_ok'), createdAt: '2026-06-17T19:00:00Z' }),
  entry({ id: 'demo-en-44', eventId: 'demo-ev-3', displayName: 'オアシス撮影', xId: 'oasis_ph', participationType: 'photographer', participationDate: '2026-07-12', comment: '', photographerInfo: { targetWorks: '何でも', availableHours: '13:00〜17:00', firstMeetStatus: 'negotiable', portfolioUrl: '', shootingStyles: ['portrait', 'social'] }, createdAt: '2026-06-18T13:00:00Z' }),
  entry({ id: 'demo-en-45', eventId: 'demo-ev-3', displayName: 'ほしの', xId: 'hoshino_ba', participationType: 'cosplay', participationDate: '2026-07-12', comment: '', cosplayInfo: C('ブルーアーカイブ', 'ホシノ', 'greeting_welcome'), createdAt: '2026-06-20T15:00:00Z' }),

  // ===== demo-ev-4 さいたまスタジオ撮影会 =====
  entry({ id: 'demo-en-46', eventId: 'demo-ev-4', displayName: 'ツービー', xId: 'nier_2b', participationType: 'cosplay', participationDate: '2026-07-19', comment: '', cosplayInfo: C('ニーア オートマタ', '2B', 'mutual_ok'), createdAt: '2026-06-13T10:00:00Z' }),
  entry({ id: 'demo-en-47', eventId: 'demo-ev-4', displayName: '大宮スタジオ撮影', xId: 'omiya_ph', participationType: 'photographer', participationDate: '2026-07-19', comment: 'スタジオ撮影得意です。', photographerInfo: { targetWorks: '何でも', availableHours: '10:00〜18:00', firstMeetStatus: 'ok', portfolioUrl: 'https://example.com/pf/omiya', shootingStyles: ['strobe_ok', 'portrait'] }, createdAt: '2026-06-14T16:00:00Z' }),
  entry({ id: 'demo-en-48', eventId: 'demo-ev-4', displayName: 'なひーだ', xId: 'nahida_g', participationType: 'cosplay', participationDate: '2026-07-19', comment: '', cosplayInfo: C('原神', 'ナヒーダ', 'greeting_welcome'), createdAt: '2026-06-16T12:00:00Z' }),
  entry({ id: 'demo-en-49', eventId: 'demo-ev-4', displayName: 'しのぶ', xId: 'shinobu_kmt', participationType: 'cosplay', participationDate: '2026-07-19', comment: '知り合いさんと。', cosplayInfo: C('鬼滅の刃', '胡蝶しのぶ', 'acquaintance_only'), createdAt: '2026-06-18T09:00:00Z' }),
  entry({ id: 'demo-en-50', eventId: 'demo-ev-4', displayName: 'スタジオ見学', xId: 'studio_guest', participationType: 'general', participationDate: '2026-07-19', comment: '', createdAt: '2026-06-21T11:00:00Z' }),

  // ===== demo-ev-5 京都和装ロケ撮影 =====
  entry({ id: 'demo-en-21', eventId: 'demo-ev-5', displayName: '和装れいむ', xId: 'reimu_wasou', participationType: 'cosplay', participationDate: '2026-07-20', comment: '和装で参加します。', cosplayInfo: C('東方Project', '博麗霊夢', 'greeting_welcome'), createdAt: '2026-06-22T19:00:00Z' }),
  entry({ id: 'demo-en-51', eventId: 'demo-ev-5', displayName: 'さくや', xId: 'sakuya_t', participationType: 'cosplay', participationDate: '2026-07-20', comment: '', cosplayInfo: C('東方Project', '十六夜咲夜', 'greeting_welcome'), createdAt: '2026-06-13T13:00:00Z' }),
  entry({ id: 'demo-en-52', eventId: 'demo-ev-5', displayName: 'みつり', xId: 'mitsuri_kmt', participationType: 'cosplay', participationDate: '2026-07-20', comment: '相互の方ぜひ。', cosplayInfo: C('鬼滅の刃', '甘露寺蜜璃', 'mutual_ok'), createdAt: '2026-06-15T17:00:00Z' }),
  entry({ id: 'demo-en-53', eventId: 'demo-ev-5', displayName: '和装専門カメラ', xId: 'wasou_cam', participationType: 'photographer', participationDate: '2026-07-20', comment: '和装ロケ得意です。', photographerInfo: { targetWorks: '和装・和風キャラ', availableHours: '9:00〜13:00', firstMeetStatus: 'ok', portfolioUrl: '', shootingStyles: ['natural_light'] }, createdAt: '2026-06-17T08:30:00Z' }),
  entry({ id: 'demo-en-54', eventId: 'demo-ev-5', displayName: 'ことり', xId: 'kotori_ll', participationType: 'cosplay', participationDate: '2026-07-20', comment: '', cosplayInfo: C('ラブライブ！', '南ことり', 'planned'), createdAt: '2026-06-20T14:00:00Z' }),

  // ===== demo-ev-6 ナガシマコスプレデー =====
  entry({ id: 'demo-en-22', eventId: 'demo-ev-6', displayName: 'ナガシマ太郎', xId: 'nagashima_t', participationType: 'general', participationDate: '2026-07-26', comment: 'アトラクションも楽しみます。', createdAt: '2026-06-23T13:00:00Z' }),
  entry({ id: 'demo-en-55', eventId: 'demo-ev-6', displayName: 'ていおー', xId: 'teio_uma', participationType: 'cosplay', participationDate: '2026-07-26', comment: '', cosplayInfo: C('ウマ娘 プリティーダービー', 'トウカイテイオー', 'greeting_welcome'), createdAt: '2026-06-14T11:00:00Z' }),
  entry({ id: 'demo-en-56', eventId: 'demo-ev-6', displayName: 'こくせい', xId: 'keqing_g', participationType: 'cosplay', participationDate: '2026-07-26', comment: '', cosplayInfo: C('原神', '刻晴', 'mutual_ok'), createdAt: '2026-06-16T19:30:00Z' }),
  entry({ id: 'demo-en-57', eventId: 'demo-ev-6', displayName: 'ナガシマ撮影', xId: 'nagashima_ph', participationType: 'photographer', participationDate: '2026-07-26', comment: '', photographerInfo: { targetWorks: '何でも', availableHours: '終日', firstMeetStatus: 'negotiable', portfolioUrl: '', shootingStyles: ['strobe_ok', 'recreation'] }, createdAt: '2026-06-19T12:00:00Z' }),
  entry({ id: 'demo-en-58', eventId: 'demo-ev-6', displayName: '家族で参加', xId: 'kazoku_x', participationType: 'general', participationDate: '2026-07-26', comment: '家族で遊びにいきます。', createdAt: '2026-06-22T10:00:00Z' }),

  // ===== demo-ev-7 お台場サマーコスプレ =====
  entry({ id: 'demo-en-8', eventId: 'demo-ev-7', displayName: 'レムコス花子', xId: 'demo_user', userId: DEMO_USER_ID, xUsernameSnapshot: 'demo_user', participationType: 'cosplay', participationDate: '2026-08-01', comment: '夏コスします！', cosplayInfo: C('ホロライブ', '兎田ぺこら', 'greeting_welcome'), createdAt: '2026-06-24T09:00:00Z' }),
  entry({ id: 'demo-en-9', eventId: 'demo-ev-7', displayName: 'フリーレン推し', xId: 'frieren_x', participationType: 'cosplay', participationDate: '2026-08-01', comment: '海背景で撮りたい。', cosplayInfo: C('葬送のフリーレン', 'フリーレン', 'mutual_ok'), createdAt: '2026-06-24T09:20:00Z' }),
  entry({ id: 'demo-en-10', eventId: 'demo-ev-7', displayName: 'アクア', xId: 'aqua_kono', participationType: 'cosplay', participationDate: '2026-08-01', comment: '', cosplayInfo: C('この素晴らしい世界に祝福を！', 'アクア', 'planned'), createdAt: '2026-06-24T10:00:00Z' }),
  entry({ id: 'demo-en-11', eventId: 'demo-ev-7', displayName: 'ポトレ専門', xId: 'portrait_pro', participationType: 'photographer', participationDate: '2026-08-01', comment: 'ポートレート寄りで撮ります。', photographerInfo: { targetWorks: '女性キャラ全般', availableHours: '13:00〜17:00', firstMeetStatus: 'negotiable', portfolioUrl: 'https://example.com/pf2', shootingStyles: ['natural_light', 'portrait', 'social'] }, createdAt: '2026-06-24T10:30:00Z' }),
  entry({ id: 'demo-en-12', eventId: 'demo-ev-7', displayName: 'まだ未定さん', xId: 'mitei_x', participationType: 'undecided', participationDate: '2026-08-01', comment: '行けたら行きます。', createdAt: '2026-06-24T11:00:00Z' }),
  entry({ id: 'demo-en-59', eventId: 'demo-ev-7', displayName: 'らむ', xId: 'ram_rezero', participationType: 'cosplay', participationDate: '2026-08-01', comment: '', cosplayInfo: C('Re:ゼロから始める異世界生活', 'ラム', 'greeting_welcome'), createdAt: '2026-06-12T10:00:00Z' }),
  entry({ id: 'demo-en-60', eventId: 'demo-ev-7', displayName: 'のばら', xId: 'nobara_jjk', participationType: 'cosplay', participationDate: '2026-08-01', comment: '相互だと嬉しい！', cosplayInfo: C('呪術廻戦', '釘崎野薔薇', 'mutual_ok'), createdAt: '2026-06-13T14:00:00Z' }),
  entry({ id: 'demo-en-61', eventId: 'demo-ev-7', displayName: 'ゆうか', xId: 'yuuka_ba', participationType: 'cosplay', participationDate: '2026-08-01', comment: '', cosplayInfo: C('ブルーアーカイブ', 'ユウカ', 'planned'), createdAt: '2026-06-14T18:00:00Z' }),
  entry({ id: 'demo-en-62', eventId: 'demo-ev-7', displayName: '海フォト', xId: 'umi_photo', participationType: 'photographer', participationDate: '2026-08-01', comment: '海ロケ撮ります。', photographerInfo: { targetWorks: '何でも', availableHours: '15:00〜18:00', firstMeetStatus: 'ok', portfolioUrl: '', shootingStyles: ['natural_light', 'portrait'] }, createdAt: '2026-06-15T16:00:00Z' }),
  entry({ id: 'demo-en-63', eventId: 'demo-ev-7', displayName: 'めむ', xId: 'memcho_x', participationType: 'cosplay', participationDate: '2026-08-01', comment: '', cosplayInfo: C('【推しの子】', 'MEMちょ', 'greeting_welcome'), createdAt: '2026-06-16T20:00:00Z' }),
  entry({ id: 'demo-en-64', eventId: 'demo-ev-7', displayName: 'えんたー', xId: 'enterprise_al', participationType: 'cosplay', participationDate: '2026-08-01', comment: '知り合いさん中心で。', cosplayInfo: C('アズールレーン', 'エンタープライズ', 'acquaintance_only'), createdAt: '2026-06-18T11:00:00Z' }),
  entry({ id: 'demo-en-65', eventId: 'demo-ev-7', displayName: 'ポトレ夏', xId: 'natsu_portrait', participationType: 'photographer', participationDate: '2026-08-01', comment: '', photographerInfo: { targetWorks: '女性キャラ', availableHours: '11:00〜15:00', firstMeetStatus: 'mutual_only', portfolioUrl: '', shootingStyles: ['portrait', 'social'] }, createdAt: '2026-06-19T13:00:00Z' }),
  entry({ id: 'demo-en-66', eventId: 'demo-ev-7', displayName: 'いえらん', xId: 'yelan_g', participationType: 'cosplay', participationDate: '2026-08-01', comment: '', cosplayInfo: C('原神', '夜蘭', 'mutual_ok'), createdAt: '2026-06-21T17:00:00Z' }),
  entry({ id: 'demo-en-67', eventId: 'demo-ev-7', displayName: '様子見', xId: 'yousumi_x', participationType: 'undecided', participationDate: '2026-08-01', comment: '予定が読めず…', createdAt: '2026-06-22T08:00:00Z' }),

  // ===== demo-ev-8 神戸ハーバー =====
  entry({ id: 'demo-en-23', eventId: 'demo-ev-8', displayName: '神戸みなと', xId: 'kobe_minato', participationType: 'cosplay', participationDate: '2026-08-08', comment: '', cosplayInfo: C('ラブライブ！', '高坂穂乃果', 'mutual_ok'), createdAt: '2026-06-24T08:30:00Z' }),
  entry({ id: 'demo-en-68', eventId: 'demo-ev-8', displayName: 'しゅたるく', xId: 'stark_cos', participationType: 'cosplay', participationDate: '2026-08-08', comment: '', cosplayInfo: C('葬送のフリーレン', 'シュタルク', 'greeting_welcome'), createdAt: '2026-06-13T09:00:00Z' }),
  entry({ id: 'demo-en-69', eventId: 'demo-ev-8', displayName: 'ふぶき', xId: 'fubuki_cos', participationType: 'cosplay', participationDate: '2026-08-08', comment: 'こんこん！', cosplayInfo: C('ホロライブ', '白上フブキ', 'mutual_ok'), createdAt: '2026-06-15T19:00:00Z' }),
  entry({ id: 'demo-en-70', eventId: 'demo-ev-8', displayName: '神戸ロケ撮影', xId: 'kobe_loc', participationType: 'photographer', participationDate: '2026-08-08', comment: '港ロケ得意。', photographerInfo: { targetWorks: '何でも', availableHours: '14:00〜18:00', firstMeetStatus: 'ok', portfolioUrl: '', shootingStyles: ['natural_light'] }, createdAt: '2026-06-17T15:00:00Z' }),
  entry({ id: 'demo-en-71', eventId: 'demo-ev-8', displayName: 'ぜんいつ', xId: 'zenitsu_kmt', participationType: 'cosplay', participationDate: '2026-08-08', comment: '', cosplayInfo: C('鬼滅の刃', '我妻善逸', 'planned'), createdAt: '2026-06-20T12:00:00Z' }),
  entry({ id: 'demo-en-72', eventId: 'demo-ev-8', displayName: 'みなと散歩', xId: 'minato_walk', participationType: 'general', participationDate: '2026-08-08', comment: '', createdAt: '2026-06-22T16:00:00Z' }),

  // ===== demo-ev-9 横浜赤レンガ =====
  entry({ id: 'demo-en-24', eventId: 'demo-ev-9', displayName: 'レンガ撮影隊', xId: 'renga_ph', participationType: 'photographer', participationDate: '2026-08-15', comment: 'レトロ背景得意です。', photographerInfo: { targetWorks: '洋装・制服系', availableHours: '14:00〜18:00', firstMeetStatus: 'mutual_only', portfolioUrl: '', shootingStyles: ['natural_light', 'portrait'] }, createdAt: '2026-06-24T09:50:00Z' }),
  entry({ id: 'demo-en-73', eventId: 'demo-ev-9', displayName: 'ロイド', xId: 'loid_sxf', participationType: 'cosplay', participationDate: '2026-08-15', comment: '', cosplayInfo: C('SPY×FAMILY', 'ロイド・フォージャー', 'mutual_ok'), createdAt: '2026-06-12T13:00:00Z' }),
  entry({ id: 'demo-en-74', eventId: 'demo-ev-9', displayName: 'ふらん', xId: 'flan_t', participationType: 'cosplay', participationDate: '2026-08-15', comment: '', cosplayInfo: C('東方Project', 'フランドール', 'greeting_welcome'), createdAt: '2026-06-14T15:00:00Z' }),
  entry({ id: 'demo-en-75', eventId: 'demo-ev-9', displayName: 'かんうさん', xId: 'ganyu2_g', participationType: 'cosplay', participationDate: '2026-08-15', comment: '', cosplayInfo: C('原神', '甘雨', 'planned'), createdAt: '2026-06-16T10:30:00Z' }),
  entry({ id: 'demo-en-76', eventId: 'demo-ev-9', displayName: '赤レンガ撮影2', xId: 'renga_ph2', participationType: 'photographer', participationDate: '2026-08-15', comment: '', photographerInfo: { targetWorks: '何でも', availableHours: '13:00〜17:00', firstMeetStatus: 'ok', portfolioUrl: 'https://example.com/pf/renga', shootingStyles: ['strobe_ok', 'portrait'] }, createdAt: '2026-06-18T17:00:00Z' }),
  entry({ id: 'demo-en-77', eventId: 'demo-ev-9', displayName: 'ひな', xId: 'hina_ba', participationType: 'cosplay', participationDate: '2026-08-15', comment: '知り合いさんと。', cosplayInfo: C('ブルーアーカイブ', 'ヒナ', 'acquaintance_only'), createdAt: '2026-06-20T11:00:00Z' }),
  entry({ id: 'demo-en-78', eventId: 'demo-ev-9', displayName: 'あくあ', xId: 'aqua_oshi', participationType: 'cosplay', participationDate: '2026-08-15', comment: '', cosplayInfo: C('【推しの子】', '星野アクア', 'mutual_ok'), createdAt: '2026-06-21T20:00:00Z' }),
  entry({ id: 'demo-en-79', eventId: 'demo-ev-9', displayName: '横浜デート', xId: 'yokohama_x', participationType: 'general', participationDate: '2026-08-15', comment: '', createdAt: '2026-06-22T18:00:00Z' }),
  entry({ id: 'demo-en-80', eventId: 'demo-ev-9', displayName: 'あき', xId: 'aki_cm', participationType: 'cosplay', participationDate: '2026-08-15', comment: '', cosplayInfo: C('チェンソーマン', '早川アキ', 'greeting_welcome'), createdAt: '2026-06-23T09:00:00Z' }),

  // ===== demo-ev-10 名古屋城下町 =====
  entry({ id: 'demo-en-81', eventId: 'demo-ev-10', displayName: 'れみりあ', xId: 'remilia_t', participationType: 'cosplay', participationDate: '2026-08-22', comment: '', cosplayInfo: C('東方Project', 'レミリア', 'greeting_welcome'), createdAt: '2026-06-12T10:00:00Z' }),
  entry({ id: 'demo-en-82', eventId: 'demo-ev-10', displayName: 'たんじろう（和）', xId: 'tanjiro2', participationType: 'cosplay', participationDate: '2026-08-22', comment: '相互の方ぜひ。', cosplayInfo: C('鬼滅の刃', '竈門炭治郎', 'mutual_ok'), createdAt: '2026-06-14T13:00:00Z' }),
  entry({ id: 'demo-en-83', eventId: 'demo-ev-10', displayName: '城下町撮影', xId: 'joka_ph', participationType: 'photographer', participationDate: '2026-08-22', comment: '和装映えます。', photographerInfo: { targetWorks: '和風キャラ', availableHours: '10:00〜15:00', firstMeetStatus: 'ok', portfolioUrl: '', shootingStyles: ['natural_light'] }, createdAt: '2026-06-16T11:00:00Z' }),
  entry({ id: 'demo-en-84', eventId: 'demo-ev-10', displayName: 'らいでん', xId: 'raiden2_g', participationType: 'cosplay', participationDate: '2026-08-22', comment: '', cosplayInfo: C('原神', '雷電将軍', 'planned'), createdAt: '2026-06-18T19:00:00Z' }),
  entry({ id: 'demo-en-85', eventId: 'demo-ev-10', displayName: 'ごるしー', xId: 'gold_uma', participationType: 'cosplay', participationDate: '2026-08-22', comment: 'おはよウマ！', cosplayInfo: C('ウマ娘 プリティーダービー', 'ゴールドシップ', 'greeting_welcome'), createdAt: '2026-06-20T16:00:00Z' }),
  entry({ id: 'demo-en-86', eventId: 'demo-ev-10', displayName: '名古屋めし', xId: 'meshi_x', participationType: 'general', participationDate: '2026-08-22', comment: 'ご飯も楽しみ。', createdAt: '2026-06-22T12:30:00Z' }),

  // ===== demo-ev-11 大阪城公園 =====
  entry({ id: 'demo-en-25', eventId: 'demo-ev-11', displayName: 'ぴくにっく', xId: 'picnic_cos', participationType: 'general', participationDate: '2026-08-29', comment: 'のんびり交流したいです。', createdAt: '2026-06-24T10:10:00Z' }),
  entry({ id: 'demo-en-87', eventId: 'demo-ev-11', displayName: 'にこ', xId: 'nico_ll', participationType: 'cosplay', participationDate: '2026-08-29', comment: 'にっこにっこにー！', cosplayInfo: C('ラブライブ！', '矢澤にこ', 'greeting_welcome'), createdAt: '2026-06-13T11:00:00Z' }),
  entry({ id: 'demo-en-88', eventId: 'demo-ev-11', displayName: 'まき', xId: 'maki_jjk', participationType: 'cosplay', participationDate: '2026-08-29', comment: '', cosplayInfo: C('呪術廻戦', '禪院真希', 'mutual_ok'), createdAt: '2026-06-15T18:00:00Z' }),
  entry({ id: 'demo-en-89', eventId: 'demo-ev-11', displayName: '大阪城撮影', xId: 'osakajo_ph', participationType: 'photographer', participationDate: '2026-08-29', comment: '', photographerInfo: { targetWorks: '何でも', availableHours: '10:00〜16:00', firstMeetStatus: 'negotiable', portfolioUrl: '', shootingStyles: ['portrait', 'social'] }, createdAt: '2026-06-17T14:00:00Z' }),
  entry({ id: 'demo-en-90', eventId: 'demo-ev-11', displayName: 'なひーだ（草）', xId: 'nahida2_g', participationType: 'cosplay', participationDate: '2026-08-29', comment: '', cosplayInfo: C('原神', 'ナヒーダ', 'planned'), createdAt: '2026-06-20T13:00:00Z' }),
  entry({ id: 'demo-en-91', eventId: 'demo-ev-11', displayName: 'ピクニック参加?', xId: 'picnic_q', participationType: 'undecided', participationDate: '2026-08-29', comment: '天気次第で…', createdAt: '2026-06-22T09:30:00Z' }),

  // ===== demo-ev-12 幕張メッセ =====
  entry({ id: 'demo-en-18', eventId: 'demo-ev-12', displayName: 'アーニャ', xId: 'anya_sxf', participationType: 'cosplay', participationDate: '2026-09-05', comment: 'わくわく！', cosplayInfo: C('SPY×FAMILY', 'アーニャ・フォージャー', 'greeting_welcome'), createdAt: '2026-06-24T12:00:00Z' }),
  entry({ id: 'demo-en-19', eventId: 'demo-ev-12', displayName: 'ルビー', xId: 'oshinoko_ruby', participationType: 'cosplay', participationDate: '2026-09-05', comment: '', cosplayInfo: C('【推しの子】', '星野ルビー', 'mutual_ok'), createdAt: '2026-06-24T12:20:00Z' }),
  entry({ id: 'demo-en-20', eventId: 'demo-ev-12', displayName: '即売会カメラ', xId: 'event_cam', participationType: 'photographer', participationDate: '2026-09-05', comment: '', photographerInfo: { targetWorks: '何でも', availableHours: '終日', firstMeetStatus: 'ok', portfolioUrl: '', shootingStyles: ['strobe_ok', 'portrait'] }, createdAt: '2026-06-24T12:40:00Z' }),
  entry({ id: 'demo-en-92', eventId: 'demo-ev-12', displayName: 'べあこ', xId: 'beako_rezero', participationType: 'cosplay', participationDate: '2026-09-05', comment: '', cosplayInfo: C('Re:ゼロから始める異世界生活', 'ベアトリス', 'greeting_welcome'), createdAt: '2026-06-12T15:00:00Z' }),
  entry({ id: 'demo-en-93', eventId: 'demo-ev-12', displayName: 'すくな', xId: 'sukuna_jjk', participationType: 'cosplay', participationDate: '2026-09-05', comment: '知り合いさん中心で。', cosplayInfo: C('呪術廻戦', '宿儺', 'acquaintance_only'), createdAt: '2026-06-14T17:00:00Z' }),
  entry({ id: 'demo-en-94', eventId: 'demo-ev-12', displayName: 'ひなぼす', xId: 'hina2_ba', participationType: 'cosplay', participationDate: '2026-09-05', comment: '', cosplayInfo: C('ブルーアーカイブ', 'ヒナ', 'mutual_ok'), createdAt: '2026-06-16T13:00:00Z' }),
  entry({ id: 'demo-en-95', eventId: 'demo-ev-12', displayName: '幕張撮影', xId: 'makuhari_ph', participationType: 'photographer', participationDate: '2026-09-05', comment: '会場内撮影します。', photographerInfo: { targetWorks: '何でも', availableHours: '終日', firstMeetStatus: 'ok', portfolioUrl: 'https://example.com/pf/makuhari', shootingStyles: ['strobe_ok', 'portrait'] }, createdAt: '2026-06-18T10:00:00Z' }),
  entry({ id: 'demo-en-96', eventId: 'demo-ev-12', displayName: 'ぜんいつ（雷）', xId: 'zenitsu2', participationType: 'cosplay', participationDate: '2026-09-05', comment: '', cosplayInfo: C('鬼滅の刃', '我妻善逸', 'greeting_welcome'), createdAt: '2026-06-20T19:00:00Z' }),
  entry({ id: 'demo-en-97', eventId: 'demo-ev-12', displayName: 'かな（アイドル）', xId: 'kana2_oshi', participationType: 'cosplay', participationDate: '2026-09-05', comment: '', cosplayInfo: C('【推しの子】', '有馬かな', 'planned'), createdAt: '2026-06-21T18:00:00Z' }),
  entry({ id: 'demo-en-98', eventId: 'demo-ev-12', displayName: 'ナインエス', xId: 'nines_nier', participationType: 'cosplay', participationDate: '2026-09-05', comment: '相互ぜひ。', cosplayInfo: C('ニーア オートマタ', '9S', 'mutual_ok'), createdAt: '2026-06-22T20:00:00Z' }),
  entry({ id: 'demo-en-99', eventId: 'demo-ev-12', displayName: '即売会めぐり', xId: 'sokubai_x', participationType: 'general', participationDate: '2026-09-05', comment: 'お買い物メインです。', createdAt: '2026-06-23T10:00:00Z' }),
  entry({ id: 'demo-en-100', eventId: 'demo-ev-12', displayName: 'ほたる（往）', xId: 'hutao2_g', participationType: 'cosplay', participationDate: '2026-09-05', comment: '', cosplayInfo: C('原神', '胡桃', 'greeting_welcome'), createdAt: '2026-06-23T21:00:00Z' }),
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
