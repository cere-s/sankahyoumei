export function BetaBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
      <p className="text-xs text-amber-800 leading-relaxed">
        ⚠️ 現在は身内検証中です。入力内容はURLを知っている方から閲覧される可能性があります。
        個人情報や公開したくない情報は入力しないでください。
        参加表明は撮影許可を意味しません。表示されているX IDは本人確認済みとは限りません。
      </p>
    </div>
  );
}
