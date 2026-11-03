import assert from 'node:assert/strict';
import { localOwnerLogin, localSQL } from './local-auth-fixture.mjs';
const base = 'http://127.0.0.1:5174',
  owner = await localOwnerLogin(base),
  pack = crypto.randomUUID(),
  feedbackArticle = 'reply-' + crypto.randomUUID(),
  stamp = new Date().toISOString();
const headers = { Cookie: owner.cookie, Origin: base, 'Content-Type': 'application/json' };
async function request(path, cookie = '', status = 200, options = {}) {
  const r = await fetch(base + path, {
    redirect: 'manual',
    ...options,
    headers: { Cookie: cookie, ...options.headers },
  });
  assert.equal(r.status, status, path);
  return r;
}
localSQL(
  `INSERT INTO guide_packs (id,title,activity,modules_json,article_ids_json,welcome,archived,revision,created_by,created_at,updated_at) VALUES ('${pack}','Single answer test','general','["sales"]','["open-sales-order","open-sales-invoice"]','',0,1,'${owner.userId}','${stamp}','${stamp}')`,
);
try {
  await request('/api/admin/replies', '', 401, {
    method: 'POST',
    headers: { Origin: base, 'Content-Type': 'application/json' },
    body: JSON.stringify({ packId: pack, articleId: 'open-sales-order' }),
  });
  await request('/api/admin/replies', owner.cookie, 403, {
    method: 'POST',
    headers: { ...headers, Origin: 'https://invalid.example' },
    body: '{}',
  });
  const made = await request('/api/admin/replies', owner.cookie, 200, {
    method: 'POST',
    headers,
    body: JSON.stringify({ packId: pack, articleId: 'open-sales-order' }),
  });
  const { path } = await made.json(),
    token = new URL(base + path).searchParams.get('reply');
  assert(!path.includes(pack));
  await request(path, '', 307);
  const access = await request('/api/customer/reply?token=' + token, '', 303);
  const cookie = access.headers
    .getSetCookie()
    .find((x) => x.startsWith('guide_customer_reply='))
    .split(';')[0];
  assert(access.headers.getSetCookie().some((x) => x.startsWith('guide_customer_pack=;')));
  const html = await (await request(path, cookie)).text();
  assert(!html.includes('/guides/' + pack));
  assert(!html.includes('Ø§Ù„Ø±Ø¬ÙˆØ¹ Ù„Ù„Ø¯Ù„ÙŠÙ„'));
  assert(!html.includes('Ø£Ø³Ø¦Ù„Ø© Ù…Ø±ØªØ¨Ø·Ø©'));
  await request('/help/open-sales-invoice?reply=' + token, cookie, 404);
  await request('/help/open-sales-invoice', cookie, 404);
  const list = await (await request('/api/articles', cookie)).json();
  assert.deepEqual(
    list.articles.map((a) => a.id),
    ['open-sales-order'],
  );
  await request('/api/articles/open-sales-invoice', cookie, 404);
  await request('/print?article=open-sales-invoice&reply=' + token, cookie, 404);
  await request('/print', cookie, 404);
  const print = await (
    await request('/print?article=open-sales-order&reply=' + token, cookie)
  ).text();
  assert(!print.includes('/guides/' + pack));
  assert(print.includes('?reply='));
  const root = await (await request('/', cookie)).text();
  assert(!root.includes('open-sales-invoice'));
  await request(
    '/api/customer/reply?token=' + ((token[0] === 'A' ? 'B' : 'A') + token.slice(1)),
    '',
    404,
  );
  localSQL(
    `INSERT INTO guide_articles (id,draft_json,draft_summary,published_json,published_summary,status,revision,published_revision,archived,review_note,updated_by,updated_at,published_at) SELECT '${feedbackArticle}',draft_json,json_set(draft_summary,'$.id','${feedbackArticle}'),published_json,json_set(published_summary,'$.id','${feedbackArticle}'),'published',1,1,0,'','${owner.userId}','${stamp}','${stamp}' FROM guide_articles WHERE id='open-sales-order'`,
  );
  localSQL(
    `UPDATE guide_packs SET article_ids_json='["open-sales-order","open-sales-invoice","${feedbackArticle}"]' WHERE id='${pack}'`,
  );
  const feedbackLink = await (
    await request('/api/admin/replies', owner.cookie, 200, {
      method: 'POST',
      headers,
      body: JSON.stringify({ packId: pack, articleId: feedbackArticle }),
    })
  ).json();
  const feedbackToken = new URL(base + feedbackLink.path).searchParams.get('reply');
  await request('/api/feedback', '', 200, {
    method: 'POST',
    headers: { Origin: base, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      articleId: feedbackArticle,
      replyToken: feedbackToken,
      vote: 'no',
      comment: '',
    }),
  });
  assert.equal(
    localSQL(`SELECT comment FROM guide_feedback WHERE article_id='${feedbackArticle}'`)[0].comment,
    '',
  );
  localSQL(`UPDATE guide_packs SET archived=1 WHERE id='${pack}'`);
  await request(path, cookie, 404);
  await request('/api/articles', cookie, 404);
  await request('/api/customer/reply?token=' + token, '', 404);
  localSQL(`DELETE FROM guide_packs WHERE id='${pack}'`);
  await request(path, cookie, 404);
  console.log(
    'PASS: fresh-browser answer link; opaque parent; singleton article/API/print; tamper and cross-origin rejection; optional empty feedback; archive/delete revoke.',
  );
} finally {
  localSQL(`DELETE FROM guide_feedback WHERE article_id='${feedbackArticle}'`);
  localSQL(
    `DELETE FROM guide_articles WHERE id='${feedbackArticle}' AND updated_by='${owner.userId}'`,
  );
  localSQL(`DELETE FROM guide_packs WHERE id='${pack}' AND created_by='${owner.userId}'`);
  owner.cleanup();
}
