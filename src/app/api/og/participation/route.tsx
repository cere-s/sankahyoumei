import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { getEntryById } from '@/lib/entries';
import { getEventById } from '@/lib/events';
import {
  formatDate,
  PARTICIPATION_TYPE_LABELS,
  COSPLAY_SHOOTING_STATUS_LABELS,
} from '@/lib/utils';

const W = 1200;
const H = 630;
const OLD_UA =
  'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0 Safari/537.36';

// 生成画像をCDNに強くキャッシュさせる（URLの v={updatedAt} で更新時に自動バスト）
const IMAGE_HEADERS = { 'cache-control': 'public, max-age=86400, s-maxage=604800, immutable' };

// ウォームインスタンスでのフォント再取得を避ける簡易キャッシュ
const fontCache = new Map<string, ArrayBuffer>();

/** 表示テキストだけを含むサブセットの Noto Sans JP（WOFF）を取得 */
async function loadJpFont(text: string): Promise<ArrayBuffer> {
  const cached = fontCache.get(text);
  if (cached) return cached;
  const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`;
  const css = await fetch(url, { headers: { 'User-Agent': OLD_UA } }).then((r) => r.text());
  const m = css.match(/src:\s*url\((https:\/\/[^)]+)\)/);
  if (!m) throw new Error('font url not found');
  const data = await fetch(m[1]).then((r) => r.arrayBuffer());
  if (fontCache.size > 50) fontCache.clear();
  fontCache.set(text, data);
  return data;
}

const TYPE_TAG: Record<string, { bg: string; fg: string }> = {
  cosplay: { bg: '#fce7f3', fg: '#9d174d' },
  photographer: { bg: '#dbeafe', fg: '#1e40af' },
  general: { bg: '#dcfce7', fg: '#166534' },
  undecided: { bg: '#f3f4f6', fg: '#4b5563' },
};

function clip(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  const entry = id ? await getEntryById(id) : null;
  const event = entry ? await getEventById(entry.eventId) : null;

  const service = 'コスプレ参加表明';
  const siteText = 'sankahyoumei.vercel.app';

  // ---- フォールバック（参加表明が見つからない場合もOGPは必ず生成）----
  if (!entry) {
    const text = `${service}${siteText}イベント前に誰が来るか見える参加表明`;
    const font = await loadJpFont(text);
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#7c3aed,#38bdf8)', color: '#fff', fontFamily: 'NotoSansJP' }}>
          <div style={{ display: 'flex', fontSize: 64 }}>{service}</div>
          <div style={{ display: 'flex', fontSize: 28, marginTop: 16, opacity: 0.92 }}>イベント前に、誰が来るか見える。</div>
        </div>
      ),
      { width: W, height: H, fonts: [{ name: 'NotoSansJP', data: font, weight: 700, style: 'normal' }], headers: IMAGE_HEADERS }
    );
  }

  const eventName = clip(event?.name ?? 'コスプレイベント', 36);
  const dateStr = event ? formatDate(event.date) : '';
  const displayName = clip(entry.displayName, 18);
  const xId = `@${entry.xId}`;
  const typeLabel = PARTICIPATION_TYPE_LABELS[entry.participationType];
  const typeColor = TYPE_TAG[entry.participationType] ?? TYPE_TAG.undecided;

  const work = entry.cosplayInfo ? clip(entry.cosplayInfo.workName, 24) : '';
  const character = entry.cosplayInfo ? clip(entry.cosplayInfo.characterName, 20) : '';
  const statusLabel = entry.cosplayInfo ? COSPLAY_SHOOTING_STATUS_LABELS[entry.cosplayInfo.shootingStatus] : '';
  const targetWorks = entry.photographerInfo ? clip(entry.photographerInfo.targetWorks, 28) : '';

  // 画像に出る全テキストを集めてフォントサブセット
  const allText =
    service + siteText + eventName + dateStr + displayName + xId + typeLabel + work + character + statusLabel + targetWorks +
    '作品キャラ撮りたい作品開催日参加表明イベント前に誰が来るか見える。';
  const font = await loadJpFont(allText);

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#ffffff', fontFamily: 'NotoSansJP' }}>
        {/* 左：テキスト */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '670px', height: '100%', padding: '52px 44px' }}>
          <div style={{ display: 'flex' }}>
            <div style={{ display: 'flex', background: '#7c3aed', color: '#fff', fontSize: 22, padding: '7px 18px', borderRadius: 999 }}>{service}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 28, color: '#7c3aed', marginBottom: 6 }}>{eventName}</div>
            {dateStr ? <div style={{ display: 'flex', fontSize: 22, color: '#9ca3af', marginBottom: 18 }}>{dateStr}</div> : null}

            <div style={{ display: 'flex', fontSize: 52, color: '#111827' }}>{displayName}</div>
            <div style={{ display: 'flex', fontSize: 24, color: '#9ca3af', marginTop: 4 }}>{xId}</div>

            <div style={{ display: 'flex', marginTop: 18 }}>
              <div style={{ display: 'flex', background: typeColor.bg, color: typeColor.fg, fontSize: 22, padding: '6px 16px', borderRadius: 999, marginRight: 10 }}>{typeLabel}</div>
              {statusLabel ? <div style={{ display: 'flex', background: '#ede9fe', color: '#6d28d9', fontSize: 22, padding: '6px 16px', borderRadius: 999 }}>{statusLabel}</div> : null}
            </div>

            {entry.cosplayInfo ? (
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: 18 }}>
                <div style={{ display: 'flex', fontSize: 26, color: '#374151' }}>作品：{work}</div>
                <div style={{ display: 'flex', fontSize: 26, color: '#374151', marginTop: 6 }}>キャラ：{character}</div>
              </div>
            ) : null}
            {entry.photographerInfo && targetWorks ? (
              <div style={{ display: 'flex', fontSize: 26, color: '#374151', marginTop: 18 }}>撮りたい作品：{targetWorks}</div>
            ) : null}
          </div>

          <div style={{ display: 'flex', fontSize: 22, color: '#c4b5fd' }}>{siteText}</div>
        </div>

        {/* 右：画像 or テンプレート */}
        <div style={{ display: 'flex', width: '530px', height: '100%', padding: '36px 36px 36px 0' }}>
          {entry.imageUrl ? (
            <div style={{ display: 'flex', width: '100%', height: '100%', borderRadius: 28, overflow: 'hidden', background: '#f3f4f6' }}>
              {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
              <img src={entry.imageUrl} alt="" width={494} height={558} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', borderRadius: 28, background: 'linear-gradient(135deg,#ede9fe,#cffafe)' }}>
              <div style={{ display: 'flex', fontSize: 44, color: '#7c3aed' }}>参加表明</div>
              <div style={{ display: 'flex', fontSize: 22, color: '#6d28d9', marginTop: 14, padding: '0 24px', textAlign: 'center' }}>イベント前に、誰が来るか見える。</div>
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [{ name: 'NotoSansJP', data: font, weight: 700, style: 'normal' }],
      headers: IMAGE_HEADERS,
    }
  );
}
