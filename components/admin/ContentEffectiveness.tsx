'use client';
import { useResource } from './api';
type Data = {
  negative: {
    article_id: string;
    title: string;
    published: boolean;
    total: number;
    negative: number;
    unresolved: number;
  }[];
  questions: { id: string; question: string; frequency: number }[];
};
export function ContentEffectiveness({
  onSearch,
  onNavigate,
}: {
  onSearch: (q: string) => void;
  onNavigate: (tab: 'feedback' | 'questions') => void;
}) {
  const r = useResource<Data>('effectiveness');
  return (
    <section className="panel">
      <div className="section-title">
        <div>
          <h2>إيه المحتوى اللي محتاج يتطوّر؟</h2>
          <p className="muted">
            أعداد التقييمات والأسئلة المسجلة فعلًا، وليست عدد الزيارات أو العملاء. الأولوية
            للملاحظات المفتوحة ثم عدد «محتاج توضيح».
          </p>
        </div>
        <button className="button secondary small" onClick={r.reload} disabled={r.loading}>
          تحديث المتابعة
        </button>
      </div>
      {r.error && (
        <p className="error-line" role="alert">
          {r.error}
        </p>
      )}
      {r.loading ? (
        <p>جارٍ تحميل المتابعة…</p>
      ) : (
        r.data && (
          <div className="template-list">
            <div>
              <h3>شروحات محتاجة توضيح</h3>
              <ul className="effectiveness-list">
                {r.data.negative.map((a) => (
                  <li key={a.article_id}>
                    <strong>{a.title}</strong>
                    <p>
                      {a.negative} محتاج توضيح من {a.total} تقييم · {a.unresolved} ملاحظة مفتوحة
                    </p>
                    <div className="inline-actions">
                      <button
                        className="button secondary small"
                        disabled={!a.published}
                        onClick={() => onSearch(a.title)}
                      >
                        فتح الشرح في المكتبة
                      </button>
                      <button className="button ghost small" onClick={() => onNavigate('feedback')}>
                        متابعة التقييمات
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {!r.data.negative.length && <p>مفيش تقييمات «محتاج توضيح» مسجلة لسه.</p>}
            </div>
            <div>
              <h3>الأسئلة المفتوحة الأكثر تكرارًا</h3>
              <ul className="effectiveness-list">
                {r.data.questions.map((q) => (
                  <li key={q.id}>
                    <strong>{q.question}</strong>
                    <p>اتسجل {q.frequency} مرة</p>
                    <button
                      className="button secondary small"
                      onClick={() => onNavigate('questions')}
                    >
                      متابعة السؤال
                    </button>
                  </li>
                ))}
              </ul>
              {!r.data.questions.length && <p>مفيش أسئلة مفتوحة مسجلة لسه.</p>}
            </div>
          </div>
        )
      )}
    </section>
  );
}
