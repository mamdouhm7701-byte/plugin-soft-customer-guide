'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  ImagePlus,
  Plus,
  Save,
  Send,
  Undo2,
  X,
  Archive,
  History,
  RotateCcw,
} from 'lucide-react';
import {
  ACTIVITIES,
  MODULES,
  actionName,
  emptyContent,
  publishIssues,
  canPublish,
  imageSrc,
  type ArticleContent,
  type DraftRecord,
  type StaffUser,
  type Step,
} from '@/lib/guide-model';
import { api, useResource, explain } from './api';
import { similarity } from '@/lib/arabic-search';
import { MediaLibrary } from './MediaLibrary';
import { ArticleBody } from '@/components/guide/ArticleView';
import { shortDate } from '@/components/guide/common';
const lines = (value: string) => value.split('\n');
export function ArticleEditor({
  id,
  user,
  onSaved,
  onDirty,
}: {
  id: string;
  user: StaffUser;
  onSaved: (id: string) => void;
  onDirty: (dirty: boolean) => void;
}) {
  const [record, setRecord] = useState<DraftRecord | null>(null),
    [content, setContent] = useState<ArticleContent>(emptyContent),
    [dirty, setDirty] = useState(false),
    [loading, setLoading] = useState(!!id),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [preview, setPreview] = useState(false),
    [mediaStep, setMediaStep] = useState<number | null>(null),
    [showHistory, setShowHistory] = useState(false),
    [reviewNote, setReviewNote] = useState(''),
    [similarOptions, setSimilarOptions] = useState<{ id: string; title: string; status: string }[]>(
      [],
    ),
    [similarError, setSimilarError] = useState(''),
    [relatedOptions, setRelatedOptions] = useState<{ id: string; title: string }[]>([]);
  const mediaDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    let live = true;
    if (!id) return;
    const controller = new AbortController();
    api<DraftRecord>('articles/' + id, { signal: controller.signal })
      .then((r) => {
        if (live) {
          setRecord(r);
          setContent(r.content);
          setDirty(false);
          onDirty(false);
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
      controller.abort();
    };
  }, [id, onDirty]);
  useEffect(() => {
    if (!dirty) return;
    const before = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', before);
    return () => window.removeEventListener('beforeunload', before);
  }, [dirty]);
  function update(next: ArticleContent) {
    setContent(next);
    setDirty(true);
    onDirty(true);
    setMessage('');
  }
  function field<K extends keyof ArticleContent>(key: K, value: ArticleContent[K]) {
    update({ ...content, [key]: value });
  }
  function step(i: number, patch: Partial<Step>) {
    field(
      'steps',
      content.steps.map((s, n) => (n === i ? { ...s, ...patch } : s)),
    );
  }
  async function save() {
    setBusy(true);
    setError('');
    setMessage('');
    const clean = (v: string[]) => v.map((x) => x.trim()).filter(Boolean);
    const payload = {
      ...content,
      aliases: clean(content.aliases),
      prerequisites: clean(content.prerequisites),
      warnings: clean(content.warnings),
      relatedIds: clean(content.relatedIds),
    };
    try {
      const result = await api<DraftRecord>(record ? 'articles/' + record.id : 'articles', {
        method: record ? 'PUT' : 'POST',
        body: JSON.stringify(
          record ? { revision: record.revision, content: payload } : { content: payload },
        ),
      });
      setRecord(result);
      setContent(result.content);
      setDirty(false);
      onDirty(false);
      setMessage('اتحفظت المسودة. النسخة المنشورة القديمة تظل كما هي.');
      if (!record) onSaved(result.id);
      return result;
    } catch (e) {
      setError(explain(e));
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function transition(action: string, historyId?: string) {
    if (!record) return;
    if (dirty) {
      setError('احفظ تعديلاتك أولًا قبل تغيير الحالة.');
      return;
    }
    if (
      action === 'archive' &&
      !window.confirm('إيقاف نشر الشرح هيخفيه وصوره الخاصة عن العملاء. تكمّل؟')
    )
      return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const r = await api<DraftRecord>('articles/' + record.id + '/transition', {
        method: 'POST',
        body: JSON.stringify({ revision: record.revision, action, note: reviewNote, historyId }),
      });
      setRecord(r);
      setContent(r.content);
      setReviewNote('');
      setMessage(
        action === 'publish'
          ? 'اتنشرت النسخة الجديدة على نفس رابط الشرح.'
          : action === 'archive'
            ? 'تم إيقاف النشر. المحتوى محفوظ في سجل النسخ.'
            : 'تم تنفيذ الإجراء وحفظه في سجل النسخ.',
      );
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    fetch('/api/articles')
      .then((r) => r.json())
      .then((d) =>
        setRelatedOptions((d as { articles: { id: string; title: string }[] }).articles || []),
      )
      .catch(() => {});
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    api<{ articles: { id: string; title: string; status: string }[] }>('articles', {
      signal: controller.signal,
    })
      .then((d) => setSimilarOptions(d.articles))
      .catch(() => {
        if (!controller.signal.aborted)
          setSimilarError('تعذر فحص الشروحات المتشابهة؛ راجع المكتبة قبل الإضافة.');
      });
    return () => controller.abort();
  }, []);
  const issues = publishIssues(content);
  const similar =
    content.title.trim().length >= 6
      ? similarOptions
          .filter((a) => a.id !== id)
          .map((a) => ({ ...a, score: similarity(content.title, a.title) }))
          .filter((a) => a.score >= 0.45)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
      : [];
  if (loading)
    return (
      <div className="panel">
        <p>جارٍ تحميل الشرح…</p>
      </div>
    );
  if (id && !record && !loading)
    return (
      <div className="panel" role="alert">
        <p>{error || 'تعذر تحميل الشرح.'}</p>
        <button className="button secondary" onClick={() => window.location.reload()}>
          إعادة تحميل الشرح
        </button>
      </div>
    );
  return (
    <div className="editor">
      <div className="editor-top">
        <div>
          <span className="eyebrow">{record ? 'تعديل الشرح' : 'شرح جديد'}</span>
          <h2>{content.title || 'اكتب سؤال العميل'}</h2>
          <p className="muted">
            {record
              ? 'النسخة ' +
                record.revision +
                ' · ' +
                (record.status === 'published'
                  ? 'منشور'
                  : record.status === 'review'
                    ? 'بانتظار المراجعة'
                    : record.archived
                      ? 'مؤرشف'
                      : 'مسودة')
              : 'أي محتوى جديد يبدأ مسودة.'}
            {dirty ? ' · فيه تعديلات غير محفوظة' : ''}
          </p>
        </div>
        <div className="inline-actions">
          <button className="button secondary small" onClick={() => setPreview(!preview)}>
            <Eye size={15} />
            {preview ? 'الرجوع للتحرير' : 'معاينة الشرح'}
          </button>
          <button className="button primary" onClick={save} disabled={busy || record?.archived}>
            <Save size={16} />
            {busy ? 'جارٍ التنفيذ…' : 'حفظ المسودة'}
          </button>
        </div>
      </div>
      {error && (
        <p className="error-line" role="alert">
          {error}
        </p>
      )}
      {similarError && <p className="warning-note">{similarError}</p>}
      {!!similar.length && (
        <aside className="panel similar-articles" aria-label="شروحات متشابهة">
          <h3>فيه شروحات قريبة من العنوان ده</h3>
          <p>اقتراحات للمراجعة، مش تأكيد إن المحتوى مكرر. تقدر تكمل الشرح عادي.</p>
          <ul>
            {similar.map((a) => (
              <li key={a.id}>
                <a
                  href={'/admin?tab=editor&id=' + encodeURIComponent(a.id)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {a.title} ↗
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
      {message && (
        <p className="success-line" role="status">
          <CheckCircle2 size={18} />
          {message}
        </p>
      )}
      {record?.reviewNote && <p className="warning-note">ملاحظات المراجع: {record.reviewNote}</p>}
      {record?.publishedRevision && dirty && (
        <p className="soft-note">تعديل المسودة لا يغيّر ما يراه العميل لحد نشر نسخة جديدة.</p>
      )}
      {preview ? (
        <div className="article-paper">
          <h1 className="preview-title">{content.title || 'عنوان الشرح'}</h1>
          <ArticleBody
            draft
            article={{
              id: record?.id || 'preview',
              code: 'معاينة مسودة',
              content,
              publishedAt: new Date().toISOString(),
              revision: record?.revision || 0,
            }}
          />
        </div>
      ) : (
        <>
          <div className="panel form-grid">
            <label className="full-width">
              سؤال العميل / عنوان الشرح
              <input
                maxLength={180}
                value={content.title}
                onChange={(e) => field('title', e.target.value)}
                placeholder="مثال: إزاي أفتح فاتورة مبيعات جديدة؟"
              />
            </label>
            <label>
              القسم
              <select
                value={content.module}
                onChange={(e) => field('module', e.target.value as ArticleContent['module'])}
              >
                {MODULES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              نوع المعرفة
              <select
                value={content.kind}
                onChange={(e) => field('kind', e.target.value as ArticleContent['kind'])}
              >
                {[
                  'خطوات تنفيذ',
                  'تشخيص مشكلة',
                  'شرح مفهوم',
                  'توضيح حسابات',
                  'التواصل مع الدعم',
                ].map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <fieldset className="full-width">
              <legend>ينطبق على أنهي أنشطة؟</legend>
              <div className="check-grid">
                {[{ id: 'all', name: 'كل الأنشطة (بعد التحقق)' }, ...ACTIVITIES].map((a) => (
                  <label className="check-label" key={a.id}>
                    <input
                      type="checkbox"
                      checked={content.activities.includes(a.id as never)}
                      onChange={(e) =>
                        field(
                          'activities',
                          e.target.checked
                            ? [...content.activities, a.id as ArticleContent['activities'][number]]
                            : content.activities.filter((x) => x !== a.id),
                        )
                      }
                    />
                    {a.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="full-width">
              الإجابة المختصرة
              <textarea
                rows={3}
                maxLength={1000}
                value={content.summary}
                onChange={(e) => field('summary', e.target.value)}
              />
            </label>
            <label className="full-width">
              صيغ أخرى للسؤال (كل صيغة في سطر)
              <textarea
                rows={3}
                value={content.aliases.join('\n')}
                onChange={(e) => field('aliases', lines(e.target.value))}
                placeholder="مش لاقي الصنف&#10;المنتج مش ظاهر"
              />
            </label>
            <label className="full-width">
              حدود الشرح والإعدادات المؤثرة
              <textarea
                rows={2}
                maxLength={1200}
                value={content.scopeNote}
                onChange={(e) => field('scopeNote', e.target.value)}
                placeholder="حدّد الإصدار أو الإعداد أو الشاشة التي تحققت منها."
              />
            </label>
            <label className="full-width">
              قبل ما تبدأ (كل شرط في سطر)
              <textarea
                rows={3}
                value={content.prerequisites.join('\n')}
                onChange={(e) => field('prerequisites', lines(e.target.value))}
              />
            </label>
            <label className="full-width">
              عرض متطلبات البداية للعميل
              <select
                value={content.prerequisitesMode || 'details'}
                onChange={(e) =>
                  field('prerequisitesMode', e.target.value as 'important' | 'details' | 'hidden')
                }
              >
                <option value="important">مهمة: تظهر قبل الخطوات</option>
                <option value="details">توضيحات: زر يفتح نافذة عند الحاجة</option>
                <option value="hidden">إخفاء: غير لازمة للعميل</option>
              </select>
              <small>
                أظهر فقط الشروط المؤثرة في التنفيذ؛ الإرشادات العامة مكانها نافذة التوضيح.
              </small>
            </label>
          </div>
          <div className="section-title">
            <h3>الخطوات المصوّرة</h3>
            <button
              className="button secondary small"
              disabled={content.steps.length >= 24}
              onClick={() =>
                field('steps', [
                  ...content.steps,
                  { title: '', text: '', image: null, caption: '', focus: null },
                ])
              }
            >
              <Plus size={15} />
              إضافة خطوة
            </button>
          </div>
          {content.steps.map((s, i) => (
            <section className="panel step-editor" key={i}>
              <div className="section-title">
                <h3>
                  <span className="step-bubble">{i + 1}</span>الخطوة {i + 1}
                </h3>
                <div className="inline-actions">
                  <button
                    className="icon-button"
                    aria-label="تحريك الخطوة لأعلى"
                    disabled={i === 0}
                    onClick={() => {
                      const steps = [...content.steps];
                      [steps[i - 1], steps[i]] = [steps[i], steps[i - 1]];
                      field('steps', steps);
                    }}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label="تحريك الخطوة لأسفل"
                    disabled={i === content.steps.length - 1}
                    onClick={() => {
                      const steps = [...content.steps];
                      [steps[i + 1], steps[i]] = [steps[i], steps[i + 1]];
                      field('steps', steps);
                    }}
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    className="icon-button danger"
                    aria-label="إزالة الخطوة من المسودة"
                    onClick={() => {
                      if (confirm('إزالة الخطوة من المسودة؟'))
                        field(
                          'steps',
                          content.steps.filter((_, n) => n !== i),
                        );
                    }}
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>
              <label>
                عنوان الخطوة
                <input
                  maxLength={160}
                  value={s.title}
                  onChange={(e) => step(i, { title: e.target.value })}
                />
              </label>
              <label>
                شرح الخطوة
                <textarea
                  rows={3}
                  maxLength={1800}
                  value={s.text}
                  onChange={(e) => step(i, { text: e.target.value })}
                />
              </label>
              <button
                className="button secondary small"
                onClick={() => {
                  setMediaStep(i);
                  mediaDialog.current?.showModal();
                }}
              >
                <ImagePlus size={16} />
                {s.image ? 'تغيير الصورة' : 'اختيار / رفع صورة'}
              </button>
              {s.image && (
                <>
                  <div
                    className="annotation-editor"
                    onClick={(e) => {
                      if (!s.focus) return;
                      const bounds = e.currentTarget.getBoundingClientRect();
                      const x = Math.min(
                        100 - s.focus.w / 2,
                        Math.max(s.focus.w / 2, ((e.clientX - bounds.left) / bounds.width) * 100),
                      );
                      const y = Math.min(
                        100 - s.focus.h / 2,
                        Math.max(s.focus.h / 2, ((e.clientY - bounds.top) / bounds.height) * 100),
                      );
                      step(i, {
                        focus: {
                          ...s.focus,
                          x: Math.round(x * 10) / 10,
                          y: Math.round(y * 10) / 10,
                        },
                      });
                    }}
                  >
                    <img src={imageSrc(s.image)} alt={s.caption || 'صورة الخطوة'} />
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
                  </div>
                  <label>
                    وصف الصورة
                    <input
                      maxLength={280}
                      value={s.caption}
                      onChange={(e) => step(i, { caption: e.target.value })}
                    />
                  </label>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={!!s.focus}
                      onChange={(e) =>
                        step(i, { focus: e.target.checked ? { x: 50, y: 50, w: 20, h: 15 } : null })
                      }
                    />
                    تحديد الجزء المهم داخل الصورة
                  </label>
                  {s.focus && (
                    <div className="annotation-controls">
                      {(['x', 'y', 'w', 'h'] as const).map((k) => (
                        <label key={k}>
                          {
                            {
                              x: 'الموضع الأفقي %',
                              y: 'الموضع الرأسي %',
                              w: 'العرض %',
                              h: 'الارتفاع %',
                            }[k]
                          }
                          <input
                            type="number"
                            min={k === 'w' || k === 'h' ? 2 : 0}
                            max={100}
                            value={s.focus![k]}
                            onChange={(e) =>
                              step(i, { focus: { ...s.focus!, [k]: Number(e.target.value) } })
                            }
                          />
                        </label>
                      ))}
                    </div>
                  )}
                  <p className="muted">
                    بعد تفعيل التحديد، اضغط على موضع الخطوة داخل الصورة لتحريكه، أو عدّل النسب.
                    التحديد يفضل داخل حدود الصورة وعلى نفس الموضع في الموبايل.
                  </p>
                </>
              )}
            </section>
          ))}
          <div className="panel form-grid">
            <label className="full-width">
              النتيجة اللي يتأكد منها العميل
              <textarea
                rows={3}
                maxLength={1200}
                value={content.outcome}
                onChange={(e) => field('outcome', e.target.value)}
              />
            </label>
            <label className="full-width">
              ملاحظات مهمة للعميل (كل ملاحظة في سطر)
              <textarea
                rows={3}
                value={content.warnings.join('\n')}
                onChange={(e) => field('warnings', lines(e.target.value))}
              />
            </label>
            <label className="full-width">
              رد جاهز للدعم
              <textarea
                rows={3}
                maxLength={1800}
                value={content.reply}
                onChange={(e) => field('reply', e.target.value)}
                placeholder="الرابط يضاف تلقائيًا عند نسخ الرد من مكتبة الدعم."
              />
            </label>
            <label>
              تاريخ التحقق
              <input
                type="date"
                value={content.verifiedAt}
                onChange={(e) => field('verifiedAt', e.target.value)}
              />
            </label>
            <fieldset className="full-width">
              <legend>شروحات مرتبطة (حتى ٨)</legend>
              <div className="check-grid">
                {relatedOptions
                  .filter((a) => a.id !== record?.id)
                  .map((a) => (
                    <label className="check-label" key={a.id}>
                      <input
                        type="checkbox"
                        checked={content.relatedIds.includes(a.id)}
                        disabled={
                          !content.relatedIds.includes(a.id) && content.relatedIds.length >= 8
                        }
                        onChange={(e) =>
                          field(
                            'relatedIds',
                            e.target.checked
                              ? [...content.relatedIds, a.id]
                              : content.relatedIds.filter((id) => id !== a.id),
                          )
                        }
                      />
                      {a.title}
                    </label>
                  ))}
              </div>
            </fieldset>
            <label className="full-width">
              مصدر التحقق وحدوده (للفريق فقط)
              <textarea
                rows={3}
                maxLength={1500}
                value={content.verificationNote}
                onChange={(e) => field('verificationNote', e.target.value)}
                placeholder="مين تحقق من الخطوات، في أي شاشة وتاريخ، وإيه اللي لم يتم التحقق منه؟"
              />
            </label>
          </div>
        </>
      )}
      <section className="panel workflow-panel">
        <h3>المراجعة والنشر</h3>
        {issues.length > 0 ? (
          <details>
            <summary>ناقص {issues.length} نقاط قبل المراجعة</summary>
            <ul>
              {issues.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </details>
        ) : (
          <p className="success-line">
            <CheckCircle2 size={17} />
            حقول النشر مكتملة. راجع صحة المحتوى والصور قبل الاعتماد.
          </p>
        )}
        <div className="inline-actions">
          {record && !record.archived && (
            <button
              className="button secondary"
              disabled={busy || dirty || issues.length > 0 || record.status === 'review'}
              onClick={() => transition('submit')}
            >
              <Send size={16} />
              إرسال للمراجعة
            </button>
          )}
          {record && canPublish(user.role) && record.status === 'review' && (
            <button
              className="button primary"
              disabled={busy || dirty}
              onClick={() => transition('publish')}
            >
              <CheckCircle2 size={17} />
              اعتماد ونشر النسخة
            </button>
          )}
          {record?.publishedRevision && (
            <a
              className="button ghost"
              target="_blank"
              rel="noreferrer"
              href={'/help/' + record.id}
            >
              فتح المنشور ↗
            </a>
          )}
          {record && (
            <button className="button ghost" onClick={() => setShowHistory(!showHistory)}>
              <History size={16} />
              سجل النسخ
            </button>
          )}
          {record && canPublish(user.role) && (
            <button
              className="button ghost danger"
              disabled={busy || dirty}
              onClick={() => transition(record.archived ? 'unarchive' : 'archive')}
            >
              <Archive size={16} />
              {record.archived ? 'إعادة لمسودة' : 'إيقاف النشر / أرشفة'}
            </button>
          )}
        </div>
        {record && canPublish(user.role) && record.status === 'review' && (
          <div className="review-return">
            <label>
              ملاحظات للمحرر
              <textarea
                rows={2}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                maxLength={1200}
              />
            </label>
            <button
              className="button secondary small"
              disabled={busy || dirty || reviewNote.trim().length < 5}
              onClick={() => transition('return')}
            >
              <Undo2 size={15} />
              إرجاع للمحرر
            </button>
          </div>
        )}
      </section>
      {showHistory && record && (
        <HistoryList
          id={record.id}
          disabled={busy || dirty}
          onRestore={(historyId) => transition('restore', historyId)}
        />
      )}
      <dialog ref={mediaDialog} className="media-dialog">
        <div className="dialog-heading">
          <h2>صورة الخطوة {(mediaStep ?? 0) + 1}</h2>
          <button
            className="icon-button"
            aria-label="إغلاق مكتبة الصور"
            onClick={() => mediaDialog.current?.close()}
          >
            <X size={20} />
          </button>
        </div>
        <MediaLibrary
          onSelect={(choice) => {
            if (mediaStep !== null)
              step(mediaStep, { image: choice.image, caption: choice.caption, focus: null });
            mediaDialog.current?.close();
          }}
        />
      </dialog>
    </div>
  );
}
function HistoryList({
  id,
  disabled,
  onRestore,
}: {
  id: string;
  disabled: boolean;
  onRestore: (historyId: string) => void;
}) {
  const r = useResource<{
    revisions: { id: string; revision: number; action: string; note: string; created_at: string }[];
  }>('articles/' + id + '/history');
  return (
    <section className="panel">
      <h3>سجل النسخ</h3>
      <p className="muted">
        استعادة نسخة قديمة تنشئ مسودة جديدة، ولا تغيّر النسخة المنشورة تلقائيًا.
      </p>
      {r.error && <p className="error-line">{r.error}</p>}
      <div className="history-list">
        {r.data?.revisions.map((v) => (
          <div key={v.id}>
            <span>
              النسخة {v.revision} · {actionName(v.action)}
              <small>
                {shortDate(v.created_at)} {v.note}
              </small>
            </span>
            <button
              className="button secondary small"
              disabled={disabled}
              onClick={() => onRestore(v.id)}
            >
              <RotateCcw size={14} />
              استعادة كمسودة
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
