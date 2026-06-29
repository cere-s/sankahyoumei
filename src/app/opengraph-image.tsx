import { ImageResponse } from 'next/og';

// ビルド時のプリレンダーを避け、リクエスト時に生成する（実行時に外部フォントを取得）
export const dynamic = 'force-dynamic';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'コスいく';

const OLD_UA =
  'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0 Safari/537.36';

/** 表示テキストのサブセット Noto Sans JP(WOFF) を取得 */
async function loadJpFont(text: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`;
  const css = await fetch(url, { headers: { 'User-Agent': OLD_UA } }).then((r) => r.text());
  const m = css.match(/src:\s*url\((https:\/\/[^)]+)\)/);
  if (!m) throw new Error('font url not found');
  return fetch(m[1]).then((r) => r.arrayBuffer());
}

export default async function OpengraphImage() {
  const title = 'コスいく';
  const tagline = '好きでつながる、コスプレ参加表明サイト';
  const fontData = await loadJpFont(title + tagline);

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
          background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
          color: 'white',
          fontFamily: 'NotoSansJP',
        }}
      >
        <div style={{ fontSize: 132, fontWeight: 700, letterSpacing: 4 }}>{title}</div>
        <div style={{ fontSize: 36, marginTop: 12, opacity: 0.95 }}>{tagline}</div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'NotoSansJP', data: fontData, weight: 700, style: 'normal' }],
    }
  );
}
