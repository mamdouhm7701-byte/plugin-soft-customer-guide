'use client';
import { useState } from 'react';
import { ROLE_LABELS, type StaffUser, type Role } from '@/lib/guide-model';
import { CopyButton } from '@/components/guide/common';
import { api, useResource, explain } from './api';
export function StaffManager() {
  const r = useResource<{ members: (StaffUser & { hasPassword: number })[] }>('staff'),
    [email, setEmail] = useState(''),
    [name, setName] = useState(''),
    [role, setRole] = useState<Role>('support'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [activation, setActivation] = useState('');
  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setActivation('');
    try {
      const result = await api<{ activationPath: string }>('staff/invitations', {
        method: 'POST',
        body: JSON.stringify({ email, displayName: name, role }),
      });
      setActivation(location.origin + result.activationPath);
      setEmail('');
      setName('');
      r.reload();
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  }
  async function change(member: StaffUser, patch: { role?: Role; active?: boolean }) {
    setBusy(true);
    setError('');
    try {
      await api('staff/' + member.userId, {
        method: 'PUT',
        body: JSON.stringify({
          role: patch.role || member.role,
          active: patch.active ?? !!member.active,
        }),
      });
      r.reload();
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  }
  async function reset(member: StaffUser) {
    if (!confirm('رابط جديد هيقفل جلسات العضو ويلغي الرابط السابق. تكمّل؟')) return;
    setBusy(true);
    setError('');
    setActivation('');
    try {
      const result = await api<{ activationPath: string }>('staff/activation/' + member.userId, {
        method: 'POST',
        body: '{}',
      });
      setActivation(location.origin + result.activationPath);
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h2>الفريق والصلاحيات</h2>
      <p>
        دخول مستقل بالبريد وكلمة سر. المسؤول ينشئ الحساب ويرسل رابط التفعيل بنفسه، ومفيش تسجيل عام.
      </p>
      <form className="panel form-grid" onSubmit={invite}>
        <label>
          اسم العضو
          <input
            required
            minLength={2}
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          بريد الفريق
          <input
            type="email"
            required
            dir="ltr"
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          الدور
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {(['support', 'editor', 'reviewer'] as const).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
        <button className="button primary" disabled={busy}>
          إنشاء حساب ورابط تفعيل
        </button>
      </form>
      {error && (
        <p className="error-line" role="alert">
          {error}
        </p>
      )}
      {activation && (
        <div className="panel">
          <h3>رابط تفعيل خاص · ٢٤ ساعة · مرة واحدة</h3>
          <p>
            ابعت الرابط للعضو بقناة خاصة. اللي معاه الرابط يقدر يعيّن كلمة سر الحساب. لم يُرسل بريد
            تلقائي.
          </p>
          <input readOnly dir="ltr" value={activation} aria-label="رابط التفعيل الخاص" />
          <CopyButton
            className="button secondary"
            text={() => activation}
            label="نسخ رابط التفعيل"
          />
          <button className="button ghost" onClick={() => setActivation('')}>
            إخفاء الرابط
          </button>
        </div>
      )}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>العضو</th>
              <th>الدور</th>
              <th>الحالة</th>
              <th>الدخول</th>
            </tr>
          </thead>
          <tbody>
            {r.data?.members.map((m) => (
              <tr key={m.userId}>
                <td>
                  {m.displayName}
                  <small>{m.email}</small>
                </td>
                <td>
                  {m.role === 'owner' ? (
                    ROLE_LABELS.owner
                  ) : (
                    <select
                      disabled={busy}
                      value={m.role}
                      onChange={(e) => change(m, { role: e.target.value as Role })}
                    >
                      {(['support', 'editor', 'reviewer'] as const).map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td>{!m.active ? 'موقوف' : m.hasPassword ? 'نشط' : 'بانتظار تعيين كلمة السر'}</td>
                <td>
                  <div className="inline-actions">
                    {m.active && (
                      <button
                        className="button secondary small"
                        disabled={busy}
                        onClick={() => reset(m)}
                      >
                        تفعيل / إعادة تعيين
                      </button>
                    )}
                    {m.role !== 'owner' && (
                      <button
                        className="button secondary small"
                        disabled={busy}
                        onClick={() => {
                          if (confirm('تغيير الحالة يقفل الجلسات ويلغي روابط التفعيل. تكمّل؟'))
                            change(m, { active: !m.active });
                        }}
                      >
                        {m.active ? 'إيقاف' : 'إعادة تفعيل'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="soft-note">
        الدعم: المنشور والردود وأدلة النشاط. المحرر: المسودات والصور دون نشر. المراجع: النشر
        والتصدير. المسؤول: إدارة الفريق. تغيير الدور يقفل جلسات العضو. استرداد دخول المسؤول يحتاج
        إجراء تشغيل آمن.
      </p>
    </section>
  );
}
