interface Props {
  url?: string;
  name: string;
  ringClassName?: string;
  sizeClassName?: string;
}

/** Xアイコン（あれば）、なければ表示名の頭文字を丸バッジで表示する */
export function Avatar({ url, name, ringClassName = '', sizeClassName = 'w-7 h-7' }: Props) {
  const initial = name.trim().charAt(0) || '?';
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 font-bold text-gray-500 ring-2 ring-offset-2 ring-offset-white ${sizeClassName} ${ringClassName}`}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-[11px]">{initial}</span>
      )}
    </span>
  );
}
