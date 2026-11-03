'use client';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, FileDown, Info } from 'lucide-react';
import { type Article, type ArticleSummary, activityName, moduleName } from '@/lib/guide-model';
import { Header, Footer, CopyButton, shortDate } from './common';
import { Photo } from './Photo';
import { Feedback } from './Feedback';
export function ArticleBody({ article, draft = false }: { article: Article; draft?: boolean }) {
  const c = article.content;
  return (
    <div className="article-prose">
      <section className="quick-answer" id="answer">
        <span>الإجابة باختصار</span>
        <p>{c.summary}</p>
      </section>
      {c.scopeNote && (
        <div className="scope-banner">
          <Info size={17} />
          <span>{c.scopeNote}</span>
        </div>
      )}
      {c.prerequisites.length > 0 && (
        <section className="before-section" id="before">
          <h2>قبل ما تبدأ</h2>
          <ul>
            {c.prerequisites.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      )}
      <h2 id="steps">{draft ? 'الخطوات ونقاط المراجعة' : 'الخطوات بالصور'}</h2>
      {c.steps.map((s, i) => (
        <section className="article-step" key={i} id={'step-' + (i + 1)}>
          <div className="step-heading">
            <span className="step-bubble">{i + 1}</span>
            <div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          </div>
          <Photo step={s} n={i + 1} />
        </section>
      ))}
      <section className="outcome-box" id="outcome">
        <h2>
          <CheckCircle2 size={20} />
          النتيجة اللي تتأكد منها
        </h2>
        <p>{c.outcome}</p>
      </section>
      {c.warnings.map((w, i) => (
        <p className="warning-note" key={i}>
          {w}
        </p>
      ))}
      <p className="verified-meta">
        {draft ? (
          `مسودة داخلية · ${c.verifiedAt ? 'تاريخ التحقق المسجل: ' + c.verifiedAt : 'التحقق من التنفيذ والصور لم يكتمل'} · النسخة ${article.revision}`
        ) : (
          <>
            تاريخ التحقق من الشرح: {c.verifiedAt} · النسخة المنشورة {article.revision}
          </>
        )}
      </p>
    </div>
  );
}
export function ArticleView({
  article,
  related,
  activity = 'general',
  packId,
}: {
  article: Article;
  related: ArticleSummary[];
  activity?: string;
  packId?: string;
}) {
  const c = article.content,
    back = packId ? '/guides/' + packId : '/?activity=' + activity;
  return (
    <>
      <Header homeHref={back} customerOnly={!!packId} />
      <div className="container">
        <nav className="breadcrumbs" aria-label="مسار الصفحة">
          <a href={back}>دليل {activityName(activity)}</a>
          <span>‹</span>
          <span>{moduleName(c.module)}</span>
          <span>‹</span>
          <bdi>{article.code}</bdi>
        </nav>
        <div className="article-layout">
          <main className="article-paper">
            <header className="article-header">
              <div className="article-tags">
                <span className="kind-tag">{c.kind}</span>
                <span>{c.steps.length} خطوات</span>
                <span>·</span>
                <span>تحديث {shortDate(article.publishedAt)}</span>
              </div>
              <h1>{c.title}</h1>
              <div className="article-actions">
                <CopyButton
                  className="button primary"
                  text={() =>
                    location.origin +
                    '/help/' +
                    article.id +
                    '?activity=' +
                    activity +
                    (packId ? '&guide=' + packId : '')
                  }
                  label="نسخ رابط الشرح"
                />
                <a
                  className="button secondary"
                  href={'/print?article=' + article.id + (packId ? '&guide=' + packId : '')}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FileDown size={16} />
                  طباعة / حفظ PDF
                </a>
                <a href={back} className="button ghost">
                  <ArrowLeft size={16} />
                  الرجوع للدليل
                </a>
              </div>
            </header>
            <ArticleBody article={article} />
            <Feedback articleId={article.id} />
          </main>
          <aside className="article-aside">
            <section className="aside-box toc">
              <h2>في الشرح ده</h2>
              <a href="#answer">الإجابة المختصرة</a>
              {c.prerequisites.length > 0 && <a href="#before">قبل ما تبدأ</a>}
              {c.steps.map((s, i) => (
                <a href={'#step-' + (i + 1)} key={i}>
                  {i + 1}. {s.title}
                </a>
              ))}
              <a href="#outcome">النتيجة المتوقعة</a>
            </section>
            {related.length > 0 && (
              <section className="aside-box">
                <h2>أسئلة مرتبطة</h2>
                {related.map((a) => (
                  <a
                    className="related-link"
                    key={a.id}
                    href={
                      '/help/' + a.id + '?activity=' + activity + (packId ? '&guide=' + packId : '')
                    }
                  >
                    {a.title}
                    <ArrowLeft size={14} />
                  </a>
                ))}
              </section>
            )}
            <section className="aside-box support-tint">
              <h2>لسه محتاج مساعدة؟</h2>
              <p>
                جهّز اسم الشاشة وخطواتك والنتيجة اللي ظهرت، وابعتهم لقناة الدعم المتفق عليها من غير
                بيانات حساسة.
              </p>
              {!packId && article.id !== 'support-request' && (
                <Link className="button secondary small" href="/help/support-request">
                  إزاي أجهّز سؤالي؟
                </Link>
              )}
            </section>
            <p className="aside-footnote">
              الرابط ده يفتح الشرح فقط. مفيش دخول لبياناتك على البرنامج من خلال الدليل.
            </p>
          </aside>
        </div>
      </div>
      <Footer customerOnly={!!packId} />
    </>
  );
}
