'use client';

import { useEffect, useRef } from 'react';
import { track } from '@/lib/analytics-client';

interface Props {
  event: string;
  eventId?: string;
  entryId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * マウント時に1回だけ計測イベントを送る（参加表明ごとの閲覧数、フォーム到達など）。
 * 表示はしない。StrictMode の二重実行を ref で防ぐ。
 */
export function AnalyticsView({ event, eventId, entryId, metadata }: Props) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    track({ event_name: event, event_id: eventId, entry_id: entryId, metadata });
  }, [event, eventId, entryId, metadata]);
  return null;
}
