'use client';
import { ACTIVITIES, matchesActivity, type ArticleSummary } from '@/lib/guide-model';
import { CopyButton } from '@/components/guide/common';
import { useResource } from './api';
export function ActivityGuides() {
  const r = useResource<{ articles: (ArticleSummary & { hasPublished: boolean })[] }>('articles');
  return (
    <section>
      <h2>الدليل العام اللي بيتبعت بعد التدريب</h2>
      <p>
        لكل نشاط رابط ثابت من غير حساب للعميل. بيعرض المنشور بس، والتحديثات المعتمدة بتظهر تلقائيًا.
        مفيش أسماء عملاء أو بياناتهم داخل الدليل العام.
      </p>
      {r.error && <p className="error-line">{r.error}</p>}
      <div className="help-grid">
        {ACTIVITIES.map((a) => {
          const count = r.data?.articles.filter(
            (x) => matchesActivity(x, a.id) && x.hasPublished,
          ).length;
          return (
            <article className="panel" key={a.id}>
              <h3>{a.name}</h3>
              <p>{a.description}</p>
              <p>{count ?? '…'} شروحات منشورة مناسبة. المسودات لا تظهر للعميل.</p>
              <div className="inline-actions">
                <a
                  className="button secondary small"
                  href={'/guides/activity/' + a.id}
                  target="_blank"
                  rel="noreferrer"
                >
                  معاينة العميل
                </a>
                <CopyButton
                  className="button secondary small"
                  label="نسخ رابط النشاط"
                  text={() => location.origin + '/guides/activity/' + a.id}
                />
                <a
                  className="button secondary small"
                  href={'/guides/activity/' + a.id + '/print'}
                  target="_blank"
                  rel="noreferrer"
                >
                  PDF للعميل
                </a>
                <CopyButton
                  className="button primary small"
                  label="نسخ رسالة التسليم"
                  text={() =>
                    `أهلًا بيك بعد انتهاء التدريب على Plugin Soft. ده دليل ${a.name} فيه الشروحات المتاحة بالصور، وتقدر ترجع له في أي وقت:\n${location.origin}/guides/activity/${a.id}\nلو خطوة مش واضحة ابعت اسم الشاشة ورسالتها لقناة الدعم المتفق عليها، من غير كلمات سر أو بيانات حساسة.`
                  }
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
