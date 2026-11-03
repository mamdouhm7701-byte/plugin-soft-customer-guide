'use client';
import { useRef } from 'react';
import { X, Info } from 'lucide-react';
import type { ArticleContent } from '@/lib/guide-model';
import { beforeStartMode } from '@/lib/before-start';
export { beforeStartMode };
export function BeforeStart({ content }: { content: ArticleContent }) {
  const dialog = useRef<HTMLDialogElement>(null),
    mode = beforeStartMode(content);
  if (mode === 'hidden') return null;
  const list = (
    <ul>
      {content.prerequisites
        .filter((x) => x.trim())
        .map((x, i) => (
          <li key={i}>{x}</li>
        ))}
    </ul>
  );
  if (mode === 'important')
    return (
      <section className="before-section" id="before">
        <h2>مهم قبل ما تبدأ</h2>
        {list}
      </section>
    );
  return (
    <div className="before-details">
      <button className="button ghost small" onClick={() => dialog.current?.showModal()}>
        <Info size={16} />
        توضيحات قبل البداية
      </button>
      <dialog ref={dialog} className="reply-dialog" aria-labelledby="before-start-title">
        <div className="dialog-heading">
          <h2 id="before-start-title">توضيحات قبل البداية</h2>
          <button
            className="icon-button"
            aria-label="إغلاق توضيحات البداية"
            onClick={() => dialog.current?.close()}
          >
            <X size={19} />
          </button>
        </div>
        {list}
      </dialog>
    </div>
  );
}
