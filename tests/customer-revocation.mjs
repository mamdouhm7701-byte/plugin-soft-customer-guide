import assert from 'node:assert/strict';
import { localSQL } from '../tests/local-auth-fixture.mjs';
import { tokenHash, randomToken } from '../lib/passwords.ts';
const base = 'http://127.0.0.1:5174',
  pack = crypto.randomUUID(),
  staff = crypto.randomUUID(),
  token = randomToken(),
  hash = await tokenHash(token),
  stamp = new Date().toISOString();
localSQL(
  `INSERT INTO guide_staff (user_id,email,display_name,role,active,created_at,updated_at) VALUES ('${staff}','scope-${staff}@example.test','Local scope test','support',1,'${stamp}','${stamp}')`,
);
localSQL(
  `INSERT INTO guide_credentials (user_id,password_hash,salt,iterations,version,updated_at) VALUES ('${staff}','fixture-not-login','fixture',100000,'scope-check','${stamp}')`,
);
localSQL(
  `INSERT INTO guide_sessions (token_hash,user_id,credential_version,created_at,expires_at) VALUES ('${hash}','${staff}','scope-check',0,${Math.floor(Date.now() / 1000) + 300})`,
);
localSQL(
  `INSERT INTO guide_packs (id,title,activity,modules_json,article_ids_json,welcome,archived,revision,created_by,created_at,updated_at) VALUES ('${pack}','Scope check','general','["sales"]','["open-sales-order"]','',0,1,'${staff}','${stamp}','${stamp}')`,
);
async function get(path, cookie = '', status = 200) {
  const r = await fetch(base + path, {
    headers: cookie ? { Cookie: cookie } : {},
    redirect: 'manual',
  });
  assert.equal(r.status, status, path);
  return r;
}
try {
  await get('/api/admin/business', '', 401);
  await get('/api/admin/readiness', '', 401);
  await get('/api/admin/readiness', 'guide_team_session=' + token, 403);
  await get('/api/articles', '', 404);
  await get('/api/articles/open-sales-order', '', 404);
  await get('/guides/activity/general', '', 404);
  await get('/print', '', 404);
  const access = await get('/api/customer/access?guide=' + pack, '', 303),
    cookie = access.headers.get('set-cookie').split(';')[0];
  await get('/guides/' + pack, cookie);
  await get('/help/open-sales-order', cookie);
  const print = await (await get('/guides/' + pack + '/print', cookie)).text();
  assert(print.includes('/help/open-sales-order?guide=' + pack));
  const list = await (await get('/api/articles', cookie)).json();
  assert.equal(list.articles.length, 1);
  await get('/api/articles/open-sales-invoice', cookie, 404);
  localSQL(`UPDATE guide_packs SET archived=1 WHERE id='${pack}'`);
  await get('/help/open-sales-order', cookie, 404);
  await get('/api/articles', cookie, 404);
  await get('/print?article=open-sales-order', cookie, 404);
  const root = await (await get('/', cookie)).text();
  assert(!root.includes('اختَر نشاطك'));
  assert(!root.includes('open-sales-order'));
  const deletion = await fetch(base + '/api/admin/packs/' + pack, {
    method: 'PUT',
    headers: {
      Cookie: 'guide_team_session=' + token,
      Origin: base,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ revision: 1, action: 'delete' }),
  });
  assert.equal(deletion.status, 200);
  await get('/guides/' + pack, cookie, 404);
  assert.equal(localSQL(`SELECT id FROM guide_packs WHERE id='${pack}'`).length, 0);
  assert.equal(
    localSQL(`SELECT id FROM guide_audit WHERE entity_id='${pack}' AND action='pack.delete'`)
      .length,
    1,
  );
  console.log(
    'PASS: anonymous library closed; scoped cookie filtered; revocation blocks root fallback/articles/API/print; delete removes guide and preserves audit.',
  );
} finally {
  for (const sql of [
    `DELETE FROM guide_packs WHERE id='${pack}'`,
    `DELETE FROM guide_audit WHERE entity_id='${pack}' AND actor_id='${staff}'`,
    `DELETE FROM guide_sessions WHERE user_id='${staff}'`,
    `DELETE FROM guide_credentials WHERE user_id='${staff}'`,
    `DELETE FROM guide_staff WHERE user_id='${staff}'`,
  ])
    localSQL(sql);
}
