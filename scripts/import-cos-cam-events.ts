/**
 * cos-cam.work からコスプレイベント一覧を取得して Supabase の events テーブルへ upsert するスクリプト
 *
 * 使い方:
 *   npm run import:cos-cam -- --dry-run   # DBへ書き込まず確認のみ
 *   npm run import:cos-cam                # 実際に upsert
 *
 * 必要な環境変数 (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { load, type Cheerio } from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

// ---- 設定 ----
const SOURCE_SITE = 'cos-cam.work';
const LIST_URL = 'https://cos-cam.work/?page_id=154';
const BASE_URL = 'https://cos-cam.work/';
const FETCH_UA = 'Mozilla/5.0 (compatible; CosplayEntryBot/1.0)';
/** 詳細ページ間のウェイト（ms）。取得元サイトへの過剰アクセス防止 */
const DETAIL_FETCH_DELAY_MS = 1200;

const isDryRun = process.argv.includes('--dry-run');

// ---- 型定義 ----
interface ImportedEvent {
  name: string;
  date: string;
  location: string;
  officialUrl: string | null;
  hashtag: string;
  description: string;
  organizer: string | null;
  address: string | null;
  xUrl: string | null;
  sourceSite: string;
  sourceUrl: string;   // イベント詳細ページ URL
  externalId: string;
}

interface SkippedRow {
  reason: string;
  raw: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CheerioElem = Cheerio<any>;
type CheerioAPI = ReturnType<typeof load>;

// ---- ヘルパー ----

function createStableExternalId(date: string, name: string, location: string): string {
  const key = `${SOURCE_SITE}||${date}||${name}||${location}`;
  return `cos-cam-${date}-${createHash('sha256').update(key).digest('hex').slice(0, 16)}`;
}

function buildDate(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseLocationCell(rawText: string): { time: string | null; location: string } {
  const timeMatch = rawText.match(/\[([^\]]+)\]/);
  const time = timeMatch ? timeMatch[1].trim() : null;
  const loc = rawText.replace(/\[[^\]]*\]/g, '').replace(/^[＠@]\s*/, '').trim();
  return { time, location: loc };
}

