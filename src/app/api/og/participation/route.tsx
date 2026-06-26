import type { NextRequest } from 'next/server';
import { getEntryById } from '@/lib/entries';
import { getEventById } from '@/lib/events';
import { buildOgImageResponse } from '@/lib/og';

// 通常は R2 の静的画像を og:image に使う。これは未生成時のフォールバック（動的生成）。
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  const entry = id ? await getEntryById(id) : null;
  const event = entry ? await getEventById(entry.eventId) : null;
  return buildOgImageResponse(entry, event);
}
