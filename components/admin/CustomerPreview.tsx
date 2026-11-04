'use client';
import { useRef, useState } from 'react';
export function CustomerPreview({ id }: { id: string }) {
  const dialog = useRef<HTMLDialogElement>(null),
    [device, setDevice] = useState<'mobile' | 'desktop'>('mobile'),
    [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="button secondary small"
        onClick={() => {
          setOpen(true);
          dialog.current?.showModal();
        }}
      >
        معاينة الموبايل والكمبيوتر
      </button>
      <dialog
        className="preview-dialog"
        ref={dialog}
        onClose={() => setOpen(false)}
        aria-label="معاينة دليل العميل"
      >
        <div className="preview-toolbar">
          <strong>نسخة العميل الفعلية</strong>
          <div className="inline-actions">
            <button
              type="button"
              className={'button small ' + (device === 'mobile' ? 'primary' : 'secondary')}
              aria-pressed={device === 'mobile'}
              onClick={() => setDevice('mobile')}
            >
              موبايل
            </button>
            <button
              type="button"
              className={'button small ' + (device === 'desktop' ? 'primary' : 'secondary')}
              aria-pressed={device === 'desktop'}
              onClick={() => setDevice('desktop')}
            >
              كمبيوتر
            </button>
            <button
              type="button"
              className="button secondary small"
              onClick={() => dialog.current?.close()}
            >
              إغلاق المعاينة
            </button>
          </div>
        </div>
        <p className="muted">
          المعاينة تستخدم رابط العميل نفسه وصلاحياته. تقييماتك هنا تُسجّل كتقييمات فعلية؛ استخدمها
          للمشاهدة فقط.
        </p>
        {open && (
          <div className="preview-viewport">
            <iframe
              key={id}
              title="دليل العميل"
              src={'/guides/' + encodeURIComponent(id)}
              style={{ width: device === 'mobile' ? 390 : 1080 }}
            />
          </div>
        )}
      </dialog>
    </>
  );
}
