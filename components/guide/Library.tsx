'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Camera,
  FileDown,
  FolderOpen,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  ACTIVITIES,
  MODULES,
  matchesActivity,
  matchesSearch,
  activityName,
  imageSrc,
  type ArticleSummary,
  type GuidePack,
} from '@/lib/guide-model';
import { Header, Footer, Empty, CopyButton, shortDate } from './common';
export function ArticleCard({
  a,
  activity,
  packId,
}: {
  a: ArticleSummary;
  activity: string;
  packId?: string;
}) {
  return (
    <a
      className="article-card"
      href={`/help/${encodeURIComponent(a.id)}?activity=${activity}${packId ? '&guide=' + packId : ''}`}
    >
      <div className="card-visual">
        {a.image ? <img src={imageSrc(a.image)} alt="" loading="lazy" /> : <BookOpen size={40} />}
        <span className="photo-tag">
          <Camera size={12} />
          خطوات مصوّرة
        </span>
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span className="kind-tag">{a.kind}</span>
          <bdi>{a.code}</bdi>
        </div>
        <h3>{a.title}</h3>
        <p>{a.summary.length > 110 ? a.summary.slice(0, 110) + '…' : a.summary}</p>
        <div className="card-bottom">
          <span>
            {a.stepCount} خطوات · تحديث {shortDate(a.publishedAt)}
          </span>
          <ArrowLeft size={17} />
        </div>
      </div>
    </a>
  );
}
export function Library({
  articles,
  initialActivity = 'general',
  pack,
}: {
  articles: ArticleSummary[];
  initialActivity?: string;
  pack?: GuidePack;
}) {
  const [activity, setActivity] = useState(pack?.activity || initialActivity),
    [module, setModule] = useState('all'),
    [query, setQuery] = useState(''),
    [limit, setLimit] = useState(24);
  const filterKey = activity + ':' + module + ':' + query;
  const [lastFilter, setLastFilter] = useState(filterKey);
  if (lastFilter !== filterKey) {
    setLastFilter(filterKey);
    setLimit(24);
  }
  useEffect(() => {
    if (pack) return;
    const p = new URLSearchParams(location.hash.slice(1)),
      old = p.get('article');
    if (old) {
      location.replace(
        '/help/' + encodeURIComponent(old) + '?activity=' + (p.get('activity') || 'general'),
      );
      return;
    }
    if (p.get('page') === 'support') location.replace('/admin');
  }, [pack]);
  const scoped = useMemo(
    () => articles.filter((a) => matchesActivity(a, activity)),
    [articles, activity],
  );
  const visible = scoped.filter(
    (a) => (module === 'all' || a.module === module) && matchesSearch(a, query),
  );
  const presentModules = MODULES.filter((m) => scoped.some((a) => a.module === m.id));
  const printLink = pack
    ? pack.id.startsWith('activity-')
      ? `/guides/activity/${activity}/print`
      : `/guides/${pack.id}/print`
    : `/print?activity=${activity}${module !== 'all' ? '&module=' + module : ''}`;
  const latest = scoped
    .map((a) => a.publishedAt)
    .sort()
    .at(-1);
  return (
    <div className={pack ? 'customer-library' : undefined}>
      <Header
        homeHref={pack && !pack.id.startsWith('activity-') ? '/guides/' + pack.id : '/'}
        customerOnly={!!pack}
      />
      <section className="library-hero">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">
              <span className="tiny-dot" />
              {pack ? 'دليلك بعد انتهاء التدريب' : 'مرجعك بعد التدريب'}
            </div>
            <h1>
              {pack ? (
                pack.title
              ) : (
                <>
                  سؤالك له إجابة.
                  <br />
                  <em>وكل خطوة لها صورة.</em>
                </>
              )}
            </h1>
            <p>
              {pack?.welcome ||
                'ارجع لخطوات شغلك في أي وقت. اختَر نشاطك، وابحث بطريقتك، وشوف الشرح من البرنامج نفسه.'}
            </p>
            <div className="hero-points">
              <span>
                <Camera size={15} />
                صور فعلية
              </span>
              <span>
                <BookOpen size={15} />
                شرح خطوة بخطوة
              </span>
              <span>
                <ShieldCheck size={15} />
                المحتوى المنشور فقط
              </span>
            </div>
          </div>
          <div className="guide-cover">
            <span className="cover-mini">PLUGIN SOFT / CUSTOMER GUIDE</span>
            <div className="cover-symbol">
              <BookOpen size={37} />
            </div>
            <h2>{activityName(activity)}</h2>
            <p>{pack ? 'دليل تسليم مخصص' : 'دليل العميل المصوّر'}</p>
            <div className="cover-meta">
              <span>{scoped.length} شروحات متاحة</span>
              <span>نسخة أولى</span>
            </div>
          </div>
        </div>
      </section>
      <section className="library-search">
        <div className="container search-grid">
          <label className="search-control">
            <Search size={19} />
            <input
              type="search"
              aria-label="ابحث في الدليل"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اكتب سؤالك… مثل: فين البحث عن الصنف؟"
            />
          </label>
          {!pack && (
            <label className="activity-control">
              <span>نشاطك</span>
              <select
                value={activity}
                onChange={(e) => {
                  setActivity(e.target.value);
                  setModule('all');
                  history.replaceState(null, '', '/?activity=' + e.target.value);
                }}
              >
                {ACTIVITIES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <a className="button secondary" href={printLink} target="_blank" rel="noreferrer">
            <FileDown size={16} />
            طباعة / حفظ PDF
          </a>
        </div>
      </section>
      {pack && (
        <div className="container customer-module-picker">
          <label>
            اختار القسم
            <select
              aria-label="القسم في دليل العميل"
              value={module}
              onChange={(e) => setModule(e.target.value)}
            >
              <option value="all">كل الشروحات ({scoped.length})</option>
              {presentModules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({scoped.filter((a) => a.module === m.id).length})
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <div className="container library-layout">
        <aside className="library-sidebar">
          <span className="sidebar-eyebrow">أقسام الدليل</span>
          <nav aria-label="أقسام الدليل">
            <button className={module === 'all' ? 'active' : ''} onClick={() => setModule('all')}>
              <FolderOpen size={17} />
              كل الأسئلة<span>{scoped.length}</span>
            </button>
            {presentModules.map((m) => (
              <button
                key={m.id}
                className={module === m.id ? 'active' : ''}
                onClick={() => setModule(m.id)}
              >
                <BookOpen size={16} />
                {m.name}
                <span>{scoped.filter((a) => a.module === m.id).length}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-card">
            <div className="sidebar-card-icon">
              <FileDown size={22} />
            </div>
            <h3>خلي دليلك معاك</h3>
            <p>افتح نسخة الطباعة، وبعدها اختَر «حفظ بصيغة PDF» من المتصفح.</p>
            <a href={printLink} target="_blank" rel="noreferrer" className="button secondary small">
              فتح نسخة الطباعة
            </a>
          </div>
          {pack && (
            <div className="sidebar-card">
              <h3>رابط دليلك</h3>
              <p>نفس الرابط يوصّلك للشروحات المنشورة الأحدث.</p>
              <CopyButton text={() => location.origin + '/guides/' + pack.id} />
            </div>
          )}
          <p className="sidebar-footnote">
            الخطوات قد تختلف حسب الإصدار والإعدادات والصلاحيات. راجع «قبل ما تبدأ» في كل شرح.
          </p>
        </aside>
        <main className="library-main">
          <div className="section-title">
            <div>
              <span className="eyebrow">{activityName(activity)}</span>
              <h2>{query ? 'نتائج البحث' : 'ابدأ من سؤالك'}</h2>
            </div>
            <span className="result-count" role="status">
              {visible.length} شروحات
            </span>
          </div>
          {activity !== 'general' && (
            <div className="scope-banner">
              المحتوى المتخصص لهذا النشاط بيتجهّز تدريجيًا. المعروض هنا هو الشرح المنشور الذي ينطبق
              على نشاطك فقط.
            </div>
          )}
          {pack && (
            <div className="pack-note">
              دليل تسليم مخصص · تاريخ التجهيز {shortDate(pack.createdAt)} · لا يتضمن بيانات حسابك أو
              مستنداتك.
            </div>
          )}
          {visible.length ? (
            <div className="article-grid">
              {visible.slice(0, limit).map((a) => (
                <ArticleCard
                  key={a.id}
                  a={a}
                  activity={activity}
                  packId={pack?.id.startsWith('activity-') ? undefined : pack?.id}
                />
              ))}
            </div>
          ) : (
            <Empty
              text={
                scoped.length
                  ? 'جرّب كلمة تانية أو اختَر كل الأقسام.'
                  : 'لسه مفيش شروحات منشورة تنطبق على النشاط ده. تقدر ترجع لقناة الدعم المتفق عليها.'
              }
            >
              {query && (
                <button
                  className="button secondary small"
                  onClick={() => {
                    setQuery('');
                    setModule('all');
                  }}
                >
                  مسح البحث
                </button>
              )}
            </Empty>
          )}
          {visible.length > limit && (
            <div className="load-more">
              <p role="status">
                معروض {Math.min(limit, visible.length)} من {visible.length} شرح
              </p>
              <button className="button primary" onClick={() => setLimit((n) => n + 24)}>
                عرض المزيد من الشروحات
              </button>
            </div>
          )}
          <div className="library-meta">
            {latest
              ? 'آخر تحديث للمحتوى: ' + shortDate(latest)
              : 'هيظهر تاريخ التحديث عند نشر أول شرح.'}
            <span>المحتوى بيتوسع مع توثيق كل إجراء</span>
          </div>
        </main>
      </div>
      <Footer customerOnly={!!pack} />
    </div>
  );
}
