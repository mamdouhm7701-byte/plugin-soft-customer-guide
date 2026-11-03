import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { matchesReviewedBaseline } from '../lib/release-policy.ts';
import { articleSchema, publishIssues } from '../lib/guide-model.ts';
import { tokenHash } from '../lib/passwords.ts';

test('release baseline accepts equivalent validated JSON, but rejects an editorial edit or malformed content', async () => {
  const original = articleSchema.parse(
    JSON.parse(fs.readFileSync('lib/seed-articles.json', 'utf8'))[0].content,
  );
  const hash = await tokenHash(JSON.stringify(original));
  assert(await matchesReviewedBaseline(JSON.stringify(original, null, 2), hash));
  assert.equal(
    await matchesReviewedBaseline(
      JSON.stringify({ ...original, summary: original.summary + ' User change' }),
      hash,
    ),
    false,
  );
  assert.equal(await matchesReviewedBaseline('{broken', hash), false);
  assert.equal(await matchesReviewedBaseline('{}', hash), false);
});

test('reviewed source release is complete, excludes HR and matches its catalog snapshots', () => {
  const release = JSON.parse(fs.readFileSync('lib/released-articles.json', 'utf8'));
  const catalog = new Map(
    JSON.parse(fs.readFileSync('lib/faq-catalog.json', 'utf8')).map(
      (e: { id: string; content: unknown }) => [e.id, e.content],
    ),
  );
  assert(release.length >= 350);
  assert.equal(new Set(release.map((e: { id: string }) => e.id)).size, release.length);
  for (const entry of release) {
    const content = articleSchema.parse(entry.content);
    assert(!content.activities.includes('hr'));
    assert.deepEqual(publishIssues(content), []);
    assert.deepEqual(content, articleSchema.parse(catalog.get(entry.id)));
  }
});
