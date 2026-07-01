/**
 * ブラウザ側の解析送信ヘルパー。
 * 送信先は /api/analytics（書き込み専用）。user_id はサーバーがセッションから付与する。
 */

const SESSION_KEY = 'ck_analytics_sid';
const ENDPOINT = '/api/analytics';

/** タブ単位のセッションID（匿名の来訪を束ねる不透明値） */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

export interface AnalyticsPayload {
  event_name: string;
  page_path?: string;
  event_id?: string;
  entry_id?: string;
  metadata?: Record<string, unknown>;
}

interface WireEvent extends AnalyticsPayload {
  session_id: string;
}

function toWire(events: AnalyticsPayload[]): WireEvent[] {
  const sid = getSessionId();
  const path = typeof location !== 'undefined' ? location.pathname : undefined;
  return events.map((e) => ({ ...e, page_path: e.page_path ?? path, session_id: sid }));
}

/**
 * 送信本体。preferBeacon=true かつ sendBeacon が使えれば離脱時でも確実に送る。
 * それ以外は keepalive 付き fetch。テレメトリなので失敗は握りつぶす。
 */
function send(events: AnalyticsPayload[], preferBeacon: boolean): void {
  if (typeof window === 'undefined' || events.length === 0) return;
  const body = JSON.stringify({ events: toWire(events) });

  if (preferBeacon && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    } catch {
      // fall through to fetch
    }
  }

  try {
    void fetch(ENDPOINT, {
      method: 'POST',
      body,
      keepalive: true,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch {
    // ignore
  }
}

/** 通常の計測（クリックやビューなど） */
export function track(payload: AnalyticsPayload): void {
  send([payload], false);
}

/** 離脱時の最終送信など、確実に届けたいとき */
export function trackBeacon(payload: AnalyticsPayload): void {
  send([payload], true);
}
