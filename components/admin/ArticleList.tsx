'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ExternalLink,
  Search,
  X,
  SlidersHorizontal,
  FileText,
  MoreHorizontal,
  ShieldCheck,
  ArrowUpLeft,
} from 'lucide-react';
import {
  ACTIVITIES,
  MODULES,
  canEdit,
  canPublish,
  matchesSearch,
  activityName,
  moduleName,
  type StaffUser,
  type ArticleSummary,
  type Article,
} from '@/lib/guide-model';
import { CopyButton, shortDate } from '@/components/guide/common';
import { api, useResource, explain } from './api';
import { ContentReadiness } from './ContentReadiness';
import { CatalogCoverage } from './CatalogCoverage';
import { ContentExport } from './ContentExport';
import { WhatsAppShare } from './WhatsAppShare';
const statusNames: Record<string, string> = {
  draft: 'مسودة',
  review: 'بانتظار المراجعة',
  published: 'منشور',
  archived: 'مؤرشف',
};
type AdminSummary = ArticleSummary & {
  status: string;
  archived: boolean;
  hasPublished: boolean;
  publishedRevision: number | null;
  updatedAt: string;
};
export function ArticleList({
  user,
  onEdit,
  initialQuery = '',
}: {
  user: StaffUser;
  onEdit: (id: string) => void;
  initialQuery?: string;
}) {
  const r = useResource<{ articles: AdminSummary[]; limit: number }>('articles'),
    [q, setQ] = useState(initialQuery),
    [status, setStatus] = useState('all'),
    [activity, setActivity] = useState('all'),
    [module, setModule] = useState('all'),
    [imagesOnly, setImagesOnly] = useState(false),
    [shown, setShown] = useState(30),
    [filtersOpen, setFiltersOpen] = useState(false),
    [reply, setReply] = useState<Article | null>(null),
    [replyError, setReplyError] = useState(''),
    [customerPath, setCustomerPath] = useState(''),
    [makingLink, setMakingLink] = useState(false),
    [loadingCatalog, setLoadingCatalog] = useState(false),
    [catalogMessage, setCatalogMessage] = useState(''),
    dialog = useRef<HTMLDialogElement>(null),
    replyRequest = useRef<AbortController | null>(null);
  useEffect(() => () => replyRequest.current?.abort(), []);
  const list = (r.data?.articles || []).filter(
    (a) =>
      matchesSearch(a, q) &&
      (status === 'all' || a.status === status) &&
      (activity === 'all' || a.activities.includes('all') || a.activities.includes(activity)) &&
      (module === 'all' || a.module === module) &&
      (!imagesOnly || !!a.image),
  );
  async function importCatalog() {
    setLoadingCatalog(true);
    setCatalogMessage('');
    try {
      const result = await api<{ inserted: number; skipped: number; total: number }>('catalog', {
        method: 'POST',
        body: '{}',
      });
      setCatalogMessage(
        `تمت إضافة ${result.inserted} إجابة كمسودات، و${result.skipped} موجودة بالفعل. الإجمالي ${result.total}. الصور والتحقق مطلوبان قبل النشر.`,
      );
      r.reload();
    } catch (e) {
      setCatalogMessage(explain(e));
    } finally {
      setLoadingCatalog(false);
    }
  }
  async function openReply(id: string) {
    replyRequest.current?.abort();
    const request = new AbortController();
    replyRequest.current = request;
    setReply(null);
    setCustomerPath('');
    setMakingLink(true);
    setReplyError('');
    dialog.current?.showModal();
    try {
      const response = await fetch('/api/articles/' + id, {
        signal: request.signal,
        cache: 'no-store',
      });
      const d = (await response.json()) as Article & { error?: string };
      if (!response.ok) throw Error(d.error);
      if (!request.signal.aborted) setReply(d);
      const result = await api<{ path: string }>('replies', {
        method: 'POST',
        signal: request.signal,
        body: JSON.stringify({ articleId: id }),
      });
      if (!request.signal.aborted) setCustomerPath(result.path);
    } catch (e) {
      if (!request.signal.aborted) setReplyError(explain(e));
    } finally {
      if (!request.signal.aborted) setMakingLink(false);
    }
  }

  const filterCount =
    Number(status !== 'all') +
    Number(activity !== 'all') +
    Number(module !== 'all') +
    Number(imagesOnly);
  function clearFilters() {
    setStatus('all');
    setActivity('all');
    setModule('all');
    setImagesOnly(false);
    setShown(30);
  }
  function closeReply() {
    replyRequest.current?.abort();
    dialog.current?.close();
  }
  return (
    <section className="answer-workspace">
      <div className="section-title">
        <div>
          <h2>مكتبة الإجابات</h2>
          <p className="muted">دَوّر على السؤال، راجع الإجابة، وشارك رابطها في لحظات.</p>
        </div>
        {canPublish(user.role) && (
          <details className="library-tools">
            <summary>أدوات المحتوى والتصدير</summary>
            <div className="inline-actions">
              <button
                className="button primary small"
                disabled={loadingCatalog}
                onClick={importCatalog}
              >
                {loadingCatalog ? 'جارٍ تحميل الحزمة…' : 'إضافة كل الأسئلة المتاحة'}
              </button>
              <ContentExport />
            </div>
          </details>
        )}
      </div>
      {catalogMessage && (
        <p className="inline-message" role="status">
          {catalogMessage}
        </p>
      )}
      <div className="answer-searchline">
        <label className="search-control">
          <Search size={18} />
          <input
            type="search"
            aria-label="البحث في مكتبة الفريق"
            placeholder="دَوّر بصياغة السؤال أو الكود…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setShown(30);
            }}
          />
        </label>
        <button
          type="button"
          className="button secondary filter-toggle"
          aria-expanded={filtersOpen}
          aria-controls="answer-filters"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <SlidersHorizontal size={17} />
          تصفية {filterCount > 0 && <span className="filter-count">{filterCount}</span>}
        </button>
      </div>
      <div id="answer-filters" className="answer-filterpanel" hidden={!filtersOpen}>
        <select
          aria-label="حالة الشرح"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setShown(30);
          }}
        >
          <option value="all">كل الحالات</option>
          {Object.entries(statusNames).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          aria-label="نشاط الشرح"
          value={activity}
          onChange={(e) => {
            setActivity(e.target.value);
            setShown(30);
          }}
        >
          <option value="all">كل الأنشطة</option>
          {ACTIVITIES.map((a) => (
            <option value={a.id} key={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          aria-label="قسم الشرح"
          value={module}
          onChange={(e) => {
            setModule(e.target.value);
            setShown(30);
          }}
        >
          <option value="all">كل الأقسام</option>
          {MODULES.map((m) => (
            <option value={m.id} key={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <label>
          <input
            type="checkbox"
            checked={imagesOnly}
            onChange={(e) => {
              setImagesOnly(e.target.checked);
              setShown(30);
            }}
          />{' '}
          بصور فعلية
        </label>
        <button className="button ghost small" onClick={clearFilters}>
          مسح الفلاتر
        </button>
      </div>
      {filterCount > 0 && !filtersOpen && (
        <div className="answer-active-filter">
          <span>التصفية مفعّلة · {filterCount} اختيارات</span>
          <button className="chart-link" onClick={clearFilters}>
            مسح الفلاتر
          </button>
        </div>
      )}
      {r.error && (
        <p className="error-line" role="alert">
          {r.error}
        </p>
      )}
      <p className="list-count" role="status">
        {list.length} شروحات
        {r.data && r.data.articles.length >= r.data.limit ? ' · معروض أحدث ١٠٠٠ شرح' : ''}
      </p>
      {r.loading ? (
        <p>جارٍ تحميل الشروحات…</p>
      ) : (
        <div className="answer-list">
          {list.slice(0, shown).map((a) => (
            <article className="answer-row" key={a.id} data-article-id={a.id}>
              <span className="answer-file" aria-hidden="true">
                <FileText size={20} />
              </span>
              <div className="answer-row-body">
                <h3>{a.title || 'مسودة بدون عنوان'}</h3>
                <p className="answer-summary">{a.summary}</p>
                <div className="answer-row-meta">
                  <span>{moduleName(a.module)}</span>
                  <span>{a.stepCount} خطوات</span>
                  <bdi>{a.code}</bdi>
                  <span className={'status-tag ' + a.status}>
                    {statusNames[a.status] || a.status}
                  </span>
                </div>
                {a.hasPublished && a.status !== 'published' && !a.archived && (
                  <small className="muted">نسخة منشورة سابقة ما زالت متاحة للعميل</small>
                )}
              </div>
              <div className="answer-row-actions">
                {a.hasPublished && !a.archived ? (
                  <button
                    className="button primary small"
                    data-hint="يفتح الرسالة ورابط الإجابة المستقل؛ اختار واتساب أو النسخ."
                    onClick={() => openReply(a.id)}
                  >
                    <ArrowUpLeft size={15} />
                    مشاركة الإجابة
                  </button>
                ) : (
                  canEdit(user.role) && (
                    <button className="button secondary small" onClick={() => onEdit(a.id)}>
                      استكمال الشرح
                    </button>
                  )
                )}
                <details className="answer-row-more">
                  <summary aria-label={'إجراءات ' + a.title}>
                    <MoreHorizontal size={19} />
                  </summary>
                  <div className="answer-more-menu">
                    {a.hasPublished && !a.archived && (
                      <a href={'/help/' + a.id} target="_blank" rel="noreferrer">
                        <ExternalLink size={14} />
                        معاينة الشرح
                      </a>
                    )}
                    {canEdit(user.role) && (
                      <button onClick={() => onEdit(a.id)}>تحرير / مراجعة</button>
                    )}
                    <span>آخر تعديل {shortDate(a.updatedAt)}</span>
                    <span>
                      {a.activities.includes('all')
                        ? 'كل الأنشطة'
                        : a.activities.map(activityName).join('، ')}
                    </span>
                  </div>
                </details>
              </div>
            </article>
          ))}
          {!list.length && (
            <div className="empty-state compact">
              <Search size={28} />
              <h3>مفيش شروحات مطابقة</h3>
              <p>جرّب صياغة أبسط للسؤال أو امسح الفلاتر.</p>
              {filterCount > 0 && (
                <button className="button secondary small" onClick={clearFilters}>
                  مسح الفلاتر
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {list.length > shown && (
        <button className="button secondary" onClick={() => setShown((v) => v + 30)}>
          عرض المزيد
        </button>
      )}
      {canEdit(user.role) && (
        <details className="library-review-tools">
          <summary>
            الجاهزية وتغطية الشروحات <span>للمراجعة والتحرير</span>
          </summary>
          <ContentReadiness onEdit={onEdit} />
          <CatalogCoverage onEdit={onEdit} />
        </details>
      )}{' '}
      <dialog
        ref={dialog}
        className="reply-dialog modern-reply"
        onCancel={() => replyRequest.current?.abort()}
        onClose={() => replyRequest.current?.abort()}
      >
        <div className="dialog-heading">
          <h2>مشاركة الإجابة</h2>
          <button className="icon-button" aria-label="إغلاق الرد" onClick={closeReply}>
            <X size={19} />
          </button>
        </div>
        {replyError && !reply ? (
          <p className="error-line">{replyError}</p>
        ) : reply ? (
          <>
            <h3>{reply.content.title}</h3>
            {replyError && (
              <p className="error-line" role="alert">
                {replyError}
              </p>
            )}
            <p className="reply-intro">الرسالة جاهزة ومعاها رابط الإجابة الواحدة.</p>
            {makingLink && <p role="status">جارٍ تجهيز الرابط تلقائيًا…</p>}
            {!makingLink && !customerPath && (
              <button className="button secondary small" onClick={() => openReply(reply.id)}>
                إعادة تجهيز الرابط
              </button>
            )}
            <textarea
              aria-label="نص الرد والرابط الجاهز للمشاركة"
              className="reply-text"
              readOnly
              rows={5}
              value={
                reply.content.reply +
                (customerPath
                  ? '\n' + (typeof window === 'undefined' ? '' : location.origin) + customerPath
                  : '')
              }
            />
            <div className="reply-main-actions">
              {customerPath ? (
                <>
                  <WhatsAppShare
                    primary
                    text={() => reply.content.reply + '\n' + location.origin + customerPath}
                  />
                  <CopyButton
                    label="نسخ الرد والرابط"
                    hint="ينسخ نص الرد ورابط الإجابة فقط؛ العميل يفتحه من غير تسجيل دخول ومن غير الوصول لباقي الدليل."
                    className="button secondary"
                    text={() => reply.content.reply + '\n' + location.origin + customerPath}
                  />
                </>
              ) : (
                <CopyButton label="نسخ الرد فقط" text={reply.content.reply} />
              )}
            </div>
            <p className="reply-scope">
              <ShieldCheck size={15} />
              يفتح الإجابة دي بس، من غير باقي المكتبة.
            </p>
            {customerPath && (
              <details className="reply-extra">
                <summary>خيارات أخرى</summary>
                <div className="inline-actions">
                  {' '}
                  <CopyButton
                    text={() => location.origin + customerPath}
                    hint="ينسخ رابط الإجابة الواحدة من غير نص الرد؛ ما بيديش وصول لباقي الدليل."
                  />
                  <a
                    className="button secondary small"
                    href={customerPath}
                    target="_blank"
                    rel="noreferrer"
                  >
                    فتح رابط العميل
                  </a>
                </div>
              </details>
            )}
            <p className="reply-footnote">اختار المحادثة وراجع الرسالة قبل الإرسال في واتساب.</p>
          </>
        ) : (
          <p>جارٍ تحميل الرد المنشور…</p>
        )}
      </dialog>
    </section>
  );
}
