'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

export function EventSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      const params = new URLSearchParams(searchParams.toString());
      if (q) {
        params.set('q', q);
      } else {
        params.delete('q');
      }
      startTransition(() => {
        router.replace(`/events?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  return (
    <div className="relative mb-5 max-w-xl">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
      <input
        type="search"
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder="イベント名・会場・ハッシュタグで検索"
        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 placeholder:text-gray-400"
      />
    </div>
  );
}
