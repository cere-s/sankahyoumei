'use client';

import { useState } from 'react';

interface Props {
  url?: string;
  name: string;
  ringClassName?: string;
  sizeClassName?: string;
}

/**
 * Xアイコン（あれば）、なければ表示名の頭文字を丸バッジで表示する。
 * Xのアイコンは本人がログイン時に取得したURLをそのまま使うため、
 * 本人がその後アイコンを変更・削除するとURLが404になることがある。
 * その場合も壊れた画像を出さず、頭文字表示にフォールバックする。
 */
export function Avatar({ url, name, ringClassName = '', sizeClassName = 'w-7 h-7' }: Props) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().charAt(0) || '?';
  const showImage = Boolean(url) && !failed;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 font-bold text-gray-500 ring-2 ring-offset-2 ring-offset-white ${sizeClassName} ${ringClassName}`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span className="text-[11px]">{initial}</span>
      )}
    </span>
  );
}
