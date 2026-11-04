import assert from 'node:assert/strict';
import { localOwnerLogin, localSQL } from './local-auth-fixture.mjs';
const base = 'http://127.0.0.1:5174';
const owner = await localOwnerLogin(base),
  other = await localOwnerLogin(base),
  created = [];
const feedback = crypto.randomUUID(),
  article = 'open-sales-order';
async function request(path, who = owner, method = 'GET', body) {
  return fetch(base + '/api/admin/' + path, {
    method,
    headers: {
      ...(who ? { Cookie: who.cookie } : {}),
      Origin: base,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
try {
  assert.equal((await request('templates', null)).status, 401);
  assert.equal((await request('effectiveness', null)).status, 401);
  localSQL(`UPDATE guide_staff SET role='support' WHERE user_id='${other.userId}'`);
  const before = localSQL('SELECT COUNT(*) AS n FROM guide_packs')[0].n;
  const content = {
    title: 'Fixture client name must not become template title',
    activity: 'general',
    modules: ['sales'],
    articleIds: ['open-sales-order'],
    welcome: '',
  };
  const response = await request('templates', owner, 'POST', {
    name: 'Fixture sales template',
    content,
  });
  assert.equal(response.status, 201);
  const { id } = await response.json();
  created.push(id);
  const items = await (await request('templates', other)).json();
  const item = items.templates.find((t) => t.id === id);
  assert(item);
  assert.equal(item.content.title, 'دليلك بعد التدريب');
  assert.deepEqual(item.content.articleIds, ['open-sales-order']);
  assert.equal(localSQL('SELECT COUNT(*) AS n FROM guide_packs')[0].n, before);
  assert.equal((await request('templates/' + id, other, 'PUT', { action: 'delete' })).status, 403);
  assert.equal(
    (
      await request('templates', owner, 'POST', {
        name: 'Invalid fixture',
        content: { ...content, modules: [] },
      })
    ).status,
    400,
  );
  localSQL(
    `INSERT INTO guide_feedback (id,article_id,vote,comment,visitor_hash,vote_day,resolved,created_at) VALUES ('${feedback}','${article}','no','','${feedback}','2026-11-04',0,'2026-11-04T12:00:00.000Z')`,
  );
  const data = await (await request('effectiveness', other)).json();
  const target = data.negative.find((a) => a.article_id === article);
  assert(target);
  const actual = localSQL(
    `SELECT COUNT(*) AS total,SUM(CASE WHEN vote='no' THEN 1 ELSE 0 END) AS negative,SUM(CASE WHEN vote='no' AND resolved=0 THEN 1 ELSE 0 END) AS unresolved FROM guide_feedback WHERE article_id='${article}'`,
  )[0];
  for (const field of ['total', 'negative', 'unresolved'])
    assert.equal(target[field], actual[field]);
  assert.equal((await request('templates/' + id, owner, 'PUT', { action: 'delete' })).status, 200);
  assert.equal(localSQL(`SELECT id FROM guide_templates WHERE id='${id}'`).length, 0);
  assert.equal(
    localSQL(`SELECT id FROM guide_audit WHERE entity_id='${id}' AND action='template.delete'`)
      .length,
    1,
  );
  console.log(
    'PASS: team-only templates persist without creating customer guides; creator/owner deletion boundary; validation; actual feedback aggregates; cleanup.',
  );
} finally {
  for (const id of created)
    localSQL(`DELETE FROM guide_templates WHERE id='${id}' AND created_by='${owner.userId}'`);
  localSQL(`DELETE FROM guide_feedback WHERE id='${feedback}' AND visitor_hash='${feedback}'`);
  owner.cleanup();
  other.cleanup();
}
