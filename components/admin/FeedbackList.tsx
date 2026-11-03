'use client';
import { useState } from 'react';
import { MessageSquare } from 'lucide-react';

import { shortDate } from '@/components/guide/common';
import { api, useResource, explain } from './api';
export function FeedbackList() {
  const r = useResource<{
      feedback: {
        id: string;
        article_id: string;
        vote: string;
        comment: string;
        resolved: number;
        created_at: string;
      }[];
    }>('feedback'),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function resolve(id: string, resolved: boolean) {
    setBusy(true);
    setError('');
    try {
      await api('feedback/' + id, { method: 'POST', body: JSON.stringify({ resolved }) });
      r.reload();
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <div className="section-title">
        <div>
          <h2>ملاحظات العملاء</h2>
          <p className="muted">
            تقييمات وصلت فعلًا من صفحات الشرح. تحديث الشرح هو الخطوة التالية عند تكرار نفس الملاحظة.
          </p>
        </div>
      </div>
      {(error || r.error) && <p className="error-line">{error || r.error}</p>}
      {r.data?.feedback.length ? (
        <div className="feedback-list">
          {r.data.feedback.map((f) => (
            <article className="panel" key={f.id}>
              <div className="section-title">
                <span className={'status-tag ' + (f.vote === 'yes' ? 'published' : 'review')}>
                  {f.vote === 'yes' ? 'الشرح واضح' : 'محتاج توضيح'}
                </span>
                <small>{shortDate(f.created_at)}</small>
              </div>
              <a
                href={'/help/' + f.article_id}
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                فتح الشرح المرتبط ↗
              </a>
              <p>{f.comment || 'لم تُضف ملاحظة مكتوبة.'}</p>
              <button
                className="button secondary small"
                disabled={busy}
                onClick={() => resolve(f.id, !f.resolved)}
              >
                {f.resolved ? 'إعادة فتح المتابعة' : 'تمت المراجعة'}
              </button>
              {!!f.resolved && <span className="success-line small">تمت متابعة الملاحظة</span>}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <MessageSquare size={32} />
          <h3>لسه مفيش تقييمات</h3>
          <p>هتظهر هنا لما العميل يقيّم شرحًا أو يطلب توضيح.</p>
        </div>
      )}
    </section>
  );
}
