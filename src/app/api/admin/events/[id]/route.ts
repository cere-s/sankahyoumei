import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { setEventStatusAdmin, updateEventAdmin, type UpdateEventInput } from '@/lib/events';

/** 運営によるモデレーション：確認済み昇格 / 取り下げ / 修正 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.id)) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 });
  }

  const action = String(body.action ?? '');
  try {
    if (action === 'publish') {
      await setEventStatusAdmin(id, 'published');
      return NextResponse.json({ ok: true, status: 'published' });
    }
    if (action === 'remove') {
      await setEventStatusAdmin(id, 'removed');
      return NextResponse.json({ ok: true, status: 'removed' });
    }
    if (action === 'update') {
      const fields = (body.fields ?? {}) as UpdateEventInput;
      const event = await updateEventAdmin(id, fields);
      return NextResponse.json({ ok: true, event });
    }
    return NextResponse.json({ error: '不正な操作です' }, { status: 400 });
  } catch (e) {
    console.error('PATCH /api/admin/events failed:', e);
    return NextResponse.json({ error: '処理に失敗しました' }, { status: 500 });
  }
}
