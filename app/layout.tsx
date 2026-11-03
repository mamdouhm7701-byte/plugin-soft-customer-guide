import type { Metadata } from 'next';
import './globals.css';
import { ContextHints } from '@/components/guide/ContextHints';

export const metadata: Metadata = {
  title: { default: 'دليل العميل المصوّر | Plugin Soft', template: '%s | Plugin Soft' },
  description: 'خطوات قصيرة وصور فعلية من البرنامج. دليل العميل بعد التدريب ومكتبة إجابات للدعم.',
  icons: {
    icon: '/assets/plugin-logo.png',
    shortcut: '/assets/plugin-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
        <ContextHints />
      </body>
    </html>
  );
}
