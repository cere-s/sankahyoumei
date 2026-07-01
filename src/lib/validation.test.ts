import { describe, it, expect } from 'vitest';
import {
  clampText,
  safeHttpUrl,
  safeXUrl,
  asTimeBand,
  asGreetingLevel,
  asShootingPolicy,
  sanitizeCosplayPlans,
  sanitizeShootingTargets,
  sanitizePhotographerInfo,
  LIMITS,
} from './validation';
import type { CosplayPlan, ShootingTarget, PhotographerInfo } from '@/types';

describe('clampText', () => {
  it('空白だけなら undefined を返す', () => {
    expect(clampText('   ', 10)).toBeUndefined();
    expect(clampText('', 10)).toBeUndefined();
  });

  it('文字列以外は undefined を返す', () => {
    expect(clampText(123, 10)).toBeUndefined();
    expect(clampText(null, 10)).toBeUndefined();
  });

  it('前後の空白を除去する', () => {
    expect(clampText('  hi  ', 10)).toBe('hi');
  });

  it('上限を超える長文は指定上限で切る', () => {
    const long = 'a'.repeat(50);
    expect(clampText(long, 10)).toBe('a'.repeat(10));
  });
});

describe('safeHttpUrl', () => {
  it('http / https を通す', () => {
    expect(safeHttpUrl('https://example.com/')).toBe('https://example.com/');
    expect(safeHttpUrl('http://example.com/')).toBe('http://example.com/');
  });

  it('javascript: / data: スキームを弾く', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl('data:text/html,hi')).toBeNull();
  });

  it('不正なURL・空文字を弾く', () => {
    expect(safeHttpUrl('not a url')).toBeNull();
    expect(safeHttpUrl('   ')).toBeNull();
    expect(safeHttpUrl(123)).toBeNull();
  });

  it('長すぎるURLを弾く', () => {
    const long = 'https://example.com/' + 'a'.repeat(LIMITS.url);
    expect(safeHttpUrl(long)).toBeNull();
  });

  it('hostAllowlist でホストを限定できる', () => {
    expect(safeHttpUrl('https://evil.com/', { hostAllowlist: ['example.com'] })).toBeNull();
    expect(safeHttpUrl('https://www.example.com/', { hostAllowlist: ['example.com'] })).toBe(
      'https://www.example.com/'
    );
  });
});

describe('safeXUrl', () => {
  it('x.com / twitter.com のみ通す', () => {
    expect(safeXUrl('https://x.com/foo')).toBe('https://x.com/foo');
    expect(safeXUrl('https://twitter.com/foo')).toBe('https://twitter.com/foo');
  });

  it('それ以外の host を弾く', () => {
    expect(safeXUrl('https://example.com/foo')).toBeNull();
    expect(safeXUrl('https://fake-x.com/foo')).toBeNull();
  });
});

describe('enum 変換', () => {
  it('正しい値はそのまま、不正値は undefined', () => {
    expect(asTimeBand('morning')).toBe('morning');
    expect(asTimeBand('invalid')).toBeUndefined();
    expect(asGreetingLevel('welcome')).toBe('welcome');
    expect(asGreetingLevel('nope')).toBeUndefined();
    expect(asShootingPolicy('ok')).toBe('ok');
    expect(asShootingPolicy(42)).toBeUndefined();
  });
});

describe('sanitizeCosplayPlans', () => {
  it('件数上限（LIMITS.plans）を超えたら切り捨てる', () => {
    const many: CosplayPlan[] = Array.from({ length: LIMITS.plans + 5 }, (_, i) => ({
      workTitle: `work${i}`,
      characterName: `char${i}`,
    }));
    expect(sanitizeCosplayPlans(many)).toHaveLength(LIMITS.plans);
  });

  it('文字数上限で切り詰め、不正な imageUrl は落とす', () => {
    const plans: CosplayPlan[] = [
      {
        workTitle: 'a'.repeat(LIMITS.workTitle + 10),
        characterName: 'b'.repeat(LIMITS.characterName + 10),
        imageUrl: 'javascript:alert(1)',
      },
    ];
    const out = sanitizeCosplayPlans(plans)!;
    expect(out[0].workTitle).toHaveLength(LIMITS.workTitle);
    expect(out[0].characterName).toHaveLength(LIMITS.characterName);
    expect(out[0].imageUrl).toBeUndefined();
  });

  it('安全な imageUrl は残す', () => {
    const out = sanitizeCosplayPlans([{ workTitle: 'w', characterName: 'c', imageUrl: 'https://example.com/a.png' }])!;
    expect(out[0].imageUrl).toBe('https://example.com/a.png');
  });

  it('配列でなければ undefined', () => {
    expect(sanitizeCosplayPlans(undefined)).toBeUndefined();
  });
});

describe('sanitizeShootingTargets', () => {
  it('件数上限（LIMITS.targets）を超えたら切り捨てる', () => {
    const many: ShootingTarget[] = Array.from({ length: LIMITS.targets + 5 }, (_, i) => ({
      workTitle: `work${i}`,
    }));
    expect(sanitizeShootingTargets(many)).toHaveLength(LIMITS.targets);
  });

  it('文字数上限で切り詰める', () => {
    const out = sanitizeShootingTargets([
      { workTitle: 'a'.repeat(LIMITS.workTitle + 10), memo: 'm'.repeat(LIMITS.memo + 10) },
    ])!;
    expect(out[0].workTitle).toHaveLength(LIMITS.workTitle);
    expect(out[0].memo).toHaveLength(LIMITS.memo);
  });
});

describe('sanitizePhotographerInfo', () => {
  it('不正なポートフォリオURLは空文字に落とす', () => {
    const info = { portfolioUrl: 'javascript:alert(1)' } as PhotographerInfo;
    expect(sanitizePhotographerInfo(info)!.portfolioUrl).toBe('');
  });

  it('不正な撮影スタイルを落とし、正しいものだけ残す', () => {
    const info = {
      targetWorks: '',
      availableHours: '',
      firstMeetStatus: 'negotiable',
      portfolioUrl: '',
      shootingStyles: ['portrait', 'not_a_style'],
    } as unknown as PhotographerInfo;
    expect(sanitizePhotographerInfo(info)!.shootingStyles).toEqual(['portrait']);
  });

  it('不正な firstMeetStatus は negotiable に既定化する', () => {
    const info = { firstMeetStatus: 'bogus' } as unknown as PhotographerInfo;
    expect(sanitizePhotographerInfo(info)!.firstMeetStatus).toBe('negotiable');
  });
});
