'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="container not-found">
      <div className="empty-state">
        <h1>تعذر تحميل الصفحة دلوقتي</h1>
        <p>جرّب تحميل الصفحة مرة تانية. لو الخطأ حصل أثناء الحفظ، راجع آخر نسخة قبل تكراره.</p>
        <button className="button primary" onClick={reset}>
          حاول مرة تانية
        </button>
        <Link className="button secondary" href="/">
          الصفحة الرئيسية
        </Link>
      </div>
    </main>
  );
}
