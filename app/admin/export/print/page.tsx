import { database, staffPage, draftFromRow } from '@/lib/guide-server';
import { codeFor, moduleName, activityName, imageSrc } from '@/lib/guide-model';
import { notFound } from 'next/navigation';
const exportStatus = (r: { archived: boolean; status: string }) =>
  r.archived
    ? 'مؤرشف'
    : r.status === 'published'
      ? 'منشور'
      : r.status === 'review'
        ? 'بانتظار المراجعة'
        : 'مسودة';
import { ExportPrintButton } from '@/components/admin/ExportPrintButton';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'نسخة محتوى الفريق للطباعة',
  robots: { index: false, follow: false },
};
export default async function ExportPrint() {
  const user = await staffPage();
  if (!user || !['owner', 'reviewer'].includes(user.role)) notFound();
  const rows = await database()
    .prepare('SELECT * FROM guide_articles ORDER BY updated_at DESC,id')
    .all<Record<string, unknown>>();
  const records = rows.results.map(draftFromRow);
  return (
    <main className="print-document" dir="rtl">
      <ExportPrintButton />
      <header className="print-cover">
        <h1>نسخة محتوى التدريب والدعم</h1>
        <p>نسخة داخلية للفريق · {records.length} سؤال وإجابة · تشمل المسودات والمحتوى المؤرشف.</p>
        <p>الحالة موضحة لكل شرح؛ وجوده في الملف لا يعني اعتماده أو إتاحته للعميل.</p>
        <ol>
          {records.map((r) => (
            <li key={r.id}>
              <a href={'#export-' + r.id}>
                {r.content.title} — {exportStatus(r)}
              </a>
            </li>
          ))}
        </ol>
      </header>
      {records.map((r) => (
        <article className="export-article" id={'export-' + r.id} key={r.id}>
          <h1>{r.content.title}</h1>
          <p>
            {codeFor(r.id)} · {exportStatus(r)} · {moduleName(r.content.module)} ·{' '}
            {r.content.activities.map(activityName).join('، ')} · نسخة {r.revision}
          </p>
          <h2>الإجابة المختصرة</h2>
          <p>{r.content.summary}</p>
          <p>{r.content.scopeNote}</p>
          <h2>قبل البداية</h2>
          <ul>
            {r.content.prerequisites.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
          {r.content.steps.map((s, i) => (
            <section key={i}>
              <h2>
                {i + 1}. {s.title}
              </h2>
              <p>{s.text}</p>
              {!s.image && <p>صورة هذه الخطوة لم تُرفق بعد.</p>}
              {s.image && (
                <figure>
                  <img
                    src={imageSrc(s.image)}
                    alt={s.caption}
                    loading="eager"
                    style={{ maxWidth: '100%', maxHeight: '180mm', objectFit: 'contain' }}
                  />
                  <figcaption>{s.caption}</figcaption>
                </figure>
              )}
            </section>
          ))}
          <h2>النتيجة المتوقعة</h2>
          <p>{r.content.outcome}</p>
          <ul>
            {r.content.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
          <h2>الرد الجاهز</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{r.content.reply}</p>
          <p>تاريخ التحقق: {r.content.verifiedAt || 'لم يُستكمل'}</p>
          <details open>
            <summary>ملاحظات التحقق الداخلية</summary>
            <p>{r.content.verificationNote}</p>
          </details>
        </article>
      ))}
      <style>{`@media print{.export-article{break-before:page}.export-article h2{break-after:avoid}.export-article figure{break-inside:avoid}.export-article p{orphans:3;widows:3}}`}</style>
    </main>
  );
}
