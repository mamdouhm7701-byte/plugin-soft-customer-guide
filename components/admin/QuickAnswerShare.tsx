'use client';
import { useState } from 'react';
import { api, explain } from './api';
import { CopyButton } from '@/components/guide/common';
import { WhatsAppShare } from './WhatsAppShare';
export function QuickAnswerShare({ articleId, reply }: { articleId: string; reply: string }) {
  const [path, setPath] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return (
    <div className="panel">
      <strong>إرسال السؤال للعميل</strong>
      <p>رابط مستقل للسؤال ده فقط، بدون ربط بدليل التدريب.</p>
      {!path ? (
        <button
          className="button primary small"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError('');
            try {
              const r = await api<{ path: string }>('replies', {
                method: 'POST',
                body: JSON.stringify({ articleId }),
              });
              setPath(r.path);
            } catch (e) {
              setError(explain(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'جارٍ تجهيز الرد…' : 'تجهيز رابط السؤال'}
        </button>
      ) : (
        <div className="inline-actions">
          <CopyButton label="نسخ الرد والرابط" text={() => reply + '\n' + location.origin + path} />
          <CopyButton label="نسخ رابط السؤال فقط" text={() => location.origin + path} />
          <WhatsAppShare text={() => reply + '\n' + location.origin + path} />
          <a className="button secondary small" href={path} target="_blank" rel="noreferrer">
            معاينة سؤال العميل
          </a>
        </div>
      )}
      {error && (
        <p className="error-line" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
