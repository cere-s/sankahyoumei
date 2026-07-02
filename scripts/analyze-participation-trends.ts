/**
 * 参加表明の作品・キャラ傾向を Supabase から読み取り専用で集計するスクリプト。
 *
 * 使い方:
 *   npm run analyze:participation
 *   npm run analyze:participation -- --format=json
 *   npm run analyze:participation -- --out=docs/participation-trends.md
 *
 * 必要な環境変数 (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY または NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 */

import { writeFile } from 'fs/promises';
import { createClient } from '@supabase/supabase-js';

type ParticipationType = 'cosplay' | 'photographer' | 'general' | 'undecided' | string;
const ENTRY_SELECT =
  'id,event_id,participation_type,work_name,character_name,cosplay_plans,photographer_target_works,shooting_targets,is_hidden';

interface EventRow {
  id: string;
  name: string;
  date: string;
  location: string;
  status: string;
}

interface EntryRow {
  id: string;
  event_id: string;
  participation_type: ParticipationType;
  work_name: string | null;
  character_name: string | null;
  cosplay_plans: unknown;
  photographer_target_works: string | null;
  shooting_targets: unknown;
  is_hidden: boolean;
}

interface WorkCharacter {
  work: string;
  character: string;
}

interface RankedItem {
  name: string;
  count: number;
}

interface RepeatedWork {
  work: string;
  eventCount: number;
  events: string[];
}

interface LeadingWorkByMonth {
  name: string;
  count: number;
  months: Record<string, number>;
}

interface AnalysisResult {
  generatedAt: string;
  totalEntries: number;
  byType: Record<string, number>;
  cosplay: {
    entries: number;
    plans: number;
    avgPlansPerCosplayEntry: number;
    entriesWithoutPlan: number;
    multiPlanEntries: number;
    topWorks: RankedItem[];
    topCharacters: RankedItem[];
    topPairs: RankedItem[];
    topMonths: RankedItem[];
    topEvents: RankedItem[];
    leadingWorksByMonth: LeadingWorkByMonth[];
    worksAppearingInMultipleEvents: RepeatedWork[];
  };
  photographerTargets: {
    targetRows: number;
    topWorks: RankedItem[];
    topCharacters: RankedItem[];
  };
}

const formatArg = process.argv.find((arg) => arg.startsWith('--format='));
const outputFormat = formatArg?.split('=')[1] === 'json' ? 'json' : 'markdown';
const outArg = process.argv.find((arg) => arg.startsWith('--out='));
const outPath = outArg?.split('=')[1];

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`環境変数 ${key} が未設定です`);
  return value;
}

function publicKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  );
}

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\s　]+/g, ' ')
    .trim();
}

function normalizeWork(value: unknown): string {
  const work = normalizeText(value);

  if (!work) return '';
  if (['🌈🕒', '2434'].includes(work)) return 'にじさんじ';
  if (/^SAKAMOTO\s*DAYS$/i.test(work) || work === 'SAKAMOTODAYS') return 'SAKAMOTO DAYS';
  if (/^DEATH\s*NOTE$/i.test(work) || work === 'DEATHNOTE') return 'DEATH NOTE';
  if (work === '崩壊:スターレイル') return '崩壊スターレイル';
  if (['東リべ', '東京リベンジャーズ'].includes(work)) return '東京卍リベンジャーズ';

  return work;
}

function increment(map: Map<string, number>, key: string, amount = 1): void {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + amount);
}

function top(map: Map<string, number>, limit: number): RankedItem[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja'))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function mapToRecord(map: Map<string, number>): Record<string, number> {
  return Object.fromEntries([...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'ja')));
}

function parseObjectArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
}

function parseCosplayPlans(row: EntryRow): WorkCharacter[] {
  const plans = parseObjectArray(row.cosplay_plans)
    .map((plan) => ({
      work: normalizeWork(plan.workTitle),
      character: normalizeText(plan.characterName),
    }))
    .filter((plan) => plan.work || plan.character);

  if (plans.length > 0) return plans;

  const work = normalizeWork(row.work_name);
  const character = normalizeText(row.character_name);
  return work || character ? [{ work, character }] : [];
}

