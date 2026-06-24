import { Resend } from 'resend';

export interface SendMailInput {
  subject: string;
  text: string;
  html?: string;
  /** 返信先（任意）。送信者の連絡先メールなど */
  replyTo?: string;
}

export type SendMailResult =
  | { ok: true }
  | { ok: false; reason: 'unconfigured' | 'failed' };

/** HTMLメール本文向けのエスケープ */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 運営者宛にメールを送信する。
 * 送信先は CONTACT_EMAIL_TO（未設定なら REPORT_EMAIL_TO）。いずれもサーバー専用環境変数。
 */
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL_TO ?? process.env.REPORT_EMAIL_TO;
  const from = process.env.REPORT_EMAIL_FROM ?? 'onboarding@resend.dev';

  if (!apiKey || !to) {
    console.error('メール設定が未構成です（RESEND_API_KEY / 宛先メール）');
    return { ok: false, reason: 'unconfigured' };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: `コスプレ参加表明 <${from}>`,
      to,
      subject: input.subject,
      replyTo: input.replyTo,
      text: input.text,
      html: input.html,
    });

    if (error) {
      console.error('メール送信エラー:', error);
      return { ok: false, reason: 'failed' };
    }
    return { ok: true };
  } catch (e) {
    console.error('sendMail failed:', e);
    return { ok: false, reason: 'failed' };
  }
}
