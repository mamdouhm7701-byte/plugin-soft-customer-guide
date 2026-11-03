'use client';
import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Search, X } from 'lucide-react';
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
export function ArticleList({ user, onEdit }: { user: StaffUser; onEdit: (id: string) => void }) {
  const r = useResource<{ articles: AdminSummary[]; limit: number }>('articles'),
    [q, setQ] = useState(''),
    [status, setStatus] = useState('all'),
    [activity, setActivity] = useState('all'),
    [module, setModule] = useState('all'),
    [imagesOnly, setImagesOnly] = useState(false),
    [shown, setShown] = useState(30),
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

  return (
    <section>
      <div className="section-title">
        <div>
          <h2>مكتبة الإجابات</h2>
          <p className="muted">رابط واحد لكل شرح. تعديل المسودة لا يغيّر نسخة العميل قبل النشر.</p>
        </div>
        {canPublish(user.role) && (
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
        )}
      </div>
      {canEdit(user.role) && (
        <>
          <ContentReadiness onEdit={onEdit} />
          <CatalogCoverage onEdit={onEdit} />
        </>
      )}{' '}
      {catalogMessage && (
        <p className="inline-message" role="status">
          {catalogMessage}
        </p>
      )}
      <div className="admin-filters">
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
        <select aria-label="حالة الشرح" value={status} onChange={(e) => setStatus(e.target.value)}>
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
          onChange={(e) => setActivity(e.target.value)}
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
      </div>
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
        <div className="table-wrap">
          <table className="data-table articles-table">
            <thead>
              <tr>
                <th>السؤال</th>
                <th>النشاط والقسم</th>
                <th>حالة المسودة</th>
                <th>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {list.slice(0, shown).map((a) => (
                <tr key={a.id}>
                  <td data-label="السؤال">
                    <strong>{a.title || 'مسودة بدون عنوان'}</strong>
                    <small>
                      <bdi>{a.code}</bdi> · {a.stepCount} خطوات · {shortDate(a.updatedAt)}
                    </small>
                  </td>
                  <td data-label="النشاط والقسم">
                    {a.activities.includes('all')
                      ? 'كل الأنشطة'
                      : a.activities.map(activityName).join('، ')}
                    <small>{moduleName(a.module)}</small>
                  </td>
                  <td data-label="حالة الشرح">
                    <span className={'status-tag ' + a.status}>
                      {statusNames[a.status] || a.status}
                    </span>
                    {a.hasPublished && a.status !== 'published' && (
                      <small>نسخة منشورة ما زالت متاحة</small>
                    )}
                  </td>
                  <td data-label="الإجراءات">
                    <div className="table-actions">
                      {canEdit(user.role) && (
                        <button
                          data-hint="يفتح تعديل ومراجعة الشرح؛ نسخة العميل مش بتتغير إلا بعد النشر."
                          className="button secondary small"
                          onClick={() => onEdit(a.id)}
                        >
                          تحرير / مراجعة
                        </button>
                      )}
                      {a.hasPublished && (
                        <>
                          <button
                            data-hint="يفتح الرد ويجهز رابط الإجابة تلقائيًا، من غير اختيار عميل أو دليل تسليم."
                            className="button secondary small"
                            onClick={() => openReply(a.id)}
                          >
                            مشاركة الإجابة
                          </button>

                          <a
                            className="icon-button"
                            href={'/help/' + a.id}
                            target="_blank"
                            rel="noreferrer"
                            data-hint="معاينة الشرح للفريق. لمشاركة إجابة مستقلة للعميل استخدم مشاركة الإجابة."
                            aria-label={'فتح ' + a.title}
                          >
                            <ExternalLink size={16} />
                          </a>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && (
            <div className="empty-state compact">
              <p>لا توجد شروحات مطابقة.</p>
            </div>
          )}
        </div>
      )}
      {list.length > shown && (
        <button className="button secondary" onClick={() => setShown((v) => v + 30)}>
          عرض المزيد
        </button>
      )}
      <dialog ref={dialog} className="reply-dialog">
        <div className="dialog-heading">
          <h2>الرد الجاهز للعميل</h2>
          <button
            className="icon-button"
            aria-label="إغلاق الرد"
            onClick={() => dialog.current?.close()}
          >
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
            <p className="soft-note">
              رابط مستقل للإجابة دي بس؛ مش محتاج عميل أو دليل تسليم، ولا يفتح باقي المكتبة.
            </p>
            {makingLink && <p role="status">جارٍ تجهيز الرابط تلقائيًا…</p>}
            {!makingLink && !customerPath && (
              <button className="button secondary small" onClick={() => openReply(reply.id)}>
                إعادة تجهيز الرابط
              </button>
            )}
            <textarea
              className="reply-text"
              readOnly
              rows={7}
              value={
                reply.content.reply +
                (customerPath
                  ? '\n' + (typeof window === 'undefined' ? '' : location.origin) + customerPath
                  : '')
              }
            />
            <div className="inline-actions">
              {customerPath ? (
                <>
                  <CopyButton
                    label="نسخ الرد والرابط"
                    hint="ينسخ نص الرد ورابط الإجابة فقط؛ العميل يفتحه من غير تسجيل دخول ومن غير الوصول لباقي الدليل."
                    className="button primary"
                    text={() => reply.content.reply + '\n' + location.origin + customerPath}
                  />
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
                </>
              ) : (
                <CopyButton label="نسخ الرد فقط" text={reply.content.reply} />
              )}
            </div>
            <p className="muted">
              انسخ الرد وابعتُه في قناة الدعم. الموقع لا يرسل رسائل للعميل تلقائيًا.
            </p>
          </>
        ) : (
          <p>جارٍ تحميل الرد المنشور…</p>
        )}
      </dialog>
    </section>
  );
}