function parseShootingTargets(row: EntryRow): WorkCharacter[] {
  const targets = parseObjectArray(row.shooting_targets)
    .map((target) => ({
      work: normalizeWork(target.workTitle),
      character: normalizeText(target.characterName),
    }))
    .filter((target) => target.work || target.character);

  if (targets.length > 0) return targets;

  const work = normalizeWork(row.photographer_target_works);
  return work ? [{ work, character: '' }] : [];
}

async function fetchAllRows<T>(
  queryFactory: (rangeFrom: number, rangeTo: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await queryFactory(from, to);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function analyze(): Promise<AnalysisResult> {
  const supabase = createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), publicKey(), {
    auth: { persistSession: false },
  });

  const events = await fetchAllRows<EventRow>((from, to) =>
    supabase.from('events').select('id,name,date,location,status').range(from, to)
  );
  const entries = await fetchAllRows<EntryRow>((from, to) =>
    supabase
      .from('participation_entries')
      .select(ENTRY_SELECT)
      .eq('is_hidden', false)
      .range(from, to)
  );

  const eventsById = new Map(events.map((event) => [event.id, event]));
  const byType = new Map<string, number>();
  const cosplayWorks = new Map<string, number>();
  const cosplayCharacters = new Map<string, number>();
  const cosplayPairs = new Map<string, number>();
  const monthPlans = new Map<string, number>();
  const eventPlans = new Map<string, number>();
  const workEvents = new Map<string, Set<string>>();
  const workMonths = new Map<string, Map<string, number>>();
  const targetWorks = new Map<string, number>();
  const targetCharacters = new Map<string, number>();

  let cosplayEntries = 0;
  let cosplayPlanCount = 0;
  let entriesWithoutPlan = 0;
  let multiPlanEntries = 0;
  let photographerTargetRows = 0;

  for (const entry of entries) {
    increment(byType, entry.participation_type || 'unknown');

    if (entry.participation_type === 'cosplay') {
      cosplayEntries++;
      const plans = parseCosplayPlans(entry);

      if (plans.length === 0) entriesWithoutPlan++;
      if (plans.length > 1) multiPlanEntries++;

      for (const plan of plans) {
        cosplayPlanCount++;
        increment(cosplayWorks, plan.work);
        increment(cosplayCharacters, plan.character);

        if (plan.work || plan.character) {
          increment(cosplayPairs, `${plan.work || '(作品未入力)'} / ${plan.character || '(キャラ未入力)'}`);
        }

        const event = eventsById.get(entry.event_id);
        const month = event?.date ? event.date.slice(0, 7) : 'date_unknown';
        increment(monthPlans, month);

        if (plan.work) {
          if (!workMonths.has(plan.work)) workMonths.set(plan.work, new Map());
          increment(workMonths.get(plan.work)!, month);
        }

        if (event) {
          increment(eventPlans, `${event.date} ${event.name}`);
          if (plan.work) {
            if (!workEvents.has(plan.work)) workEvents.set(plan.work, new Set());
            workEvents.get(plan.work)!.add(event.name);
          }
        }
      }
    }

    if (entry.participation_type === 'photographer') {
      for (const target of parseShootingTargets(entry)) {
        photographerTargetRows++;
        increment(targetWorks, target.work);
        increment(targetCharacters, target.character);
      }
    }
  }

  const repeatedWorks = [...workEvents.entries()]
    .map(([work, eventSet]) => ({
      work,
      eventCount: eventSet.size,
      events: [...eventSet].slice(0, 5),
    }))
    .filter((item) => item.eventCount >= 2)
    .sort((a, b) => b.eventCount - a.eventCount || a.work.localeCompare(b.work, 'ja'))
    .slice(0, 15);

  const leadingWorksByMonth = top(cosplayWorks, 10).map((item) => ({
    name: item.name,
    count: item.count,
    months: mapToRecord(workMonths.get(item.name) ?? new Map()),
  }));

  return {
    generatedAt: new Date().toISOString(),
    totalEntries: entries.length,
    byType: mapToRecord(byType),
    cosplay: {
      entries: cosplayEntries,
      plans: cosplayPlanCount,
      avgPlansPerCosplayEntry:
        cosplayEntries > 0 ? Number((cosplayPlanCount / cosplayEntries).toFixed(2)) : 0,
      entriesWithoutPlan,
      multiPlanEntries,
      topWorks: top(cosplayWorks, 25),
      topCharacters: top(cosplayCharacters, 25),
      topPairs: top(cosplayPairs, 25),
      topMonths: top(monthPlans, 20),
      topEvents: top(eventPlans, 20),
      leadingWorksByMonth,
      worksAppearingInMultipleEvents: repeatedWorks,
    },
    photographerTargets: {
      targetRows: photographerTargetRows,
      topWorks: top(targetWorks, 20),
      topCharacters: top(targetCharacters, 20),
    },
  };
}

