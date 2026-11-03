'use client';
import { useState } from 'react';
import { ROLE_LABELS, type StaffUser } from '@/lib/guide-model';
export function AccountSettings({ user }: { user: StaffUser }) {
  const [current, setCurrent] = useState(''),
    [next, setNext] = useState(''),
    [confirm, setConfirm] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (next !== confirm) {
      setError('كلمتا السر الجديدتان مش متطابقتين.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/team/password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: current, newPassword: next }),
        }),
        d = (await r.json()) as { error?: string };
      if (!r.ok) throw Error(d.error);
      location.assign('/team/login');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر الاتصال.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h2>حسابي وكلمة السر</h2>
      <p>
        {user.displayName} · {user.email} · {ROLE_LABELS[user.role]}
      </p>
      <form className="panel" style={{ maxWidth: 600 }} onSubmit={save}>
        <h3>تغيير كلمة السر</h3>
        <p>
          التغيير بيقفل كل جلسات حسابك وروابط إعادة التعيين القديمة، وبعدها هتسجّل دخول من جديد.
        </p>
        <label>
          كلمة السر الحالية
          <input
            required
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </label>
        <label>
          كلمة السر الجديدة
          <input
            required
            minLength={12}
            maxLength={128}
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </label>
        <label>
          تأكيد الجديدة
          <input
            required
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>
        {error && (
          <p className="error-line" role="alert">
            {error}
          </p>
        )}
        <button className="button primary" disabled={busy}>
          حفظ وتسجيل الخروج من كل الجلسات
        </button>
      </form>
    </section>
  );
}
