'use client';
import { useState } from 'react';
export function ExportPrintButton() {
  const [busy, setBusy] = useState(false);
  async function print() {
    setBusy(true);
    try {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images).map((img) => img.decode().catch(() => {})));
      window.print();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="print-toolbar">
      <p>نسخة داخلية. اختَر «حفظ بصيغة PDF» من نافذة الطباعة. يتم تجهيز الصور قبل فتحها.</p>
      <button className="button primary" disabled={busy} onClick={print}>
        {busy ? 'جارٍ تجهيز الصور…' : 'طباعة / حفظ PDF'}
      </button>
      <a href="/admin?tab=articles">رجوع للمكتبة</a>
    </div>
  );
}
