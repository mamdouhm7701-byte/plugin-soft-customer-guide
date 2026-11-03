// Local-only revisioned updates. Preserve user edits and all published snapshots.
import fs from 'node:fs';
import { articleSchema } from '../lib/guide-model.ts';
import { localOwnerLogin } from '../tests/local-auth-fixture.mjs';
const baselinePath = process.argv[2];
if (!baselinePath) throw Error('Pass the pre-edit catalog baseline file.');
const base = 'http://127.0.0.1:5174',
  before = new Map(
    JSON.parse(fs.readFileSync(baselinePath, 'utf8')).map((e) => [
      e.id,
      articleSchema.parse(e.content),
    ]),
  ),
  current = JSON.parse(fs.readFileSync('lib/faq-catalog.json', 'utf8'));
const fixture = await localOwnerLogin(base);
let updated = 0,
  alreadyCurrent = 0,
  preserved = 0;
try {
  for (const entry of current) {
    const old = before.get(entry.id),
      content = articleSchema.parse(entry.content);
    if (!old || JSON.stringify(old) === JSON.stringify(content)) continue;
    const response = await fetch(base + '/api/admin/articles/' + entry.id, {
      headers: { Cookie: fixture.cookie },
    });
    if (!response.ok) throw Error('Draft read failed: ' + response.status);
    const record = await response.json();
    if (JSON.stringify(record.content) === JSON.stringify(content)) {
      alreadyCurrent++;
      continue;
    }
    if (
      record.status !== 'draft' ||
      record.archived ||
      record.publishedRevision ||
      JSON.stringify(record.content) !== JSON.stringify(old)
    ) {
      preserved++;
      continue;
    }
    const saved = await fetch(base + '/api/admin/articles/' + entry.id, {
      method: 'PUT',
      headers: { Cookie: fixture.cookie, Origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify({ revision: record.revision, content }),
    });
    if (saved.status === 409) {
      preserved++;
      continue;
    }
    if (!saved.ok)
      throw Error(
        'Revisioned save failed: ' +
          saved.status +
          ' article ' +
          entry.id +
          ' ' +
          (await saved.text()).slice(0, 300),
      );
    updated++;
  }
  console.log(
    JSON.stringify({ updated, alreadyCurrent, preserved, publication: 0, ownerUntouched: true }),
  );
} finally {
  fixture.cleanup();
}
