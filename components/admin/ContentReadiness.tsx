'use client';
import { useState } from 'react';
import { useResource } from './api';
import { moduleName } from '@/lib/guide-model';
type Row = {
  id: string;
  title: string;
  module: string;
  status: string;
  missingImageSteps: number[];
  issues: string[];
  sourceReviewed: boolean;
  verifiedAt: string;
};
export function ContentReadiness({ onEdit }: { onEdit: (id: string) => void }) {
  const r = useResource<{ articles: Row[] }>('readiness'),
    [filter, setFilter] = useState('images'),
    [shown, setShown] = useState(60);
  const rows = r.data?.articles ?? [];
  const filtered = rows.filter((a) =>
    filter === 'images'
      ? a.missingImageSteps.length
      : filter === 'review'
        ? !a.verifiedAt
        : filter === 'ready'
          ? !a.issues.length
          : true,
  );
  return (
    <details className="panel" style={{ marginBottom: 20 }}>
      <summary className="text-link">جاهزية المحتوى الفعلي ومهام الاستكمال</summary>
      <p>
        العدادات من المحتوى المحفوظ حاليًا، وتشمل كل خطوة ناقصة. جاهزية الحقول وحدها لا تعني نشر
        الشرح أو اعتماد كل قواعده.
      </p>
      {r.error && <p className="error-line">{r.error}</p>}
      <button className="button secondary small" onClick={r.reload}>
        تحديث الجاهزية
      </button>
      <p>
        {rows.filter((a) => !a.missingImageSteps.length).length} شرح له صورة في كل خطوة ·{' '}
        {rows.filter((a) => !a.verifiedAt).length} بدون تاريخ مراجعة ·{' '}
        {rows.filter((a) => !a.issues.length).length} مستوفٍ لشروط النشر
      </p>
      <select
        aria-label="تصفية نواقص المحتوى"
        value={filter}
        onChange={(e) => {
          setFilter(e.target.value);
          setShown(60);
        }}
      >
        <option value="images">خطوات ناقصة الصور</option>
        <option value="review">مراجعة مطلوبة</option>
        <option value="ready">مستوفٍ لشروط النشر</option>
        <option value="all">الكل</option>
      </select>
      <ul className="readiness-list">
        {filtered.slice(0, shown).map((a) => (
          <li key={a.id}>
            <strong>{a.title}</strong>
            <small>
              {moduleName(a.module)} ·{' '}
              {a.missingImageSteps.length
                ? 'صور الخطوات: ' + a.missingImageSteps.join('، ')
                : 'الصور مكتملة'}{' '}
              · {a.verifiedAt || 'مراجعة مطلوبة'}
            </small>
            <button className="button secondary small" onClick={() => onEdit(a.id)}>
              استكمال الشرح
            </button>
          </li>
        ))}
      </ul>
      <p className="muted">
        {filtered.length} شرح مطابق؛ معروض {Math.min(shown, filtered.length)}.
      </p>
      {shown < filtered.length && (
        <button className="button secondary" onClick={() => setShown((count) => count + 60)}>
          عرض المزيد من مهام الاستكمال
        </button>
      )}
    </details>
  );
}
