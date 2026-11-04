import { ChartNoAxesCombined, MessageSquareText, Repeat2 } from 'lucide-react';
export type DashboardData = {
  articles: { total: number; published: number; review: number; draft: number };
  packs: { total: number; active: number };
  feedback: { total: number; needs_attention: number; yes: number; no: number };
  workflow: { status: string; count: number }[];
  questions: { id: string; question: string; frequency: number }[];
};
const number = (n: number) => n.toLocaleString('ar-EG');
function Bars({
  rows,
  empty,
  label,
}: {
  rows: { id: string; label: string; value: number; color: string }[];
  empty: string;
  label: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.some((r) => r.value > 0)) return <p className="chart-empty">{empty}</p>;
  return (
    <ul className="dashboard-bars" aria-label={label}>
      {rows.map((r) => (
        <li key={r.id}>
          <div className="chart-row-label">
            <span>{r.label}</span>
            <strong>{number(r.value)}</strong>
          </div>
          <div className="chart-track" aria-hidden="true">
            <span style={{ width: (r.value / max) * 100 + '%', background: r.color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
export function DashboardCharts({
  data,
  onNavigate,
}: {
  data: DashboardData;
  onNavigate: (t: 'articles' | 'questions' | 'feedback') => void;
}) {
  const labels: Record<string, string> = {
    published: 'منشور',
    review: 'بانتظار المراجعة',
    draft: 'مسودة',
    archived: 'مؤرشف',
  };
  const colors: Record<string, string> = {
    published: 'var(--purple)',
    review: 'var(--blue)',
    draft: '#aaa3c9',
    archived: '#9297a8',
  };
  return (
    <div className="dashboard-charts">
      <section className="dashboard-chart">
        <header>
          <div>
            <ChartNoAxesCombined size={19} />
            <h2>حالات المحتوى</h2>
          </div>
          <button className="chart-link" onClick={() => onNavigate('articles')}>
            المكتبة ←
          </button>
        </header>
        <p className="chart-description">حالة واحدة لكل شرح في دورة التحرير</p>
        <Bars
          label="عدد الشروحات حسب حالة التحرير"
          rows={['published', 'review', 'draft', 'archived'].map((id) => ({
            id,
            label: labels[id],
            value: data.workflow.find((r) => r.status === id)?.count || 0,
            color: colors[id],
          }))}
          empty="لسه مفيش محتوى مسجل."
        />
        <p className="chart-footnote">
          تعديل شرح منشور يبدأ مسودة؛ نسخته السابقة تفضل متاحة لحد النشر.
        </p>
      </section>
      <section className="dashboard-chart">
        <header>
          <div>
            <MessageSquareText size={19} />
            <h2>صوت العملاء</h2>
          </div>
          <button className="chart-link" onClick={() => onNavigate('feedback')}>
            الملاحظات ←
          </button>
        </header>
        <p className="chart-description">التقييمات المسجلة طوال فترة الاستخدام</p>
        <Bars
          label="تقييمات العملاء للشرح"
          rows={[
            { id: 'yes', label: 'الشرح واضح', value: data.feedback.yes, color: 'var(--green)' },
            { id: 'no', label: 'محتاج توضيح', value: data.feedback.no, color: 'var(--purple)' },
          ]}
          empty="التقييمات هتظهر هنا أول ما العملاء يشاركوا رأيهم."
        />
        <div className="chart-followup">
          <span>ملاحظات محتاجة متابعة</span>
          <strong>{number(data.feedback.needs_attention)}</strong>
        </div>
        <p className="chart-footnote">التقييمات تعبر عن رأي العملاء؛ مش قياسًا لعدد الزيارات.</p>
      </section>
      <section className="dashboard-chart chart-wide">
        <header>
          <div>
            <Repeat2 size={19} />
            <h2>أولويات الشرح</h2>
          </div>
          <button className="chart-link" onClick={() => onNavigate('questions')}>
            متابعة الأسئلة ←
          </button>
        </header>
        <p className="chart-description">أكثر ٥ أسئلة مفتوحة تكرارًا حسب تسجيل الفريق</p>
        <Bars
          label="عدد مرات تكرار الأسئلة المفتوحة"
          rows={data.questions.map((r) => ({
            id: r.id,
            label: r.question,
            value: r.frequency,
            color: 'var(--purple)',
          }))}
          empty="مفيش أسئلة مفتوحة حاليًا. سجّل السؤال المتكرر عشان تحدد أولويات المحتوى."
        />
      </section>
    </div>
  );
}
