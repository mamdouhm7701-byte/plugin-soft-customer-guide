import assert from 'node:assert/strict';
import { localOwnerLogin, localSQL } from './local-auth-fixture.mjs';
const base = 'http://127.0.0.1:5174',
  owner = await localOwnerLogin(base),
  id = 'reply-' + crypto.randomUUID(),
  pack = crypto.randomUUID(),
  stamp = new Date().toISOString();
const headers = { Origin: base, 'Content-Type': 'application/json' };
async function request(path, cookie = '', status = 200, options = {}) {
  const r = await fetch(base + path, {
    redirect: 'manual',
    ...options,
    headers: { Cookie: cookie, ...options.headers },
  });
  assert.equal(r.status, status, path);
  return r;
}
try {
  localSQL(
    `INSERT INTO guide_articles (id,draft_json,draft_summary,published_json,published_summary,status,revision,published_revision,archived,review_note,updated_by,updated_at,published_at) SELECT '${id}',draft_json,json_set(draft_summary,'$.id','${id}'),published_json,json_set(published_summary,'$.id','${id}'),'published',1,1,0,'','${owner.userId}','${stamp}','${stamp}' FROM guide_articles WHERE id='open-sales-order'`,
  );
  await request('/api/admin/replies', '', 401, {
    method: 'POST',
    headers,
    body: JSON.stringify({ articleId: id }),
  });
  await request('/api/admin/replies', owner.cookie, 403, {
    method: 'POST',
    headers: { ...headers, Origin: 'https://invalid.example' },
    body: '{}',
  });
  const { path } = await (
    await request('/api/admin/replies', owner.cookie, 200, {
      method: 'POST',
      headers,
      body: JSON.stringify({ articleId: id }),
    })
  ).json();
  const token = new URL(base + path).searchParams.get('reply');
  assert(!path.includes(pack));
  await request(path, '', 307);
  const access = await request('/api/customer/reply?token=' + token, '', 303);
  const cookie = access.headers
    .getSetCookie()
    .find((x) => x.startsWith('guide_customer_reply='))
    .split(';')[0];
  const html = await (await request(path, cookie)).text();
  assert(!html.includes('/guides/'));
  assert(!html.includes('الرجوع للدليل'));
  assert(!html.includes('أسئلة مرتبطة'));
  assert.deepEqual(
    (await (await request('/api/articles', cookie)).json()).articles.map((a) => a.id),
    [id],
  );
  await request('/help/open-sales-invoice?reply=' + token, cookie, 404);
  await request('/api/articles/open-sales-invoice', cookie, 404);
  await request('/print', cookie, 404);
  await request('/print?article=open-sales-invoice&reply=' + token, cookie, 404);
  const print = await (await request('/print?article=' + id + '&reply=' + token, cookie)).text();
  assert(!print.includes('/guides/'));
  assert(print.includes('?reply='));
  await request(
    '/api/customer/reply?token=' + ((token[0] === 'A' ? 'B' : 'A') + token.slice(1)),
    '',
    404,
  );
  await request('/api/feedback', '', 200, {
    method: 'POST',
    headers,
    body: JSON.stringify({ articleId: id, replyToken: token, vote: 'no', comment: '' }),
  });
  assert.equal(
    localSQL(`SELECT comment FROM guide_feedback WHERE article_id='${id}'`)[0].comment,
    '',
  );
  localSQL(
    `INSERT INTO guide_packs (id,title,activity,modules_json,article_ids_json,welcome,archived,revision,created_by,created_at,updated_at) VALUES ('${pack}','Independent handover test','general','["sales"]','["${id}"]','',1,1,'${owner.userId}','${stamp}','${stamp}')`,
  );
  await request(path, cookie);
  localSQL(`DELETE FROM guide_packs WHERE id='${pack}' AND created_by='${owner.userId}'`);
  await request(path, cookie);
  localSQL(
    `UPDATE guide_articles SET archived=1 WHERE id='${id}' AND updated_by='${owner.userId}'`,
  );
  await request(path, cookie, 404);
  await request('/api/articles', cookie, 404);
  await request('/api/customer/reply?token=' + token, '', 404);
  await request('/api/admin/replies', owner.cookie, 404, {
    method: 'POST',
    headers,
    body: JSON.stringify({ articleId: id }),
  });
  console.log(
    'PASS: no-pack sharing, fresh-browser answer-only API/print, tamper and CSRF rejection, optional feedback; handover archive/delete does not revoke; article archive revokes.',
  );
} finally {
  localSQL(
    `DELETE FROM guide_feedback WHERE article_id='${id}';DELETE FROM guide_packs WHERE id='${pack}' AND created_by='${owner.userId}';DELETE FROM guide_articles WHERE id='${id}' AND updated_by='${owner.userId}';`,
  );
  owner.cleanup();
}
