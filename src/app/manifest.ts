import type { MetadataRoute } from 'next';
import { DEMO } from '@/lib/demo';

const name = DEMO ? 'コスいく（デモ版）' : 'コスいく';
const description = '好きでつながる、コスプレ参加表明サイト。誰がどの作品・キャラで来るかが一覧でわかります。';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name,
    short_name: 'コスいく',
    description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ec4899',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
