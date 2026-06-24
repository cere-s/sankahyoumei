import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getEntryById } from '@/lib/entries';
import { getEventById } from '@/lib/events';
import { getSiteUrl } from '@/lib/site';

const REPORT_REASONS: Record<string, string> = {
  impersonation: 'なりすまし',
  inappropriate: '不適切な内容',
  other: 'その他',
};

const MAX_DETAILS = 2000;
const MAX_CONTACT = 200;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 });
  }

  const entryId = body.entryId ? String(body.entryId) : '';
  const reasonKey = body.reason ? String(body.reason) : '';
  const details = String(body.details ?? '').trim();
  const reporterContact = String(body.reporterContact ?? '').trim();

  if (!entryId || !REPORT_REASONS[reasonKey]) {
    return NextResponse.json({ error: '通報内容が不足しています' }, { status: 400 });
  }
  if (details.length > MAX_DETAILS || reporterContact.length > MAX_CONTACT) {
    return NextResponse.json({ error: '入力内容が長すぎます' }, { status: 400 });
  }

  // 通報対象の情報はクライアント値ではなくサーバー側で確定する
  const entry = await getEntryById(entryId);
  if (!entry) {
    return NextResponse.json({ error: '対象の参加表明が見つかりません' }, { status: 404 });
  }
  const event = await getEventById(entry.eventId);

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REPORT_EMAIL_TO;
  const from = process.env.REPORT_EMAIL_FROM ?? 'onboarding@resend.dev';

  if (!apiKey || !to) {
    console.error('通報メール設定が未構成です（RESEND_API_KEY / REPORT_EMAIL_TO）');
    return NextResponse.json(
      { error: '現在通報を受け付けられません。時間をおいて再度お試しください。' },
      { status: 503 }
    );
  }

  const reasonLabel = REPORT_REASONS[reasonKey];
  const entryUrl = `${getSiteUrl()}/events/${entry.eventId}/entries/${entry.id}`;

  const textLines = [
    '参加表明の通報を受信しました。',
    '',
    `■ 通報理由：${reasonLabel}`,
    '',
    '■ 対象の参加表明',
    `  表示名：${entry.displayName}`,
    `  X ID：@${entry.xId}`,
    `  イベント：${event?.name ?? '(不明)'}`,
    `  参加表明ID：${entry.id}`,
    `  URL：${entryUrl}`,
    '',
    '■ 詳細',
    details || '(記載なし)',
    '',
    '■ 通報者の連絡先（任意）',
    reporterContact || '(記載なし)',
  ];

  const html = `
    <div style="font-family: sans-serif; font-size: 14px; line-height: 1.7; color: #333;">
      <p>参加表明の通報を受信しました。</p>
      <p><strong>通報理由：</strong>${escapeHtml(reasonLabel)}</p>
      <h3 style="margin-bottom:4px;">対象の参加表明</h3>
      <ul style="margin-top:0;">
        <li>表示名：${escapeHtml(entry.displayName)}</li>
        <li>X ID：@${escapeHtml(entry.xId)}</li>
        <li>イベント：${escapeHtml(event?.name ?? '(不明)')}</li>
        <li>参加表明ID：${escapeHtml(entry.id)}</li>
        <li>URL：<a href="${escapeHtml(entryUrl)}">${escapeHtml(entryUrl)}</a></li>
      </ul>
      <h3 style="margin-bottom:4px;">詳細</h3>
      <p style="white-space:pre-wrap;">${escapeHtml(details) || '(記載なし)'}</p>
      <h3 style="margin-bottom:4px;">通報者の連絡先（任意）</h3>
      <p>${escapeHtml(reporterContact) || '(記載なし)'}</p>
    </div>
  `;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: `コスプレ参加表明 通報 <${from}>`,
      to,
      subject: `【通報】${reasonLabel} - ${entry.displayName}（@${entry.xId}）`,
      replyTo: reporterContact.includes('@') ? reporterContact : undefined,
      text: textLines.join('\n'),
      html,
    });

    if (error) {
      console.error('通報メール送信エラー:', error);
      return NextResponse.json({ error: '送信に失敗しました' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('POST /api/report failed:', e);
    return NextResponse.json({ error: '送信に失敗しました' }, { status: 500 });
  }
}
