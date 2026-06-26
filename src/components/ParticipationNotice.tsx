/** 参加表明まわりで共通して表示する注意書き（控えめに表示） */
export function ParticipationNotice({ className = '' }: { className?: string }) {
  return (
    <div className={`flex gap-1.5 text-[11px] text-gray-400 leading-relaxed ${className}`}>
      <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
      <span>
        参加表明は撮影許可ではありません。撮影・交流は本人の意思と当日の状況を優先してください。本サービスはイベント公式ではないため、イベント情報は公式サイトでご確認ください。
      </span>
    </div>
  );
}
