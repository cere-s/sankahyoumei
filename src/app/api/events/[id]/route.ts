import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { withdrawOwnEvent } from '@/lib/events';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

/** 登録者本人による取り下げ（参加表明ゼロの自分の仮登録イベントのみ） */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!rateLimit(`event-withdraw:${getClientIp(request)}`, 20, 60_000)) {
    return NextResponse.json({ error: 'リクエストが多すぎます。少し時間をおいてください。' }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
  }

  const { id } = await params;
  const result = await withdrawOwnEvent(id, user.id);
  if (!result.ok) {
    const map: Record<string, [string, number]> = {
      not_found: ['イベントが見つかりません', 404],
      forbidden: ['取り下げる権限がありません', 403],
      not_pending: ['確認済みのイベントは取り下げできません。運営にお問い合わせください', 400],
      has_entries: ['参加表明があるため取り下げできません。運営にお問い合わせください', 400],
    };
    const [message, status] = map[result.reason] ?? ['処理に失敗しました', 400];
    return NextResponse.json({ error: message }, { status });
  }
  return NextResponse.json({ ok: true });
}
