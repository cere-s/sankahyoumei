'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    twttr?: { widgets: { load: (el?: HTMLElement) => void } };
  }
}

const WIDGETS_SRC = 'https://platform.twitter.com/widgets.js';

/** ツイートURLを公式ウィジェットで埋め込み表示する */
export function TweetEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function render() {
      if (window.twttr?.widgets && ref.current) {
        window.twttr.widgets.load(ref.current);
      }
    }

    if (window.twttr?.widgets) {
      render();
      return;
    }

    // widgets.js を一度だけ読み込む
    let script = document.querySelector<HTMLScriptElement>(`script[src="${WIDGETS_SRC}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = WIDGETS_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
    script.addEventListener('load', render);
    return () => script?.removeEventListener('load', render);
  }, [url]);

  return (
    <div ref={ref}>
      <blockquote className="twitter-tweet">
        <a href={url}>{url}</a>
      </blockquote>
    </div>
  );
}
