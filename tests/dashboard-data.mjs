import assert from 'node:assert/strict';
import { localOwnerLogin, localSQL } from './local-auth-fixture.mjs';
const base = 'http://127.0.0.1:5174',
  owner = await localOwnerLogin(base);
try {
  assert.equal((await fetch(base + '/api/admin/dashboard')).status, 401);
  const r = await fetch(base + '/api/admin/dashboard', { headers: { Cookie: owner.cookie } });
  assert.equal(r.status, 200);
  const data = await r.json();
  assert.equal(
    data.workflow.reduce((n, r) => n + r.count, 0),
    localSQL('SELECT COUNT(*) AS n FROM guide_articles')[0].n,
  );
  for (const row of data.workflow) {
    assert(['published', 'review', 'draft', 'archived'].includes(row.status));
    assert.equal(
      row.count,
      localSQL(
        `SELECT COUNT(*) AS n FROM guide_articles WHERE CASE WHEN archived=1 THEN 'archived' ELSE status END='${row.status}'`,
      )[0].n,
    );
  }
  assert.equal(
    data.feedback.yes,
    localSQL("SELECT COUNT(*) AS n FROM guide_feedback WHERE vote='yes'")[0].n,
  );
  assert.equal(
    data.feedback.no,
    localSQL("SELECT COUNT(*) AS n FROM guide_feedback WHERE vote='no'")[0].n,
  );
  assert.equal(
    data.feedback.needs_attention,
    localSQL("SELECT COUNT(*) AS n FROM guide_feedback WHERE vote='no' AND resolved=0")[0].n,
  );
  assert.deepEqual(
    data.questions,
    localSQL(
      "SELECT id,question,frequency FROM guide_questions WHERE status='open' ORDER BY frequency DESC,updated_at DESC LIMIT 5",
    ),
  );
  console.log(
    'PASS dashboard: authenticated access, mutually exclusive workflow totals, actual feedback and open-question frequency match D1.',
  );
} finally {
  owner.cleanup();
}