function toAbsoluteUrl(href: string): string {
  if (!href) return '';
  try { return new URL(href, BASE_URL).toString(); } catch { return href; }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---- 詳細ページパーサー ----

interface DetailInfo {
  address: string | null;
  officialUrl: string | null;
  xUrl: string | null;
}

function parseDetailPage(html: string): DetailInfo {
  const $ = load(html) as CheerioAPI;
  const result: DetailInfo = { address: null, officialUrl: null, xUrl: null };

  $('table.tbl-r02 tr').each((_i, row) => {
    const th = $(row).find('th').text().trim();
    const td = $(row).find('td');
    const linkHref = td.find('a').attr('href') ?? null;
    const text = td.text().trim();

    if (th === '開催場所住所') {
      result.address = text || null;
    } else if (th === '公式サイト') {
      result.officialUrl = linkHref || text || null;
    } else if (th.includes('Twitter') || th.includes('X (')) {
      result.xUrl = linkHref || text || null;
    }
  });

  return result;
}

// ---- リストページパーサー ----

interface ListEvent {
  name: string;
  date: string;
  location: string;
  time: string | null;
  organizer: string | null;
  detailUrl: string;
  externalId: string;
}

function parseListPage(html: string): { events: ListEvent[]; skipped: SkippedRow[] } {
  const $ = load(html) as CheerioAPI;
  const events: ListEvent[] = [];
  const skipped: SkippedRow[] = [];

  const content = $('.entry-content');
  if (content.length === 0) {
    console.warn('⚠️  .entry-content が見つかりません。ページ構造が変わった可能性があります。');
  }

  let currentYear = 0;
  let currentMonth = 0;
  const container = content.length > 0 ? content : $('body');

  container.find('.bar, [style*="display:flex"][style*="border-bottom"]').each((_i, el) => {
    const $el = $(el);

    if ($el.hasClass('bar')) {
      const id = $el.attr('id') ?? '';
      const m = id.match(/^(\d{4})(\d{2})$/);
      if (m) {
        currentYear = +m[1];
        currentMonth = +m[2];
        console.log(`  📅 ${currentYear}年${currentMonth}月 を処理中...`);
      }
      return;
    }

    if (!currentYear) return;

    const pcText = $el.children('.pc').first().text().replace(/\s+/g, '');
    const dm = pcText.match(/(\d{1,2})\/(\d{1,2})/);
    if (!dm) {
      const spText = $el.children('.smartphone').first().text().replace(/\s+/g, '');
      const sdm = spText.match(/(\d{1,2})\/(\d{1,2})/);
      if (!sdm) {
        skipped.push({ reason: '日付が取得できません', raw: $el.text().slice(0, 60).trim() });
        return;
      }
      parseEventRow($, $el, currentYear, currentMonth, +sdm[2], events, skipped);
      return;
    }
    parseEventRow($, $el, currentYear, currentMonth, +dm[2], events, skipped);
  });

  return { events, skipped };
}

function parseEventRow(
  $: CheerioAPI,
  $el: CheerioElem,
  year: number,
  month: number,
  day: number,
  events: ListEvent[],
  skipped: SkippedRow[]
): void {
  const date = buildDate(year, month, day);
  if (!date) { skipped.push({ reason: '日付変換失敗', raw: `${year}-${month}-${day}` }); return; }

  const nameLink = $el.find('.responsive_d_a a');
  const name = nameLink.text().trim();
  if (!name) { skipped.push({ reason: 'イベント名が空', raw: $el.text().slice(0, 60).trim() }); return; }

  const href = nameLink.attr('href') ?? '';
  const detailUrl = toAbsoluteUrl(href);

  const locRaw = $el.find('.pc_110').text().trim();
  if (!locRaw) { skipped.push({ reason: '会場情報が空', raw: name }); return; }
  const { time, location } = parseLocationCell(locRaw);
  if (!location) { skipped.push({ reason: '会場名が空', raw: name }); return; }

  // 運営母体: .responsive_d_b の テキスト（img の alt は空なので text() で取れる）
  const organizer = $el.find('.responsive_d .responsive_d_b').text().trim() || null;

  events.push({
    name,
    date,
    location,
    time,
    organizer,
    detailUrl,
    externalId: createStableExternalId(date, name, location),
  });
}

// ---- Supabase upsert ----

async function upsertEvents(events: ImportedEvent[]): Promise<number> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL または SUPABASE_SERVICE_ROLE_KEY が未設定です');
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const rows = events.map((e) => ({
    name: e.name,
    date: e.date,
    location: e.location,
    official_url: e.officialUrl,
    hashtag: e.hashtag,
    description: e.description,
    organizer: e.organizer,
    address: e.address,
    x_url: e.xUrl,
    source_site: e.sourceSite,
    source_url: e.sourceUrl,
    external_id: e.externalId,
    imported_at: new Date().toISOString(),
    is_imported: true,
  }));

  let upserted = 0;
  const BATCH = 20;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from('events')
      .upsert(batch, { onConflict: 'source_site,external_id', ignoreDuplicates: false });
    if (error) { console.error(`❌ upsert エラー:`, error.message); throw error; }
    upserted += batch.length;
  }
  return upserted;
}

// ---- エントリーポイント ----

