'use client';
import { useState } from 'react';
import { api, useResource, explain } from './api';
import { activityName, type GuidePack } from '@/lib/guide-model';
export type TemplateContent = Pick<
  GuidePack,
  'title' | 'activity' | 'modules' | 'articleIds' | 'welcome'
>;
export function HandoverTemplates({
  current,
  ready,
  onApply,
}: {
  current: TemplateContent | null;
  ready: boolean;
  onApply: (content: TemplateContent) => void;
}) {
  const r = useResource<{ templates: { id: string; name: string; content: TemplateContent }[] }>(
    'templates',
  );
  const [name, setName] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  async function save() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api('templates', { method: 'POST', body: JSON.stringify({ name, content: current }) });
      setName('');
      setMessage('اتحفظ القالب للفريق؛ مفيش دليل عميل اتعمل أو رابط اتبعت.');
      r.reload();
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    if (!confirm('حذف القالب المحفوظ؟ أدلة العملاء الموجودة مش هتتأثر.')) return;
    setBusy(true);
    setError('');
    try {
      await api('templates/' + id, { method: 'PUT', body: JSON.stringify({ action: 'delete' }) });
      r.reload();
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="panel">
      <summary>قوالب التسليم المحفوظة للفريق</summary>
      <p className="muted">
        ابدأ من قالب وعدّل اسم العميل واختياراته. القالب لا ينشئ رابطًا ولا يغيّر دليلًا موجودًا.
        اسم العميل لا يُحفظ في القالب؛ استخدم رسالة ترحيب عامة لأنها تُحفظ مع الاختيارات.
      </p>
      {current && (
        <div className="template-tools">
          <label>
            اسم القالب
            <input
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: تدريب فريق المبيعات"
            />
          </label>
          <button
            className="button secondary small"
            disabled={busy || name.trim().length < 4}
            onClick={save}
          >
            حفظ الإعدادات الحالية كقالب
          </button>
        </div>
      )}
      {(error || r.error) && (
        <p role="alert" className="error-line">
          {error || r.error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {r.loading ? (
        <p>جارٍ تحميل القوالب…</p>
      ) : !r.data?.templates.length ? (
        <p>لسه مفيش قوالب. افتح تجهيز دليل واحفظ إعداداته كقالب.</p>
      ) : (
        <div className="template-list">
          {r.data.templates.map((t) => (
            <article className="panel" key={t.id}>
              <h3>{t.name}</h3>
              <p>
                {activityName(t.content.activity)} · {t.content.modules.length} أقسام ·{' '}
                {t.content.articleIds.length
                  ? t.content.articleIds.length + ' شرحًا محددًا'
                  : 'كل المنشور المناسب'}
              </p>
              <div className="inline-actions">
                <button
                  className="button primary small"
                  disabled={busy || !ready}
                  onClick={() => onApply(t.content)}
                >
                  استخدام القالب
                </button>
                <button
                  className="button ghost small danger"
                  disabled={busy}
                  onClick={() => remove(t.id)}
                >
                  حذف القالب
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </details>
  );
}
