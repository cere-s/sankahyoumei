import { describe, it, expect } from 'vitest';
import { dbToEntry, type DBEntry } from './mapper';

/** 必須項目を埋めた最小のDB行。各テストで必要な列だけ上書きする。 */
function makeRow(overrides: Partial<DBEntry> = {}): DBEntry {
  return {
    id: 'e1',
    event_id: 'ev1',
    display_name: 'なまえ',
    x_id: 'xid',
    participation_type: 'general',
    participation_day: '2026-07-01',
    work_name: null,
    character_name: null,
    shooting_status: null,
    cosplay_plans: null,
    photographer_target_works: null,
    photographer_available_time: null,
    photographer_availability: null,
    portfolio_url: null,
    shooting_style: null,
    shooting_targets: null,
    time_band: null,
    greeting_level: null,
    shooting_policy: null,
    liked_works: null,
    want_works: null,
    image_url: null,
    image_key: null,
    image_alt: null,
    image_width: null,
    image_height: null,
    image_updated_at: null,
    og_image_url: null,
    og_image_key: null,
    tweet_url: null,
    comment: null,
    note: null,
    edit_token_hash: null,
    delete_password_hash: null,
    user_id: null,
    x_user_id: null,
    x_username_snapshot: null,
    auth_status: null,
    is_verified_x: false,
    is_hidden: false,
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-02T00:00:00Z',
    ...overrides,
  };
}

describe('dbToEntry: cosplay', () => {
  it('cosplay_plans があれば cosplayPlans と cosplayInfo に反映される', () => {
    const entry = dbToEntry(
      makeRow({
        participation_type: 'cosplay',
        shooting_status: 'mutual_ok',
        cosplay_plans: [
          { workTitle: '作品A', characterName: 'キャラA' },
          { workTitle: '作品B', characterName: 'キャラB' },
        ],
      })
    );
    expect(entry.cosplayPlans).toHaveLength(2);
    expect(entry.cosplayPlans![1].workTitle).toBe('作品B');
    // cosplayInfo は1件目 + shooting_status
    expect(entry.cosplayInfo).toEqual({
      workName: '作品A',
      characterName: 'キャラA',
      shootingStatus: 'mutual_ok',
    });
  });

  it('cosplay_plans が空で work_name/character_name があれば旧形式から1件復元する', () => {
    const entry = dbToEntry(
      makeRow({
        participation_type: 'cosplay',
        cosplay_plans: null,
        work_name: '旧作品',
        character_name: '旧キャラ',
      })
    );
    expect(entry.cosplayPlans).toEqual([{ workTitle: '旧作品', characterName: '旧キャラ' }]);
    expect(entry.cosplayInfo!.workName).toBe('旧作品');
  });

  it('shooting_status が null なら greeting_welcome を既定にする', () => {
    const entry = dbToEntry(
      makeRow({ participation_type: 'cosplay', work_name: 'w', shooting_status: null })
    );
    expect(entry.cosplayInfo!.shootingStatus).toBe('greeting_welcome');
  });
});

describe('dbToEntry: photographer', () => {
  it('shooting_targets があれば shootingTargets と photographerInfo に反映される', () => {
    const entry = dbToEntry(
      makeRow({
        participation_type: 'photographer',
        photographer_target_works: '撮りたい作品',
        photographer_available_time: '10-17',
        photographer_availability: 'ok',
        portfolio_url: 'https://example.com/p',
        shooting_style: ['portrait'],
        shooting_targets: [{ workTitle: '作品X', characterName: 'キャラX' }],
      })
    );
    expect(entry.shootingTargets).toEqual([{ workTitle: '作品X', characterName: 'キャラX' }]);
    expect(entry.photographerInfo).toEqual({
      targetWorks: '撮りたい作品',
      availableHours: '10-17',
      firstMeetStatus: 'ok',
      portfolioUrl: 'https://example.com/p',
      shootingStyles: ['portrait'],
    });
  });

  it('作品名が空でキャラ名だけの shooting_targets も保持される（作品名は任意）', () => {
    const entry = dbToEntry(
      makeRow({
        participation_type: 'photographer',
        shooting_targets: [
          { workTitle: '', characterName: 'キャラのみ' },
          { workTitle: '', characterName: '' },
        ],
      })
    );
    expect(entry.shootingTargets).toEqual([{ workTitle: '', characterName: 'キャラのみ' }]);
  });

  it('shooting_targets が空で photographer_target_works があれば旧形式から復元する', () => {
    const entry = dbToEntry(
      makeRow({
        participation_type: 'photographer',
        shooting_targets: null,
        photographer_target_works: '旧撮影対象',
      })
    );
    expect(entry.shootingTargets).toEqual([{ workTitle: '旧撮影対象' }]);
  });

  it('photographer_availability が null なら negotiable を既定にする', () => {
    const entry = dbToEntry(
      makeRow({ participation_type: 'photographer', photographer_availability: null })
    );
    expect(entry.photographerInfo!.firstMeetStatus).toBe('negotiable');
    expect(entry.photographerInfo!.shootingStyles).toEqual([]);
  });
});

describe('dbToEntry: null の正規化と既定値', () => {
  it('null を undefined / 空文字 / 既定値に変換する', () => {
    const entry = dbToEntry(makeRow());
    // comment は空文字、その他 optional は undefined
    expect(entry.comment).toBe('');
    expect(entry.note).toBeUndefined();
    expect(entry.imageUrl).toBeUndefined();
    expect(entry.userId).toBeUndefined();
    expect(entry.timeBand).toBeUndefined();
    expect(entry.likedWorks).toBeUndefined();
    // general は cosplay/photographer 情報を持たない
    expect(entry.cosplayInfo).toBeUndefined();
    expect(entry.photographerInfo).toBeUndefined();
  });

  it('auth_status が null なら unverified を既定にする', () => {
    expect(dbToEntry(makeRow({ auth_status: null })).authStatus).toBe('unverified');
    expect(dbToEntry(makeRow({ auth_status: 'verified_x' })).authStatus).toBe('verified_x');
  });
});
