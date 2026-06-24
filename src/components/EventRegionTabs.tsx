'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

interface Props {
  regions: { name: string; count: number }[];
  total: number;
  active: string;
}

export function EventRegionTabs({ regions, total, active }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function select(region: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (region) {
      params.set('region', region);
    } else {
      params.delete('region');
    }
    startTransition(() => {
      router.replace(`/events?${params.toString()}`);
    });
  }

  const tabClass = (selected: boolean) =>
    `px-3.5 py-1.5 rounded-full text-sm border transition-colors whitespace-nowrap ${
      selected
        ? 'bg-violet-600 text-white border-violet-600'
        : 'bg-white text-gray-600 border-gray-200 hover:border-violet-400'
    }`;

  return (
    <div className="flex flex-wrap gap-2 mb-5">
      <button onClick={() => select('')} className={tabClass(!active)}>
        すべて<span className="ml-1 text-xs opacity-70">{total}</span>
      </button>
      {regions.map((r) => (
        <button key={r.name} onClick={() => select(r.name)} className={tabClass(active === r.name)}>
          {r.name}
          <span className="ml-1 text-xs opacity-70">{r.count}</span>
        </button>
      ))}
    </div>
  );
}
