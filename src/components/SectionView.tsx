'use client';

import { useEffect, useRef } from 'react';
import { track } from '@/lib/analytics-client';
import type { AnalyticsEventName } from '@/lib/analytics';

interface Props {
  eventName: AnalyticsEventName;
  children: React.ReactNode;
  className?: string;
}

/** 子要素が画面に一定割合入った最初の1回だけ計測する（セクション到達率用） */
export function SectionView({ eventName, children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let fired = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !fired) {
            fired = true;
            track({ event_name: eventName });
            io.disconnect();
          }
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eventName]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
