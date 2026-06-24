import type { Metadata } from 'next';
import { ContactForm } from '@/components/ContactForm';

export const metadata: Metadata = {
  title: 'お問い合わせ — コスプレ参加表明',
  description: 'ご要望・ご意見・不具合のお問い合わせフォーム',
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-900 mb-1">お問い合わせ</h1>
      <p className="text-sm text-gray-500 mb-6">
        ご要望・ご意見・不具合のご報告などをお送りいただけます。
      </p>
      <ContactForm />
    </div>
  );
}
