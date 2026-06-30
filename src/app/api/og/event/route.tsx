import type { NextRequest } from 'next/server';
import { getEventById } from '@/lib/events';
import { buildEventOgImageResponse } from '@/lib/og';

// イベントごとの OGP 画像（動的生成）。event が無ければテンプレ画像を返す。
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  const event = id ? await getEventById(id) : null;
  return buildEventOgImageResponse(event);
}
