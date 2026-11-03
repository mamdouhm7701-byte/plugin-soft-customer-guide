'use client';
import { useRef, useState } from 'react';
import { Expand, Minimize2, X } from 'lucide-react';
import { imageSrc, type Step } from '@/lib/guide-model';
function Marks({ step, n }: { step: Step; n: number }) {
  const f = step.focus;
  return f ? (
    <>
      <span
        aria-hidden="true"
        className="photo-mark"
        style={{
          left: `${f.x - f.w / 2}%`,
          top: `${f.y - f.h / 2}%`,
          width: `${f.w}%`,
          height: `${f.h}%`,
        }}
      />
      <span
        className="photo-pin"
        aria-hidden="true"
        style={{ left: `${Math.min(96, f.x - f.w / 2)}%`, top: `${Math.max(3, f.y - f.h / 2)}%` }}
      >
        {n}
      </span>
    </>
  ) : null;
}
export function Photo({ step, n }: { step: Step; n: number }) {
  const dialog = useRef<HTMLDialogElement>(null),
    [zoom, setZoom] = useState(true);
  if (!step.image) return <div className="soft-note">صورة هذه الخطوة غير متاحة.</div>;
  const f = step.focus,
    z = f ? Math.max(1, Math.min(3.4, 80 / f.w)) : 1,
    left = f ? Math.max(100 - z * 100, Math.min(0, 50 - f.x * z)) : 0,
    top = f ? Math.max(100 - z * 100, Math.min(0, 50 - f.y * z)) : 0;
  return (
    <figure className="step-photo">
      <button
        type="button"
        className="screenshot"
        aria-label={`تكبير صورة الخطوة ${n}`}
        onClick={() => {
          setZoom(!!f);
          dialog.current?.showModal();
        }}
      >
        <img src={imageSrc(step.image)} alt={step.caption} loading="lazy" />
        <Marks step={step} n={n} />
        <span className="expand-corner">
          <Expand size={16} />
        </span>
      </button>
      <figcaption>
        <span>{step.caption}</span>
        <span>اضغط للتكبير</span>
      </figcaption>
      <dialog ref={dialog} className="image-dialog">
        <div className="image-toolbar">
          <strong>
            الخطوة {n} · {step.title}
          </strong>
          <div>
            {f && (
              <button className="button secondary small" onClick={() => setZoom(!zoom)}>
                {zoom ? <Minimize2 size={15} /> : <Expand size={15} />}{' '}
                {zoom ? 'الصورة كاملة' : 'تكبير موضع الخطوة'}
              </button>
            )}
            <button
              className="icon-button"
              aria-label="إغلاق الصورة"
              onClick={() => dialog.current?.close()}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className={zoom && f ? 'image-stage zoomed' : 'image-stage'}>
          {zoom && f ? (
            <div
              className="image-zoom-canvas"
              style={{
                width: `${z * 100}%`,
                height: `${z * 100}%`,
                left: `${left}%`,
                top: `${top}%`,
              }}
            >
              <img src={imageSrc(step.image)} alt={step.caption} />
              <Marks step={step} n={n} />
            </div>
          ) : (
            <>
              <img src={imageSrc(step.image)} alt={step.caption} />
              <Marks step={step} n={n} />
            </>
          )}
        </div>
        <p>{step.caption}</p>
      </dialog>
    </figure>
  );
}
