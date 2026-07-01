import Link from 'next/link';
import { getCosplaySuggestions, searchCosplayEntries } from '@/lib/entries';
import { getEventsByIds } from '@/lib/events';
import { EntryCard } from '@/components/EntryCard';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ work?: string; character?: string }>;
}

/** 検索リンクのhrefを組み立てる（空の条件は付けない） */
function searchHref(work: string, character: string): string {
  const params = new URLSearchParams();
  if (work) params.set('work', work);
  if (character) params.set('character', character);
  const qs = params.toString();
  return qs ? `/search?${qs}` : '/search';
}

const chipClass = (selected: boolean) =>
  `px-3.5 py-1.5 rounded-full text-sm border transition-colors whitespace-nowrap ${
    selected
      ? 'bg-violet-600 text-white border-violet-600'
      : 'bg-white text-gray-600 border-gray-200 hover:border-violet-400'
  }`;

export default async function SearchPage({ searchParams }: Props) {
  const { work = '', character = '' } = await searchParams;
  const workQ = work.trim();
  const characterQ = character.trim();
  const hasQuery = Boolean(workQ || characterQ);

  const suggestions = await getCosplaySuggestions();

  // 作品が選ばれていて候補があればその作品のキャラを優先、無ければ全キャラから横断
  const characterChips =
    workQ && suggestions.charactersByWork[workQ]?.length
      ? suggestions.charactersByWork[workQ]
      : suggestions.allCharacters;

  const entries = hasQuery
    ? await searchCosplayEntries({ work: workQ, character: characterQ, limit: 100 })
    : [];
  const eventMap = hasQuery ? await getEventsByIds(entries.map((e) => e.eventId)) : new Map();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900 mb-1">作品・キャラで探す</h1>
        <p className="text-sm text-gray-500">
          コスプレの参加表明を、当日の予定作品・キャラから横断で探せます。
        </p>
      </div>

      {/* 作品チップ */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-bold text-gray-700">作品</span>
          {workQ && (
            <Link href={searchHref('', characterQ)} className="text-xs text-violet-600 hover:underline">
              作品の絞り込みを解除
            </Link>
          )}
        </div>
        {suggestions.works.length === 0 ? (
          <p className="text-sm text-gray-400">まだ登録された作品がありません</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {suggestions.works.map((w) => (
              <Link key={w} href={searchHref(w, '')} className={chipClass(workQ === w)}>
                {w}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* キャラチップ */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-bold text-gray-700">キャラ</span>
          {workQ && suggestions.charactersByWork[workQ]?.length ? (
            <span className="text-xs text-gray-400">「{workQ}」のキャラ</span>
          ) : (
            <span className="text-xs text-gray-400">全キャラから横断</span>
          )}
        </div>
        {characterChips.length === 0 ? (
          <p className="text-sm text-gray-400">キャラ候補がありません</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {characterChips.map((c) => (
              <Link key={c} href={searchHref(workQ, c)} className={chipClass(characterQ === c)}>
                {c}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 結果 or 初期案内 */}
      {!hasQuery ? (
        <div className="bg-violet-50/60 border border-violet-100 rounded-xl px-4 py-8 text-center">
          <p className="text-sm text-gray-600">
            上の作品・キャラを選ぶと、その参加表明が一覧で表示されます。
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">
              {[workQ && `作品「${workQ}」`, characterQ && `キャラ「${characterQ}」`]
                .filter(Boolean)
                .join(' × ')}
              <span className="text-gray-400"> の参加表明 {entries.length} 件</span>
            </p>
            <Link href="/search" className="text-xs text-violet-600 hover:underline">
              条件をクリア
            </Link>
          </div>

          {entries.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">
              条件に一致する参加表明はまだありません
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  eventId={entry.eventId}
                  eventName={eventMap.get(entry.eventId)?.name}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
