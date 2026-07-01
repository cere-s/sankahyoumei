'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { track, trackBeacon } from '@/lib/analytics-client';

const ENGAGEMENT_INTERVAL_MS = 15_000;
const SCROLL_THRESHOLDS = [25, 50, 75, 100] as const;

function scrollDepthPercent(): number {
  if (typeof document === 'undefined') return 0;
  const doc = document.documentElement;
  const scrollable = doc.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((window.scrollY / scrollable) * 100)));
}

/**
 * サイト全体の受動計測。<body> 直下に1つだけ置く。
 * - page_view: パス変更ごと
 * - page_engagement: 表示中(visible)のアクティブ滞在を15秒ごと＋離脱時に送信
 * - scroll_depth: 25/50/75/100% 到達時
 * - クリック計測: data-analytics 属性を持つ要素のクリックを委譲でひろう
 */
export function AnalyticsTracker() {
  const pathname = usePathname();

  // ---- クリック委譲（マウント時に1度だけ）----
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const el = target?.closest?.('[data-analytics]') as HTMLElement | null;
      if (!el) return;
      const name = el.dataset.analytics;
      if (!name) return;
      track({
        event_name: name,
        event_id: el.dataset.analyticsEventId || undefined,
        entry_id: el.dataset.analyticsEntryId || undefined,
        metadata: el.dataset.analyticsLabel ? { label: el.dataset.analyticsLabel } : undefined,
      });
    };
    // capture 相で拾い、リンク遷移が始まっても計測を逃さない
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // ---- ページ単位の計測（パスが変わるたびに作り直す）----
  const stateRef = useRef({ activeMs: 0, lastStart: 0, maxScroll: 0, fired: new Set<number>() });

  useEffect(() => {
    const path = pathname;
    const st = { activeMs: 0, lastStart: 0, maxScroll: scrollDepthPercent(), fired: new Set<number>() };
    stateRef.current = st;
    const nowVisible = () => document.visibilityState === 'visible';
    if (nowVisible()) st.lastStart = Date.now();

    track({ event_name: 'page_view', page_path: path });

    const activeSeconds = () => {
      const running = st.lastStart ? Date.now() - st.lastStart : 0;
      return Math.round((st.activeMs + running) / 1000);
    };

    const sendEngagement = (beacon: boolean) => {
      const duration = activeSeconds();
      if (duration <= 0 && st.maxScroll <= 0) return;
      const payload = {
        event_name: 'page_engagement',
        page_path: path,
        metadata: { duration_seconds: duration, max_scroll_depth: st.maxScroll },
      };
      if (beacon) trackBeacon(payload);
      else track(payload);
    };

    const onScroll = () => {
      const pct = scrollDepthPercent();
      if (pct > st.maxScroll) st.maxScroll = pct;
      for (const t of SCROLL_THRESHOLDS) {
        if (st.maxScroll >= t && !st.fired.has(t)) {
          st.fired.add(t);
          track({ event_name: 'scroll_depth', page_path: path, metadata: { depth: t } });
        }
      }
    };

    const onVisibility = () => {
      if (nowVisible()) {
        st.lastStart = Date.now();
      } else {
        if (st.lastStart) {
          st.activeMs += Date.now() - st.lastStart;
          st.lastStart = 0;
        }
        sendEngagement(true);
      }
    };

    const onPageHide = () => {
      if (st.lastStart) {
        st.activeMs += Date.now() - st.lastStart;
        st.lastStart = 0;
      }
      sendEngagement(true);
    };

    const interval = window.setInterval(() => sendEngagement(false), ENGAGEMENT_INTERVAL_MS);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);

    // 初期表示時点のスクロール到達（既に下にいる場合など）も評価
    onScroll();

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      // SPA遷移でこのページを離れる際の最終送信
      if (st.lastStart) {
        st.activeMs += Date.now() - st.lastStart;
        st.lastStart = 0;
      }
      sendEngagement(false);
    };
  }, [pathname]);

  return null;
}
