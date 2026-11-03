import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  articleSchema,
  publishIssues,
  matchesActivity,
  matchesSearch,
  summaryOf,
  canEdit,
  canPublish,
  imageSrc,
} from '../lib/guide-model.ts';
const seeds = JSON.parse(
  fs.readFileSync(new URL('../lib/seed-articles.json', import.meta.url), 'utf8'),
) as { id: string; content: unknown }[];
test('all shipped screenshot articles satisfy the publishing contract', () => {
  for (const s of seeds) {
    const c = articleSchema.parse(s.content);
    assert.deepEqual(publishIssues(c), []);
    for (const step of c.steps)
      assert(fs.existsSync(new URL('../public' + imageSrc(step.image), import.meta.url)));
  }
});
test('general sales instructions never silently qualify a specialized activity', () => {
  const c = articleSchema.parse(seeds[0].content);
  assert(matchesActivity(c, 'general'));
  assert(!matchesActivity(c, 'restaurant'));
  assert(!matchesActivity(c, 'construction'));
  const intake = articleSchema.parse(seeds.find((x) => x.id === 'support-request')!.content);
  assert(matchesActivity(intake, 'restaurant'));
});
test('Arabic aliases survive hamza, diacritics and spacing variations', () => {
  const c = articleSchema.parse(seeds[1].content);
  const a = summaryOf(seeds[1].id, c, 1, '2026-11-02');
  assert(matchesSearch(a, 'فاتوره'));
  assert(matchesSearch(a, 'مَبِيعات'));
  assert(matchesSearch(a, 'PS-002'));
  assert(!matchesSearch(a, 'مرتبات موظفين'));
});
test('publication rejects missing evidence, images and descriptions', () => {
  const c = articleSchema.parse(seeds[0].content);
  const bad = {
    ...c,
    verifiedAt: '',
    verificationNote: '',
    steps: [{ ...c.steps[0], image: null, caption: '' }],
  };
  assert(publishIssues(bad).length >= 4);
});
test('media inputs cannot embed external URLs or SVG, and annotation stays inside the screenshot', () => {
  const c = articleSchema.parse(seeds[0].content);
  assert(
    !articleSchema.safeParse({
      ...c,
      steps: [{ ...c.steps[0], image: { kind: 'media', id: 'https://example.test/private.svg' } }],
    }).success,
  );
  assert(
    !articleSchema.safeParse({
      ...c,
      steps: [{ ...c.steps[0], image: { kind: 'asset', name: 'secret.svg' } }],
    }).success,
  );
  assert(
    !articleSchema.safeParse({
      ...c,
      steps: [{ ...c.steps[0], focus: { x: 98, y: 50, w: 20, h: 10 } }],
    }).success,
  );
});
test('support cannot edit or publish; an editor cannot publish', () => {
  assert(!canEdit('support'));
  assert(!canPublish('support'));
  assert(canEdit('editor'));
  assert(!canPublish('editor'));
  assert(canPublish('reviewer'));
  assert(canPublish('owner'));
});
test('verification dates reject impossible dates and future evidence', () => {
  const c = articleSchema.parse(seeds[0].content);
  assert(publishIssues({ ...c, verifiedAt: '2026-02-31' }).length > 0);
  assert(publishIssues({ ...c, verifiedAt: '2099-01-01' }).length > 0);
});
