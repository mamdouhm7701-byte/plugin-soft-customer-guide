'use client';
import { FileDown, ArrowRight } from 'lucide-react';
import { type Article, activityName, imageSrc } from '@/lib/guide-model';
import { Brand, shortDate } from './common';
import { beforeStartMode } from '@/lib/before-start';
export function PrintGuide({
  articles,
  title,
  activity,
  generatedAt,
  back = '/',
  welcome = '',
}: {
  articles: Article[];
  title: string;
  activity: string;
  generatedAt: string;
  back?: string;
  welcome?: string;
}) {
  const guideId = /^\/guides\/([a-f0-9-]{36})$/i.exec(back)?.[1];
  const replyToken = back.startsWith('/help/')
    ? new URL(back, 'https://guide.invalid').searchParams.get('reply')
    : null;
  return (
    <div className="print-document">
      <div className="print-toolbar">
        <p>اختَر «حفظ بصيغة PDF» من نافذة الطباعة للاحتفاظ بنسختك.</p>
        <div>
          <button className="button primary" onClick={() => window.print()}>
            <FileDown size={17} />
            طباعة / حفظ PDF
          </button>
          <a className="button secondary" href={back}>
            <ArrowRight size={16} />
            الرجوع للشرح / الدليل
          </a>
        </div>
      </div>
      <section className="print-cover">
        <Brand homeHref={back} />
        <span className="eyebrow">مرجعك بعد التدريب</span>
        <h1>{title}</h1>
        <h2>{activityName(activity)}</h2>
        <p>{welcome || 'خطوات قصيرة وصور فعلية تساعدك ترجع للإجراء في أي وقت.'}</p>
        <div className="print-meta">
          تاريخ تجهيز النسخة: {shortDate(generatedAt)} · {articles.length} شروحات منشورة
        </div>
        <h3>فهرس الدليل</h3>
        <ol>
          {articles.map((a) => (
            <li key={a.id}>
              <a href={'#print-' + a.id}>{a.content.title}</a>
            </li>
          ))}
        </ol>
        <p className="print-scope">
          الملف يعكس النسخ المنشورة وقت فتح هذه الصفحة. راجع رابط كل شرح للوصول لأحدث نسخة. الخطوات
          قد تختلف حسب الإصدار والإعدادات والصلاحيات.
        </p>
      </section>
      {articles.map((a) => (
        <section className="print-article" key={a.id} id={'print-' + a.id}>
          <div className="print-article-intro">
            <Brand compact homeHref={back} />
            <p className="verified-meta">
              {a.code} · النسخة {a.revision} · تحقق {a.content.verifiedAt}
            </p>
            <h1>{a.content.title}</h1>
            <p>{a.content.summary}</p>
            {a.content.scopeNote && <p className="scope-banner">{a.content.scopeNote}</p>}
            {beforeStartMode(a.content) === 'important' && (
              <>
                <h2>قبل ما تبدأ</h2>
                <ul>
                  {a.content.prerequisites.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </>
            )}
            <p className="print-url">
              <a
                href={
                  back.startsWith('/help/')
                    ? back
                    : '/help/' + a.id + (guideId ? '?guide=' + guideId : '')
                }
              >
                افتح الشرح الإلكتروني الأحدث ←
              </a>
            </p>
          </div>
          {a.content.steps.map((s, i) => (
            <div className="print-step" key={i}>
              <h2>
                {i + 1}. {s.title}
              </h2>
              <p>{s.text}</p>
              {s.image && (
                <figure className="print-photo">
                  <img
                    src={
                      imageSrc(s.image) +
                      (replyToken && s.image.kind === 'media'
                        ? '?reply=' + encodeURIComponent(replyToken)
                        : '')
                    }
                    alt={s.caption}
                  />
                  {s.focus && (
                    <span
                      className="photo-mark"
                      style={{
                        left: `${s.focus.x - s.focus.w / 2}%`,
                        top: `${s.focus.y - s.focus.h / 2}%`,
                        width: `${s.focus.w}%`,
                        height: `${s.focus.h}%`,
                      }}
                    />
                  )}
                </figure>
              )}
              <p className="verified-meta">{s.caption}</p>
            </div>
          ))}
          <div className="outcome-box">
            <h2>النتيجة اللي تتأكد منها</h2>
            <p>{a.content.outcome}</p>
          </div>
          {a.content.warnings.map((w, i) => (
            <p key={i} className="warning-note">
              {w}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
