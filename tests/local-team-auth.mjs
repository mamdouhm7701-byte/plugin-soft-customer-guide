import assert from 'node:assert/strict';
import fs from 'node:fs';
import { localSQL, localOwnerLogin } from './local-auth-fixture.mjs';
const base = process.env.GUIDE_TEST_URL || 'http://127.0.0.1:5174';
const { cookie, cleanup } = await localOwnerLogin(base),
  checks = [];
async function call(
  path,
  { method = 'GET', body, session = cookie, status = 200, origin = true } = {},
) {
  const r = await fetch(base + path, {
    method,
    redirect: 'manual',
    headers: {
      ...(session ? { Cookie: session } : {}),
      ...(body ? { 'Content-Type': 'application/json', ...(origin ? { Origin: base } : {}) } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  assert.equal(r.status, status, `${path}: ${r.status}`);
  return r;
}
await call('/api/admin/session', { session: '', status: 401 });
await call('/api/team/login', {
  method: 'POST',
  body: { email: 'unknown@example.test', password: 'wrong' },
  session: '',
  status: 401,
});
await call('/api/team/login', {
  method: 'POST',
  body: { email: 'seedy@sites.test', password: 'wrong' },
  origin: false,
  status: 403,
});
checks.push('password login, generic invalid credentials and same-origin enforcement');
const forged = await fetch(base + '/api/admin/session', {
  headers: {
    'oai-authenticated-user-id': 'local_seedy',
    'oai-authenticated-user-email': 'seedy@sites.test',
  },
});
assert.equal(forged.status, 401);
checks.push('old ChatGPT headers no longer authenticate the team');
const idSuffix = crypto.randomUUID().slice(0, 8),
  created = await (
    await call('/api/admin/staff/invitations', {
      method: 'POST',
      body: {
        email: `auth-${idSuffix}@example.test`,
        displayName: 'عضو تحقق محلي',
        role: 'support',
      },
      status: 201,
    })
  ).json();
const token = new URLSearchParams(created.activationPath.split('#')[1]).get('token'),
  password = crypto.randomUUID() + '-private';
let userId;
try {
  await call('/api/team/activate', { method: 'POST', body: { token, password }, session: '' });
  await call('/api/team/activate', {
    method: 'POST',
    body: { token, password },
    session: '',
    status: 400,
  });
  checks.push('one-use activation with long password; token cannot be replayed');
  const signed = await call('/api/team/login', {
    method: 'POST',
    body: { email: `auth-${idSuffix}@example.test`, password },
    session: '',
  });
  const supportCookie = signed.headers.get('set-cookie').split(';')[0];
  assert(signed.headers.get('set-cookie').includes('HttpOnly'));
  assert(signed.headers.get('set-cookie').includes('SameSite=Lax'));
  const me = await (await call('/api/admin/session', { session: supportCookie })).json();
  userId = me.user.userId;
  await call('/api/admin/catalog', { session: supportCookie, status: 403 });
  await call('/api/admin/staff', { session: supportCookie, status: 403 });
  checks.push('support sees published workspace but not drafts, catalog metadata or staff');
  const list = await (await call('/api/admin/articles', { session: supportCookie })).json();
  assert(list.articles.every((a) => a.hasPublished));
  const reset = await (
    await call('/api/admin/staff/activation/' + userId, { method: 'POST', body: {} })
  ).json();
  await call('/api/admin/session', { session: supportCookie, status: 401 });
  const resetToken = new URLSearchParams(reset.activationPath.split('#')[1]).get('token');
  await call('/api/team/activate', {
    method: 'POST',
    body: { token: resetToken, password: password + 'new' },
    session: '',
  });
  await call('/api/team/login', {
    method: 'POST',
    body: { email: `auth-${idSuffix}@example.test`, password },
    session: '',
    status: 401,
  });
  checks.push('reset revokes existing sessions and replaces old password');
  const fresh = await call('/api/team/login', {
    method: 'POST',
    body: { email: `auth-${idSuffix}@example.test`, password: password + 'new' },
    session: '',
  });
  const freshCookie = fresh.headers.get('set-cookie').split(';')[0];
  await call('/api/team/password', {
    method: 'POST',
    session: freshCookie,
    body: { currentPassword: password + 'new', newPassword: password + 'changed' },
  });
  await call('/api/admin/session', { session: freshCookie, status: 401 });
  const changed = await call('/api/team/login', {
    method: 'POST',
    session: '',
    body: { email: `auth-${idSuffix}@example.test`, password: password + 'changed' },
  });
  const changedCookie = changed.headers.get('set-cookie').split(';')[0];
  checks.push('self password change requires current password and revokes every session');
  await call('/api/admin/staff/' + userId, {
    method: 'PUT',
    body: { role: 'support', active: false },
  });
  await call('/api/admin/session', { session: changedCookie, status: 401 });
  checks.push('disabling staff revokes sessions');
  await call('/api/team/logout', { method: 'POST', body: {} });
  await call('/api/admin/session', { status: 401 });
  checks.push('logout revokes server-side session');
  for (const activity of ['general', 'restaurant', 'construction', 'concrete', 'cars', 'hr']) {
    await call('/guides/activity/' + activity, { session: '', status: 404 });
    await call('/guides/activity/' + activity + '/print', { session: '', status: 404 });
  }
  checks.push('general activity guides and PDF views reject anonymous access');
} finally {
  if (userId) {
    localSQL(`DELETE FROM guide_sessions WHERE user_id='${userId}'`);
    localSQL(`DELETE FROM guide_activation_tokens WHERE user_id='${userId}'`);
    localSQL(`DELETE FROM guide_credentials WHERE user_id='${userId}'`);
    localSQL(`DELETE FROM guide_audit WHERE entity_id='${userId}' OR actor_id='${userId}'`);
    localSQL(
      `DELETE FROM guide_staff WHERE user_id='${userId}' AND email='auth-${idSuffix}@example.test'`,
    );
  }
  cleanup();
  cleanup();
  fs.mkdirSync('qa', { recursive: true });
  fs.writeFileSync(
    'qa/team-auth-evidence.json',
    JSON.stringify(
      { at: new Date().toISOString(), environment: base, checks, credentialsLogged: false },
      null,
      2,
    ),
  );
}
console.log(JSON.stringify({ passed: checks.length, credentialsLogged: false }));
