'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
export function TeamLogin({ activate = false }: { activate?: boolean }) {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [done, setDone] = useState(false);
  const activationToken = useRef('');
  useEffect(() => {
    if (activate) {
      const candidate = new URLSearchParams(location.hash.slice(1)).get('token');
      if (candidate) activationToken.current = candidate;
      history.replaceState(null, '', location.pathname);
    }
  }, [activate]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (activate && !activationToken.current) {
      setError('افتح رابط التفعيل كاملًا اللي وصلك من المسؤول.');
      return;
    }
    if (activate && password !== confirm) {
      setError('كلمتا السر مش متطابقتين.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/team/' + (activate ? 'activate' : 'login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          activate ? { token: activationToken.current, password } : { email, password },
        ),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw Error(data.error || 'تعذر تسجيل الدخول.');
      setPassword('');
      if (activate) {
        setDone(true);
        activationToken.current = '';
      } else location.assign('/admin');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر الاتصال.');
    } finally {
      setBusy(false);
    }
  }
  if (done)
    return (
      <div className="panel">
        <h2>اتحفظت كلمة السر</h2>
        <p>سجّل الدخول ببريد الفريق وكلمة السر الجديدة. الجلسات القديمة اتقفلت.</p>
        <a className="button primary" href="/team/login">
          تسجيل الدخول
        </a>
      </div>
    );
  return (
    <form className="panel" onSubmit={submit}>
      <h1>{activate ? 'تفعيل حساب الفريق' : 'دخول فريق التدريب والدعم'}</h1>
      <p>
        {activate
          ? 'الرابط صالح لمدة ٢٤ ساعة ولمرة واحدة. اختار كلمة سر طويلة وخاصة بحسابك.'
          : 'الصفحة دي للفريق المضاف من المسؤول. العميل يفتح دليل نشاطه مباشرة من غير حساب.'}
      </p>
      {!activate && (
        <label>
          البريد الإلكتروني
          <input
            type="email"
            autoComplete="username"
            dir="ltr"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
      )}
      <label>
        كلمة السر
        <input
          type="password"
          autoComplete={activate ? 'new-password' : 'current-password'}
          minLength={activate ? 12 : 1}
          maxLength={128}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {activate && (
        <label>
          تأكيد كلمة السر
          <input
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>
      )}
      {error && (
        <p className="error-line" role="alert">
          {error}
        </p>
      )}
      <button className="button primary" style={{ marginTop: 20 }} disabled={busy}>
        {busy ? 'جارٍ التنفيذ…' : activate ? 'تعيين كلمة السر' : 'دخول الفريق'}
      </button>
      {!activate && (
        <p className="muted">
          نسيت كلمة السر؟ اطلب رابط إعادة تعيين من مسؤول الفريق. مفيش تسجيل حساب عام أو إرسال بريد
          تلقائي.
        </p>
      )}
      <p>
        <Link href="/">فتح دليل العميل</Link>
      </p>
    </form>
  );
}