function renderTable(items: RankedItem[], headers: [string, string] = ['項目', '件数']): string {
  if (items.length === 0) return '_該当なし_';
  return [
    `| ${headers[0]} | ${headers[1]} |`,
    '| --- | ---: |',
    ...items.map((item) => `| ${item.name.replaceAll('|', '\\|')} | ${item.count} |`),
  ].join('\n');
}

function renderMarkdown(result: AnalysisResult): string {
  const totalPlans = result.cosplay.plans || 1;
  const topWork = result.cosplay.topWorks[0];
  const topWorkShare = topWork ? ((topWork.count / totalPlans) * 100).toFixed(1) : '0.0';

  return `# 参加表明 作品・キャラ傾向分析

生成日時: ${result.generatedAt}

## サマリー

- 公開参加表明: ${result.totalEntries}件
- コスプレ参加: ${result.cosplay.entries}件
- コスプレ予定: ${result.cosplay.plans}件
- 1人あたり予定数: ${result.cosplay.avgPlansPerCosplayEntry}
- 複数予定の参加表明: ${result.cosplay.multiPlanEntries}件
- カメラマン撮影希望入力: ${result.photographerTargets.targetRows}件

## 参加種別

${renderTable(
  Object.entries(result.byType).map(([name, count]) => ({ name, count })),
  ['種別', '件数']
)}

## 作品ランキング

${renderTable(result.cosplay.topWorks, ['作品', '件数'])}

## キャラランキング

${renderTable(result.cosplay.topCharacters, ['キャラ', '件数'])}

## 作品 x キャラ

${renderTable(result.cosplay.topPairs, ['作品 / キャラ', '件数'])}

## イベント別コスプレ予定数

${renderTable(result.cosplay.topEvents, ['イベント', '件数'])}

## 月別コスプレ予定数

${renderTable(result.cosplay.topMonths, ['月', '件数'])}

## 上位作品の月別内訳

| 作品 | 合計 | 月別 |
| --- | ---: | --- |
${result.cosplay.leadingWorksByMonth
  .map((item) => {
    const months = Object.entries(item.months)
      .map(([month, count]) => `${month}: ${count}`)
      .join(', ');
    return `| ${item.name.replaceAll('|', '\\|')} | ${item.count} | ${months} |`;
  })
  .join('\n')}

## 複数イベントに出ている作品

| 作品 | イベント数 | イベント例 |
| --- | ---: | --- |
${result.cosplay.worksAppearingInMultipleEvents
  .map((item) => `| ${item.work.replaceAll('|', '\\|')} | ${item.eventCount} | ${item.events.join(', ')} |`)
  .join('\n')}

## カメラマン撮影希望作品

${renderTable(result.photographerTargets.topWorks, ['作品', '件数'])}

## 見立て

- ${topWork ? `${topWork.name} が ${topWork.count}件で最上位です。コスプレ予定全体の ${topWorkShare}% を占めます。` : '作品入力はまだ少ない状態です。'}
- キャラ単位の最大値は ${result.cosplay.topCharacters[0]?.count ?? 0}件で、作品ランキングよりも分散しています。
- 上位イベントへの入力集中が強いため、現時点の傾向はイベント構成の影響を大きく受けています。
- 作品名の入力ゆれは一部だけ正規化しています。分析用途を強めるなら、作品別の別名辞書を継続的に増やすのが有効です。
`;
}

async function main(): Promise<void> {
  const result = await analyze();
  const output = outputFormat === 'json' ? `${JSON.stringify(result, null, 2)}\n` : renderMarkdown(result);

  if (outPath) {
    await writeFile(outPath, output);
    console.log(`分析結果を書き出しました: ${outPath}`);
    return;
  }

  console.log(output);
}

main().catch((error) => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});
