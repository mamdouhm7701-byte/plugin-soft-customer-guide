'use client';
import { useState } from 'react';
import { ThumbsDown, ThumbsUp, CheckCircle2 } from 'lucide-react';
import { ActionHint } from './ActionHint';
export function Feedback({ articleId, replyToken }: { articleId: string; replyToken?: string }) {
  const [vote, setVote] = useState<'yes' | 'no' | ''>(''),
    [comment, setComment] = useState(''),
    [done, setDone] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function send(v: 'yes' | 'no', skipComment = false) {
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          vote: v,
          comment: skipComment || v === 'yes' ? '' : comment,
          replyToken,
        }),
      });
      const d = (await r.json()) as { error?: string };
      if (!r.ok) throw Error(d.error || 'تعذر إرسال التقييم.');
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر إرسال التقييم.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="feedback-panel">
      {done ? (
        <p className="success-line" role="status">
          <CheckCircle2 size={20} />
          شكرًا ليك، تقييمك وصل لفريق الدعم.
        </p>
      ) : (
        <>
          <div className="feedback-question">
            <strong>الشرح وضّح لك الخطوات؟</strong>
            <div>
              <ActionHint text="يسجل إن الشرح واضح ومفيد، من غير ما تكتب تعليق.">
                <button
                  className="button secondary small"
                  disabled={busy}
                  onClick={() => {
                    setVote('yes');
                    send('yes');
                  }}
                >
                  <ThumbsUp size={15} />
                  أيوه، واضح
                </button>
              </ActionHint>
              <ActionHint text="يفتح مكان للتعليق لو حابب توضّح المشكلة؛ تقدر تبعت التقييم من غير تعليق.">
                <button
                  className="button ghost small"
                  disabled={busy}
                  aria-expanded={vote === 'no'}
                  onClick={() => setVote('no')}
                >
                  <ThumbsDown size={15} />
                  لا، محتاج توضيح
                </button>
              </ActionHint>
            </div>
          </div>
          {vote === 'no' && (
            <div className="feedback-form">
              <label>
                إيه اللي محتاج يتوضح؟ (اختياري)
                <textarea
                  rows={3}
                  maxLength={600}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="اكتب الجزء غير الواضح بدون بيانات شخصية أو كلمات مرور."
                />
              </label>
              <button className="button primary small" disabled={busy} onClick={() => send('no')}>
                {busy ? 'جارٍ الإرسال…' : 'إرسال التقييم'}
              </button>
              <button
                className="button ghost small"
                disabled={busy}
                onClick={() => send('no', true)}
              >
                تخطي التعليق وإرسال التقييم
              </button>
            </div>
          )}
          {error && (
            <p className="error-line" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </section>
  );
}
