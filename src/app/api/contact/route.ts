import { NextRequest, NextResponse } from 'next/server';
import { sendMail, escapeHtml } from '@/lib/mail';

const CATEGORIES: Record<string, string> = {
  request: '要望',
  bug: '不具合報告',
  question: '質問',
  other: 'その他',
};

const MAX_MESSAGE = 4000;
const MAX_CONTACT = 200;

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 });
  }

  const categoryKey = body.category ? String(body.category) : '';
  const message = String(body.message ?? '').trim();
  const contact = String(body.contact ?? '').trim();

  if (!CATEGORIES[categoryKey]) {
    return NextResponse.json({ error: '種別を選択してください' }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: '内容を入力してください' }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE || contact.length > MAX_CONTACT) {
    return NextResponse.json({ error: '入力内容が長すぎます' }, { status: 400 });
  }

  const categoryLabel = CATEGORIES[categoryKey];

  const text = [
    'お問い合わせを受信しました。',
    '',
    `■ 種別：${categoryLabel}`,
    '',
    '■ 内容',
    message,
    '',
    '■ 連絡先（任意）',
    contact || '(記載なし)',
  ].join('\n');

  const html = `
    <div style="font-family: sans-serif; font-size: 14px; line-height: 1.7; color: #333;">
      <p>お問い合わせを受信しました。</p>
      <p><strong>種別：</strong>${escapeHtml(categoryLabel)}</p>
      <h3 style="margin-bottom:4px;">内容</h3>
      <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
      <h3 style="margin-bottom:4px;">連絡先（任意）</h3>
      <p>${escapeHtml(contact) || '(記載なし)'}</p>
    </div>
  `;

  const result = await sendMail({
    subject: `【お問い合わせ】${categoryLabel}`,
    text,
    html,
    replyTo: contact.includes('@') ? contact : undefined,
  });

  if (!result.ok) {
    if (result.reason === 'unconfigured') {
      return NextResponse.json(
        { error: '現在お問い合わせを受け付けられません。時間をおいて再度お試しください。' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: '送信に失敗しました' }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
