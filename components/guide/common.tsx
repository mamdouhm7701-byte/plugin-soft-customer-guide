'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpLeft, BookOpen, Check, Copy, Download, LogIn, Search, X } from 'lucide-react';
export { ArrowUpLeft, BookOpen, Check, Copy, Download, LogIn, Search, X };
export function Brand({
  compact = false,
  homeHref = '/',
}: {
  compact?: boolean;
  homeHref?: string;
}) {
  return (
    <Link href={homeHref} className="brand" aria-label="دليل العميل - الصفحة الرئيسية">
      <img src="/assets/plugin-brand.png" width="120" height="64" alt="Plugin Soft" />
      <span className={compact ? 'brand-caption compact' : 'brand-caption'}>
        <strong>دليل العميل المصوّر</strong>
        <small>معاك بعد التدريب، خطوة بخطوة</small>
      </span>
    </Link>
  );
}
export function Header({
  staff = false,
  homeHref = '/',
  customerOnly = false,
}: {
  staff?: boolean;
  homeHref?: string;
  customerOnly?: boolean;
}) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand homeHref={homeHref} />
        <div className="header-actions">
          <Link className="header-link" href={homeHref}>
            دليل العميل
          </Link>
          {!customerOnly && (
            <a className="button secondary small" href="/team/login">
              <LogIn size={15} />
              {staff ? 'مساحة الفريق' : 'دخول الفريق'}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
export function Footer({ customerOnly = false }: { customerOnly?: boolean } = {}) {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <span>Plugin Soft · دليل العميل المصوّر</span>
        <span>الشروحات المنشورة فقط · أيقونة الصورة تفتح الخطوة بحجم أوضح</span>
        {!customerOnly && <a href="/team/login">مساحة الفريق ←</a>}
      </div>
    </footer>
  );
}
export function Empty({
  title = 'لسه مفيش شروحات مطابقة',
  text = 'جرّب كلمات أبسط، أو اختَر قسمًا مختلفًا.',
  children,
}: {
  title?: string;
  text?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <BookOpen size={32} />
      <h3>{title}</h3>
      <p>{text}</p>
      {children}
    </div>
  );
}
export function CopyButton({
  text,
  label = 'نسخ الرابط',
  className = 'button secondary small',
}: {
  text: string | (() => string);
  label?: string;
  className?: string;
}) {
  const [message, setMessage] = useState('');
  return (
    <span className="copy-control">
      <button
        className={className}
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(typeof text === 'function' ? text() : text);
            setMessage('تم النسخ');
            setTimeout(() => setMessage(''), 2500);
          } catch {
            setMessage('تعذّر النسخ؛ انسخ الرابط من شريط العنوان.');
          }
        }}
      >
        {message === 'تم النسخ' ? <Check size={15} /> : <Copy size={15} />} {label}
      </button>
      <span role="status" className={message === 'تم النسخ' ? 'copy-success' : 'copy-error'}>
        {message}
      </span>
    </span>
  );
}
export const shortDate = (s: string) => {
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Africa/Cairo',
    }).format(new Date(s));
  } catch {
    return s;
  }
};
