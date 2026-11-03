'use client';
import { useEffect, useState } from 'react';
import { Plus, MessageCircleQuestion, Repeat2 } from 'lucide-react';
import {
  ACTIVITIES,
  MODULES,
  activityName,
  moduleName,
  matchesActivity,
  type ArticleSummary,
} from '@/lib/guide-model';
import { api, useResource, explain } from './api';
type Question = {
  id: string;
  question: string;
  activity: string;
  module: string;
  source: string;
  status: string;
  frequency: number;
  article_id: string | null;
};
export function Questions() {
  const r = useResource<{ questions: Question[] }>('questions'),
    [open, setOpen] = useState(false),
    [text, setText] = useState(''),
    [activity, setActivity] = useState('general'),
    [module, setModule] = useState('sales'),
    [source, setSource] = useState('support'),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [articles, setArticles] = useState<ArticleSummary[]>([]);
  useEffect(() => {
    fetch('/api/articles')
      .then((x) => x.json())
      .then((x) => setArticles((x as { articles: ArticleSummary[] }).articles))
      .catch(() => {});
  }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('questions', {
        method: 'POST',
        body: JSON.stringify({ question: text, activity, module, source }),
      });
      setText('');
      setOpen(false);
      r.reload();
      setMessage('اتسجّل السؤال في قائمة المحتوى المطلوب.');
    } catch (e) {
      setMessage(explain(e));
    } finally {
      setBusy(false);
    }
  }
  async function act(id: string, action: string, articleId?: string) {
    setBusy(true);
    try {
      await api('questions', { method: 'PUT', body: JSON.stringify({ id, action, articleId }) });
      r.reload();
    } catch (e) {
      setMessage(explain(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <div className="section-title">
        <div>
          <h2>الأسئلة اللي محتاجة شرح</h2>
          <p className="muted">حوّل تكرار السؤال لأولويات محتوى، واربطه بشرح منشور لما يجهز.</p>
        </div>
        <button className="button primary" onClick={() => setOpen(!open)}>
          <Plus size={17} />
          تسجيل سؤال متكرر
        </button>
      </div>
      {open && (
        <form className="panel form-grid" onSubmit={create}>
          <label className="full-width">
            السؤال بدون بيانات تخص العميل
            <textarea
              required
              minLength={8}
              maxLength={500}
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          <label>
            النشاط
            <select value={activity} onChange={(e) => setActivity(e.target.value)}>
              {ACTIVITIES.map((a) => (
                <option value={a.id} key={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            القسم
            <select value={module} onChange={(e) => setModule(e.target.value)}>
              {MODULES.map((a) => (
                <option value={a.id} key={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            مصدر السؤال
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="support">الدعم الفني</option>
              <option value="training">التدريب</option>
            </select>
          </label>
          <div className="field-action">
            <button className="button primary" disabled={busy}>
              تسجيل السؤال
            </button>
          </div>
        </form>
      )}
      {(message || r.error) && (
        <p className="inline-message" role="status">
          {message || r.error}
        </p>
      )}
      {r.data?.questions.length ? (
        <div className="questions-list">
          {r.data.questions.map((q) => (
            <article className="panel" key={q.id}>
              <div className="section-title">
                <h3>{q.question}</h3>
                <span className="frequency">تكرر {q.frequency} مرات</span>
              </div>
              <p className="muted">
                {activityName(q.activity)} · {moduleName(q.module)} ·{' '}
                {q.source === 'training' ? 'من التدريب' : 'من الدعم'}
              </p>
              <div className="inline-actions">
                <button
                  className="button secondary small"
                  disabled={busy}
                  onClick={() => act(q.id, 'repeat')}
                >
                  <Repeat2 size={14} />
                  اتكرر مرة كمان
                </button>
                {q.article_id ? (
                  <>
                    <a
                      className="button secondary small"
                      href={'/help/' + q.article_id}
                      target="_blank"
                      rel="noreferrer"
                    >
                      فتح الشرح المرتبط ↗
                    </a>
                    <button
                      className="button ghost small"
                      disabled={busy}
                      onClick={() => act(q.id, 'reopen')}
                    >
                      إعادة فتح الطلب
                    </button>
                  </>
                ) : (
                  <label className="inline-select">
                    ربط بشرح منشور
                    <select
                      aria-label={'ربط السؤال: ' + q.question}
                      value=""
                      disabled={busy}
                      onChange={(e) => {
                        if (e.target.value) act(q.id, 'link', e.target.value);
                      }}
                    >
                      <option value="">اختر الشرح بعد تجهيزه</option>
                      {articles
                        .filter((a) => matchesActivity(a, q.activity))
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.title}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <MessageCircleQuestion size={32} />
          <h3>سجّل أول سؤال متكرر</h3>
          <p>الموظف يضغط «اتكرر مرة كمان» بدل ما نسجّل نفس السؤال من الأول.</p>
        </div>
      )}
    </section>
  );
}
