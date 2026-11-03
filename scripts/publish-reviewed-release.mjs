// Explicit bounded release only; never publishes the full catalog or replaces edits.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { localOwnerLogin } from '../tests/local-auth-fixture.mjs';
import { articleSchema, publishIssues } from '../lib/guide-model.ts';
const base = 'http://127.0.0.1:5174';
const entries = JSON.parse(fs.readFileSync('lib/released-articles.json', 'utf8'));
const fixture = await localOwnerLogin(base);
let published = 0,
  existing = 0;
try {
  for (const e of entries) {
    const content = articleSchema.parse(e.content);
    assert(!content.activities.includes('hr'));
    assert.equal(publishIssues(content).length, 0);
    let response = await fetch(base + '/api/admin/articles/' + e.id, {
      headers: { Cookie: fixture.cookie },
    });
    assert(response.ok);
    let record = await response.json();
    if (record.publishedRevision) {
      existing++;
      continue;
    }
    assert.equal(record.archived, false);
    assert.deepEqual(record.content, content, 'Saved editorial changes require review: ' + e.id);
    for (const action of ['submit', 'publish']) {
      response = await fetch(base + '/api/admin/articles/' + e.id + '/transition', {
        method: 'POST',
        headers: { Cookie: fixture.cookie, Origin: base, 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision: record.revision, action }),
      });
      if (!response.ok)
        throw Error(
          'Release transition failed ' +
            response.status +
            ' ' +
            e.id +
            ' ' +
            (await response.text()),
        );
      record = await response.json();
    }
    published++;
  }
  console.log(
    JSON.stringify({ published, existing, hrPublished: 0, releaseEntries: entries.length }),
  );
} finally {
  fixture.cleanup();
}
