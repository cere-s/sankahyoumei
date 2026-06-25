import { ImageResponse } from 'next/og';

// ビルド時のプリレンダーを避け、リクエスト時に生成する（実行時に外部フォントを取得）
export const dynamic = 'force-dynamic';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'コスプレ参加表明';

/** 実行時に Google Fonts(gstatic) から Inter 700 の TTF を取得 */
async function loadFont(): Promise<ArrayBuffer> {
  const css = await fetch('https://fonts.googleapis.com/css2?family=Inter:wght@700').then((r) => r.text());
  const url = css.match(/url\((https:\/\/[^)]+\.ttf)\)/)?.[1];
  if (!url) throw new Error('font url not found');
  return fetch(url).then((r) => r.arrayBuffer());
}

export default async function OpengraphImage() {
  const fontData = await loadFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
          color: 'white',
          fontFamily: 'Inter',
        }}
      >
        <div style={{ fontSize: 92, fontWeight: 700, letterSpacing: 1 }}>Cosplay Sankahyoumei</div>
        <div style={{ fontSize: 34, marginTop: 24, opacity: 0.92 }}>
          Find &amp; declare cosplay event participation
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Inter', data: fontData, weight: 700, style: 'normal' }],
    }
  );
}
