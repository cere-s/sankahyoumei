'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * トップの検索バー。作品・キャラの自由検索を受け取り /search へ委譲する。
 * （役割・エリア等の絞り込みは検索側が未対応のため、UIには出さず本当に動く導線だけ置く）
 */
export function SearchFilterBar() {
  const router = useRouter();
  const [q, setQ] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/search?work=${encodeURIComponent(query)}` : '/search');
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col sm:flex-row items-stretch gap-2 rounded-2xl border border-violet-100 bg-white/90 p-2 shadow-sm backdrop-blur"
    >
      <div className="flex flex-1 items-center gap-2 rounded-xl bg-gray-50 px-3">
        <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="作品・キャラ名で参加表明を探す"
          aria-label="作品・キャラ名で参加表明を探す"
          className="w-full bg-transparent py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
      >
        探す
      </button>
    </form>
  );
}
