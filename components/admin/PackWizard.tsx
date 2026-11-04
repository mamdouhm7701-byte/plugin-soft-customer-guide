import { useState, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check, Search, Save, X, ShieldCheck } from 'lucide-react';
import {
  ACTIVITIES,
  MODULES,
  activityName,
  moduleName,
  matchesSearch,
  type ArticleSummary,
} from '@/lib/guide-model';
type Props = {
  title: string;
  activity: string;
  modules: string[];
  selected: string[];
  includeAll: boolean;
  welcome: string;
  available: ArticleSummary[];
  articles: ArticleSummary[];
  count: number;
  busy: boolean;
  editing: boolean;
  archived?: boolean;
  setTitle: (v: string) => void;
  setActivity: (v: string) => void;
  setModules: (v: string[]) => void;
  setSelected: (v: string[]) => void;
  setIncludeAll: (v: boolean) => void;
  setWelcome: (v: string) => void;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
};
export function PackWizard(p: Props) {
  const [step, setStep] = useState(1),
    [query, setQuery] = useState(''),
    [onlySelected, setOnlySelected] = useState(false),
    [limit, setLimit] = useState(40),
    [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const chosen = p.includeAll ? p.available : p.available.filter((a) => p.selected.includes(a.id));
  const matching = p.available.filter((a) => matchesSearch(a, query));
  const choices = matching.filter((a) => !onlySelected || p.selected.includes(a.id));
  function titleError() {
    return p.title.trim().length < 4 || p.title.trim().length > 160
      ? 'اكتب اسمًا للدليل من ٤ إلى ١٦٠ حرفًا.'
      : p.welcome.trim().length > 1400
        ? 'رسالة الترحيب بحد أقصى ١٤٠٠ حرف.'
        : '';
  }
  function selectionError() {
    return !p.modules.length
      ? 'اختار قسمًا واحدًا على الأقل.'
      : !p.count
        ? 'اختار شرحًا منشورًا واحدًا على الأقل؛ مينفعش نسلّم دليل فارغ.'
        : '';
  }
  function go(next: number) {
    const issue = next > 1 ? titleError() : '';
    const selection = next > 2 ? selectionError() : '';
    if (issue || selection) {
      setError(issue || selection);
      return;
    }
    setError('');
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 3) {
      go(step + 1);
      return;
    }
    const issue = titleError() || selectionError();
    if (issue) {
      setError(issue);
      return;
    }
    p.onSave(e);
  }
  return (
    <form className="panel pack-form pack-wizard" onSubmit={submit} noValidate>
      <header className="section-title">
        <div>
          <span className="eyebrow">تسليم التدريب</span>
          <h3 ref={heading} tabIndex={-1}>
            {p.editing ? 'تعديل دليل التسليم' : 'جهّز دليل العميل في ٣ خطوات'}
          </h3>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={p.onClose}
          disabled={p.busy}
          aria-label="إغلاق تجهيز الدليل"
        >
          <X size={20} />
        </button>
      </header>
      <ol className="pack-stepper" aria-label="خطوات تجهيز الدليل">
        {['بيانات العميل', 'اختيار الشروحات', 'معاينة وتسليم'].map((label, i) => (
          <li key={label} aria-current={step === i + 1 ? 'step' : undefined}>
            <button type="button" disabled={p.busy || i + 1 > step} onClick={() => go(i + 1)}>
              <span>{i + 1 < step ? <Check size={14} /> : i + 1}</span>
              {label}
            </button>
          </li>
        ))}
      </ol>
      {error && (
        <p className="error-line" role="alert">
          {error}
        </p>
      )}
      <fieldset disabled={p.busy} className="wizard-fieldset">
        {step === 1 && (
          <div className="form-grid wizard-stage">
            <label>
              اسم العميل أو الاسم المختصر للدليل
              <input
                aria-label="اسم دليل التسليم"
                required
                minLength={4}
                maxLength={160}
                value={p.title}
                onChange={(e) => p.setTitle(e.target.value)}
                placeholder="مثال: دليل فريق المبيعات"
              />
              <small>استخدم اسمًا مناسبًا للمشاركة بدون بيانات سرية.</small>
            </label>
            <label>
              النشاط
              <select
                aria-label="نشاط دليل التسليم"
                value={p.activity}
                onChange={(e) => {
                  p.setActivity(e.target.value);
                  p.setSelected([]);
                }}
              >
                {ACTIVITIES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <small>العميل يشوف النشاط ده فقط.</small>
            </label>
            <label className="full-width">
              رسالة الترحيب داخل الدليل
              <textarea
                rows={3}
                maxLength={1400}
                value={p.welcome}
                onChange={(e) => p.setWelcome(e.target.value)}
                aria-label="رسالة ترحيب العميل"
              />
            </label>
          </div>
        )}
        {step === 2 && (
          <div className="wizard-stage">
            <fieldset className="pack-module-picker">
              <legend>الأقسام اللي اتدرب عليها العميل</legend>
              <div className="check-grid">
                {MODULES.map((m) => (
                  <label className="check-label" key={m.id}>
                    <input
                      type="checkbox"
                      checked={p.modules.includes(m.id)}
                      onChange={(e) => {
                        p.setModules(
                          e.target.checked
                            ? [...p.modules, m.id]
                            : p.modules.filter((x) => x !== m.id),
                        );
                        p.setSelected([]);
                      }}
                    />
                    {m.name}
                    <small>
                      (
                      {
                        p.articles.filter(
                          (a) =>
                            a.module === m.id &&
                            a.activities.some((id) => id === 'all' || id === p.activity),
                        ).length
                      }
                      )
                    </small>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="pack-selection-mode">
              <label>
                <input
                  type="radio"
                  name="pack-mode"
                  checked={p.includeAll}
                  onChange={() => p.setIncludeAll(true)}
                />
                كل المنشور المناسب
              </label>
              <label>
                <input
                  type="radio"
                  name="pack-mode"
                  checked={!p.includeAll}
                  onChange={() => p.setIncludeAll(false)}
                />
                شروحات أحددها
              </label>
            </div>
            {p.includeAll ? (
              <p className="soft-note">
                هيضم {p.count} شرحًا مطابقًا للنشاط والأقسام، بما فيها ما يُنشر لاحقًا. لو عايز
                قائمة ثابتة اختار «شروحات أحددها».
              </p>
            ) : (
              <>
                <div className="pack-choice-toolbar">
                  <label className="search-control">
                    <Search size={17} />
                    <input
                      type="search"
                      aria-label="البحث في شروحات التسليم"
                      placeholder="دَوّر على سؤال أو كود…"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setLimit(40);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="button ghost small"
                    onClick={() => p.setSelected([])}
                  >
                    مسح الاختيار
                  </button>
                </div>
                <div className="selection-tools">
                  <button
                    type="button"
                    className="button secondary small"
                    onClick={() =>
                      p.setSelected([...new Set([...p.selected, ...matching.map((a) => a.id)])])
                    }
                  >
                    تحديد نتائج البحث ({matching.length})
                  </button>
                  <button
                    type="button"
                    className="button ghost small"
                    onClick={() => {
                      const ids = new Set(matching.map((a) => a.id));
                      p.setSelected(p.selected.filter((id) => !ids.has(id)));
                    }}
                  >
                    إلغاء تحديد النتائج
                  </button>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={onlySelected}
                      onChange={(e) => {
                        setOnlySelected(e.target.checked);
                        setLimit(40);
                      }}
                    />
                    المختار فقط ({chosen.length})
                  </label>
                  <span role="status">
                    {choices.length} نتيجة · {chosen.length} مختار
                  </span>
                </div>
                <div className="pack-choices">
                  {choices.slice(0, limit).map((a) => (
                    <label className="check-label" key={a.id} data-article-id={a.id}>
                      <input
                        type="checkbox"
                        checked={p.selected.includes(a.id)}
                        onChange={(e) =>
                          p.setSelected(
                            e.target.checked
                              ? [...new Set([...p.selected, a.id])]
                              : p.selected.filter((x) => x !== a.id),
                          )
                        }
                      />
                      <span>
                        {a.title}
                        <small>{a.code}</small>
                      </span>
                    </label>
                  ))}
                </div>
                {!choices.length && (
                  <p className="soft-note">مفيش شروحات مطابقة للفلاتر الحالية.</p>
                )}
                {choices.length > limit && (
                  <button
                    type="button"
                    className="button secondary small"
                    onClick={() => setLimit((n) => n + 40)}
                  >
                    عرض المزيد من الاختيارات
                  </button>
                )}
              </>
            )}
            {!p.count && <p className="warning-note">{selectionError()}</p>}
          </div>
        )}
        {step === 3 && (
          <div className="wizard-stage">
            <div className="handover-preview">
              <span className="eyebrow">معاينة قبل الحفظ</span>
              <h3>{p.title}</h3>
              <p>{p.welcome}</p>
              <dl>
                <div>
                  <dt>النشاط</dt>
                  <dd>{activityName(p.activity)}</dd>
                </div>
                <div>
                  <dt>الشروحات</dt>
                  <dd>{p.count} شرحًا منشورًا</dd>
                </div>
                <div>
                  <dt>الأقسام</dt>
                  <dd>{p.modules.map(moduleName).join('، ')}</dd>
                </div>
                <div>
                  <dt>نوع القائمة</dt>
                  <dd>
                    {p.includeAll
                      ? 'كل المنشور المناسب · تتحدث مع النشر'
                      : 'اختيار محدد · قائمة ثابتة'}
                  </dd>
                </div>
              </dl>
              <details>
                <summary>راجع عناوين الشروحات ({chosen.length})</summary>
                <ul>
                  {chosen.map((a) => (
                    <li key={a.id}>{a.title}</li>
                  ))}
                </ul>
              </details>
            </div>
            <p className="soft-note">
              <ShieldCheck size={16} />
              {p.archived
                ? 'الدليل موقوف؛ الحفظ مش هيفعّل الرابط. فعّله من بطاقة الدليل لما تكون جاهز للتسليم.'
                : 'الرابط هيتجهز بعد الحفظ. هتقدر تعاينه وتبعته بالواتساب أو تنسخ رسالة التسليم.'}
            </p>
          </div>
        )}
      </fieldset>
      <footer className="wizard-footer">
        <span>
          {step} من ٣ {step > 1 ? '· ' + p.count + ' شروحات للعميل' : ''}
        </span>
        <div className="inline-actions">
          {step > 1 && (
            <button
              type="button"
              className="button secondary"
              disabled={p.busy}
              onClick={() => go(step - 1)}
            >
              <ArrowRight size={16} />
              السابق
            </button>
          )}
          <button type="submit" className="button primary" disabled={p.busy}>
            {step === 3 ? <Save size={16} /> : <ArrowLeft size={16} />}{' '}
            {p.busy ? 'جارٍ الحفظ…' : step === 3 ? 'حفظ وتجهيز الرابط' : 'التالي'}
          </button>
        </div>
      </footer>
    </form>
  );
}
