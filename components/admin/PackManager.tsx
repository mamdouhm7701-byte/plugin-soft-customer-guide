'use client';
import { ActionHint } from '@/components/guide/ActionHint';
import { WhatsAppShare } from './WhatsAppShare';
import { PackWizard } from './PackWizard';
import { useEffect, useMemo, useState } from 'react';
import { Archive, BookOpen, Check, ExternalLink, FileDown, Plus } from 'lucide-react';
import {
  matchesActivity,
  activityName,
  type GuidePack,
  type ArticleSummary,
} from '@/lib/guide-model';
import { api, useResource, explain } from './api';
import { CopyButton, shortDate } from '@/components/guide/common';
const defaultWelcome =
  'أهلًا بيك بعد انتهاء التدريب على Plugin Soft. جمعنالك هنا الشروحات المناسبة لنشاطك، تقدر ترجع لها في أي وقت. ولو احتجت مساعدة، ابعت سؤالك لقناة الدعم المتفق عليها.';
export function PackManager({ onDirty }: { onDirty?: (dirty: boolean) => void }) {
  const r = useResource<{ packs: GuidePack[] }>('packs'),
    [articles, setArticles] = useState<ArticleSummary[]>([]),
    [open, setOpen] = useState(false),
    [editing, setEditing] = useState<GuidePack | null>(null),
    [title, setTitle] = useState('دليلك بعد التدريب'),
    [activity, setActivity] = useState('general'),
    [modules, setModules] = useState(['sales', 'support']),
    [selected, setSelected] = useState<string[]>([]),
    [includeAll, setIncludeAll] = useState(true),
    [welcome, setWelcome] = useState(defaultWelcome),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [saved, setSaved] = useState<GuidePack | null>(null);
  useEffect(() => {
    onDirty?.(open);
    return () => onDirty?.(false);
  }, [open, onDirty]);
  useEffect(() => {
    fetch('/api/articles')
      .then((r) => r.json())
      .then((d) => setArticles((d as { articles: ArticleSummary[] }).articles))
      .catch(() => setError('تعذر تحميل الشروحات المنشورة.'));
  }, []);
  const available = useMemo(
    () => articles.filter((a) => matchesActivity(a, activity) && modules.includes(a.module)),
    [articles, activity, modules],
  );
  const count = includeAll
    ? available.length
    : available.filter((a) => selected.includes(a.id)).length;
  function begin(p: GuidePack | null) {
    if (open && !confirm('فيه دليل مفتوح لسه متحفظش. تبدأ من جديد؟')) return;
    setSaved(null);
    setEditing(p);
    setTitle(p?.title || 'دليلك بعد التدريب');
    setActivity(p?.activity || 'general');
    setModules(p?.modules || ['sales', 'support']);
    setSelected(p?.articleIds || []);
    setIncludeAll(!p?.articleIds.length);
    setWelcome(p?.welcome || defaultWelcome);
    setOpen(true);
    setError('');
    setMessage('');
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api<GuidePack>('packs' + (editing ? '/' + editing.id : ''), {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify({
          title,
          activity,
          modules,
          articleIds: includeAll ? [] : selected,
          welcome,
          ...(editing ? { revision: editing.revision } : {}),
        }),
      });
      setSaved(result);
      setOpen(false);
      setMessage(
        result.archived
          ? 'اتحفظ الدليل الموقوف. فعّل رابطه من بطاقة الدليل لما تكون جاهز للتسليم.'
          : 'اتحفظ دليل التسليم. الرابط ثابت ويعرض النسخ المنشورة الأحدث.',
      );
      r.reload();
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  }
  async function toggle(p: GuidePack) {
    if (
      !confirm(
        p.archived
          ? 'إعادة تفعيل رابط دليل التسليم؟'
          : 'إيقاف رابط دليل التسليم؟ لن يفتحه العميل أثناء الإيقاف.',
      )
    )
      return;
    setBusy(true);
    setError('');
    try {
      await api('packs/' + p.id, {
        method: 'PUT',
        body: JSON.stringify({ revision: p.revision, action: p.archived ? 'activate' : 'archive' }),
      });
      r.reload();
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove(p: GuidePack) {
    if (
      !confirm(
        'حذف دليل العميل نهائيًا؟ الرابط هيتوقف ومش هيقدر يرجع له. الشروحات الأصلية مش هتتحذف.',
      )
    )
      return;
    setBusy(true);
    setError('');
    try {
      await api('packs/' + p.id, {
        method: 'PUT',
        body: JSON.stringify({ revision: p.revision, action: 'delete' }),
      });
      setMessage('اتحذف دليل العميل واتقفل رابطه.');
      r.reload();
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  }
  function handover(p: GuidePack) {
    return (
      'أهلًا بيك، نتمنى يكون التدريب وضّح لك خطوات الشغل على Plugin Soft.\nده دليلك المصوّر لنشاط ' +
      activityName(p.activity) +
      ':\n' +
      location.origin +
      '/guides/' +
      p.id +
      '\nتقدر تبحث في الدليل أو تفتح نسخة الطباعة وتحفظها PDF. ولو احتجت مساعدة، تواصل مع قناة الدعم المتفق عليها.'
    );
  }
  return (
    <section>
      <div className="section-title">
        <div>
          <h2>تسليم العميل بعد التدريب</h2>
          <p className="muted">
            دليل منفصل لكل عميل برابط قابل للإيقاف، يعرض نشاطه وأقسام تدريبه فقط. الرابط بدون حساب؛
            أي شخص معاه الرابط يقدر يفتحه، فلا تضيف بيانات سرية.
          </p>
        </div>
        <button className="button primary" onClick={() => begin(null)}>
          <Plus size={17} />
          دليل تسليم جديد
        </button>
      </div>
      {(error || r.error) && (
        <p className="error-line" role="alert">
          {error || r.error}
        </p>
      )}
      {message && (
        <p className="success-line" role="status">
          <Check size={17} />
          {message}
        </p>
      )}
      {open && (
        <PackWizard
          key={editing?.id || 'new'}
          title={title}
          activity={activity}
          modules={modules}
          selected={selected}
          includeAll={includeAll}
          welcome={welcome}
          available={available}
          articles={articles}
          count={count}
          busy={busy}
          editing={!!editing}
          archived={editing?.archived}
          setTitle={setTitle}
          setActivity={setActivity}
          setModules={setModules}
          setSelected={setSelected}
          setIncludeAll={setIncludeAll}
          setWelcome={setWelcome}
          onSave={save}
          onClose={() => {
            if (confirm('تقفل تجهيز الدليل من غير حفظ؟')) setOpen(false);
          }}
        />
      )}
      {saved && !saved.archived && !open && (
        <section className="panel saved-handover" aria-label="دليل جاهز للتسليم">
          <div>
            <Check size={22} />
            <h3>دليل {saved.title} جاهز للتسليم</h3>
            <p>عاين نسخة العميل الأول، وبعدها ابعت الرابط في قناة التواصل المناسبة.</p>
          </div>
          <div className="inline-actions">
            <a
              className="button primary"
              href={'/guides/' + saved.id}
              target="_blank"
              rel="noreferrer"
            >
              معاينة العميل
            </a>
            <WhatsAppShare text={() => handover(saved)} />
            <CopyButton label="نسخ رسالة التسليم" text={() => handover(saved)} />
          </div>
        </section>
      )}
      {r.loading ? (
        <p className="muted">جارٍ تحميل الأدلة…</p>
      ) : r.data?.packs.length ? (
        <div className="packs-grid">
          {r.data.packs.map((p) => (
            <article className="panel pack-card" key={p.id} data-pack-id={p.id}>
              <div className="section-title">
                <div className="pack-icon">
                  <BookOpen size={23} />
                </div>
                <span className={p.archived ? 'status-tag archived' : 'status-tag published'}>
                  {p.archived ? 'الرابط موقوف' : 'رابط متاح'}
                </span>
              </div>
              <h3>{p.title}</h3>
              <p className="muted">
                {activityName(p.activity)} · تجهيز {shortDate(p.createdAt)}
              </p>
              <div className="pack-actions">
                {!p.archived && (
                  <>
                    <a
                      className="button secondary small"
                      href={'/guides/' + p.id}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink size={14} />
                      معاينة العميل
                    </a>
                    <CopyButton
                      text={() => location.origin + '/guides/' + p.id}
                      hint="ده رابط دليل العميل بكل الشروحات المختارة له. لو هتبعت إجابة واحدة فقط، استخدم مشاركة الإجابة من مكتبة الإجابات."
                    />
                    <CopyButton label="نسخ رسالة التسليم" text={() => handover(p)} />
                    <WhatsAppShare text={() => handover(p)} />
                    <a
                      className="button ghost small"
                      href={'/guides/' + p.id + '/print'}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileDown size={14} />
                      نسخة PDF
                    </a>
                  </>
                )}
                <button className="button ghost small" onClick={() => begin(p)}>
                  تعديل الدليل
                </button>
                <ActionHint
                  text={
                    p.archived
                      ? 'يرجع رابط دليل التسليم للعمل. مشاركة إجابات الدعم مستقلة عنه.'
                      : 'يوقف دليل التسليم فقط؛ روابط إجابات الدعم المستقلة تفضل شغالة. تقدر تفعله تاني.'
                  }
                >
                  <button
                    className="button ghost small danger"
                    disabled={busy}
                    onClick={() => toggle(p)}
                  >
                    <Archive size={14} />
                    {p.archived ? 'تفعيل الرابط' : 'إيقاف الرابط'}
                  </button>
                </ActionHint>
                <ActionHint text="يحذف دليل التسليم بعد التأكيد؛ الشروحات وروابط إجابات الدعم المستقلة تفضل موجودة.">
                  <button
                    className="button ghost small danger"
                    disabled={busy}
                    onClick={() => remove(p)}
                  >
                    حذف الدليل
                  </button>
                </ActionHint>
              </div>
            </article>
          ))}
        </div>
      ) : (
        !open && (
          <div className="empty-state">
            <BookOpen size={32} />
            <h3>جهّز أول دليل تسليم</h3>
            <p>اختَر النشاط والأقسام ثم انسخ رسالة فيها رابط العميل. مفيش رسائل بتتبعت تلقائيًا.</p>
          </div>
        )
      )}
    </section>
  );
}