async function main(): Promise<void> {
  console.log('');
  console.log(`📥 コスプレイベントインポート開始 ${isDryRun ? '[DRY-RUN]' : ''}`);
  console.log(`   取得元: ${LIST_URL}`);
  console.log('');

  // 1. リストページ取得
  console.log(`Fetching list: ${LIST_URL}`);
  let listHtml: string;
  try {
    const res = await fetch(LIST_URL, {
      headers: { 'User-Agent': FETCH_UA },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    listHtml = await res.text();
    console.log(`  → ${listHtml.length.toLocaleString()} bytes`);
  } catch (err) {
    console.error('❌ リストページ取得失敗:', err);
    process.exit(1);
  }

  // 2. リストページ解析
  const { events: listEvents, skipped } = parseListPage(listHtml);
  console.log('');
  console.log(`List parse: ${listEvents.length} 件有効 / ${skipped.length} 件スキップ`);
  if (skipped.length > 0) {
    skipped.forEach((s) => console.log(`  ⚠️  ${s.reason}: "${s.raw}"`));
  }
  if (listEvents.length === 0) {
    console.error('⚠️  有効なイベントが0件です。セレクターを確認してください。');
    process.exit(1);
  }

  // 3. 詳細ページを順番に取得（レート制限: 1.2秒間隔）
  console.log('');
  console.log(`Fetching ${listEvents.length} detail pages (${DETAIL_FETCH_DELAY_MS}ms間隔)...`);
  const importedEvents: ImportedEvent[] = [];
  let detailFailed = 0;

  for (let i = 0; i < listEvents.length; i++) {
    const ev = listEvents[i];

    if (i > 0) await delay(DETAIL_FETCH_DELAY_MS);

    try {
      const res = await fetch(ev.detailUrl, {
        headers: { 'User-Agent': FETCH_UA },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const detail = parseDetailPage(html);

      const descParts: string[] = [];
      if (ev.time) descParts.push(`時間: ${ev.time}`);
      if (ev.organizer) descParts.push(`主催: ${ev.organizer}`);
      descParts.push(`取得元: ${SOURCE_SITE}`);

      importedEvents.push({
        name: ev.name,
        date: ev.date,
        location: ev.location,
        officialUrl: detail.officialUrl,
        hashtag: '',
        description: descParts.join(' / '),
        organizer: ev.organizer,
        address: detail.address,
        xUrl: detail.xUrl,
        sourceSite: SOURCE_SITE,
        sourceUrl: ev.detailUrl,
        externalId: ev.externalId,
      });

      process.stdout.write(`  [${i + 1}/${listEvents.length}] ✓ ${ev.name}\n`);
    } catch (err) {
      detailFailed++;
      console.warn(`  [${i + 1}/${listEvents.length}] ⚠️  詳細取得失敗: ${ev.name} (${err})`);
      // 詳細取得失敗でもリスト情報だけで登録
      importedEvents.push({
        name: ev.name,
        date: ev.date,
        location: ev.location,
        officialUrl: ev.detailUrl,
        hashtag: '',
        description: ev.time ? `時間: ${ev.time} / 取得元: ${SOURCE_SITE}` : `取得元: ${SOURCE_SITE}`,
        organizer: ev.organizer,
        address: null,
        xUrl: null,
        sourceSite: SOURCE_SITE,
        sourceUrl: ev.detailUrl,
        externalId: ev.externalId,
      });
    }
  }

  console.log('');
  console.log(`Detail fetch: 成功 ${importedEvents.length - detailFailed} / 失敗 ${detailFailed}`);

  // 4. dry-run プレビュー
  if (isDryRun) {
    console.log('');
    console.log('--- DRY-RUN プレビュー（先頭5件）---');
    importedEvents.slice(0, 5).forEach((e, i) => {
      console.log(`[${i + 1}] ${e.date}  ${e.name}`);
      console.log(`     主催: ${e.organizer ?? '不明'}`);
      console.log(`     場所: ${e.location}`);
      console.log(`     住所: ${e.address ?? '未取得'}`);
      console.log(`     公式: ${e.officialUrl ?? '未設定'}`);
      console.log(`     X   : ${e.xUrl ?? '未設定'}`);
      console.log(`     詳細: ${e.sourceUrl}`);
    });
    console.log('');
    console.log('✅ DRY-RUN 完了。DBへの書き込みはしていません。');
    return;
  }

  // 5. Supabase upsert
  console.log('');
  console.log(`Upserting ${importedEvents.length} events...`);
  try {
    const n = await upsertEvents(importedEvents);
    console.log(`Upserted: ${n} 件`);
  } catch (err) {
    console.error('❌ upsert 失敗:', err);
    process.exit(1);
  }

  console.log('');
  console.log('✅ インポート完了');
}

main().catch((err) => {
  console.error('予期しないエラー:', err);
  process.exit(1);
});
