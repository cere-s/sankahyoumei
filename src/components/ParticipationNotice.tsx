/** 参加表明まわりで共通して表示する注意書き */
export function ParticipationNotice({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 leading-relaxed ${className}`}>
      <p>参加表明は撮影許可を意味しません。撮影・交流は本人の意思と当日の状況を優先してください。</p>
      <p>このサービスはイベント公式ではありません。イベント情報は必ず公式サイトをご確認ください。</p>
    </div>
  );
}
