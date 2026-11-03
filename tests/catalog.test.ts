import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  articleSchema,
  publishIssues,
  matchesActivity,
  BUNDLED_SCREENSHOTS,
  type ArticleContent,
} from '../lib/guide-model.ts';
const catalog: { id: string; key: string; screenKeys?: string[]; content: ArticleContent }[] =
  JSON.parse(fs.readFileSync(new URL('../lib/faq-catalog.json', import.meta.url), 'utf8'));
const released = new Set(
  JSON.parse(fs.readFileSync('lib/released-articles.json', 'utf8')).map(
    (e: { id: string }) => e.id,
  ),
);
test('catalog is complete across modules and activities, with unique identities and valid related links', () => {
  assert(catalog.length >= 390);
  assert.equal(
    catalog.filter(
      (x) =>
        !x.key.startsWith('expanded-') &&
        !x.key.startsWith('illustrated-v3-') &&
        !x.key.startsWith('live-ui-v1-') &&
        !x.key.startsWith('business-v1-'),
    ).length,
    107,
  );
  assert.equal(new Set(catalog.map((x) => x.id)).size, catalog.length);
  assert.equal(new Set(catalog.map((x) => x.content.title)).size, catalog.length);
  assert.equal(new Set(catalog.map((x) => x.content.module)).size, 11);
  for (const activity of [
    'general',
    'restaurant',
    'construction',
    'concrete',
    'cars',
    'hr',
  ] as const)
    assert(catalog.some((x) => x.content.activities.includes(activity)));
  for (const entry of catalog) {
    const c = articleSchema.parse(entry.content);
    assert(c.summary.length > 30);
    assert(c.reply.includes(c.summary));
    assert(c.steps.length >= 2);
    assert(c.steps[1].text.length > 35);
    assert(
      c.verificationNote.includes(
        entry.key.startsWith('live-ui-v1-') ? 'LIVE_UI_CAPTURE_READ_ONLY' : 'not LIVE',
      ),
    );
    if (entry.key.startsWith('business-v1-')) {
      assert.equal(c.verifiedAt, '2026-11-03');
      assert.equal(publishIssues(c).length, 0);
      assert(c.verificationNote.includes('image is context only'));
    } else if (released.has(entry.id)) {
      assert.equal(c.verifiedAt, '2026-11-03');
      assert.equal(publishIssues(c).length, 0);
      assert(!c.activities.includes('hr'));
    } else {
      assert.equal(c.verifiedAt, '');
      assert(publishIssues(c).length > 0);
    }
    for (const id of c.relatedIds) {
      const related = catalog.find((x) => x.id === id);
      assert(related);
      assert.notEqual(id, entry.id);
      assert.equal(related.content.module, c.module);
    }
  }
});
test('specialized procedures stay scoped and every screenshot is a real bundled asset', () => {
  for (const entry of catalog) {
    const c = entry.content;
    for (const s of c.steps) {
      if (s.image) {
        assert.equal(s.image.kind, 'asset');
        assert(
          BUNDLED_SCREENSHOTS.some(
            (x) => x.name === (s.image?.kind === 'asset' ? s.image.name : ''),
          ),
        );
        assert(
          fs.existsSync(
            new URL(
              '../public/assets/' + (s.image.kind === 'asset' ? s.image.name : ''),
              import.meta.url,
            ),
          ),
        );
        assert(s.caption.includes('فعلية'));
      }
    }
    if (
      c.activities.length === 1 &&
      ['restaurant', 'construction', 'concrete', 'cars', 'hr'].includes(c.activities[0])
    ) {
      assert(!matchesActivity(c, 'general'));
    }
  }
});

test('every active inventoried screen and catalogued report has linked draft guidance; removed audit screen stays excluded', () => {
  const coverage = JSON.parse(
    fs.readFileSync(new URL('../lib/catalog-coverage.json', import.meta.url), 'utf8'),
  );
  assert.equal(coverage.screenGuidance, 106);
  assert.equal(coverage.reports, 71);
  for (const screen of coverage.screensInventory) {
    if (screen.route === '#/logs') {
      assert.equal(screen.state, 'excluded_removed');
      assert.equal(screen.articleIds.length, 0);
      continue;
    }
    assert.equal(screen.articleIds.length, 2);
    for (const id of screen.articleIds) {
      const entry = catalog.find((x) => x.id === id);
      assert(entry);
      assert(entry.screenKeys?.includes(screen.route));
    }
  }
  assert.equal(
    catalog.filter((x) => x.key.startsWith('expanded-report-')).length,
    coverage.reports,
  );
  const assets = JSON.parse(
    fs.readFileSync(new URL('../lib/screenshot-assets.json', import.meta.url), 'utf8'),
  );
  for (const asset of assets) {
    if (asset.scope.startsWith('LIVE_')) {
      assert(
        asset.source.startsWith('docs/evidence/live-captures/') ||
          asset.source.startsWith('docs/evidence/report-criteria/'),
      );
      const proof = JSON.parse(fs.readFileSync(asset.source, 'utf8'));
      assert.equal(
        proof.mode,
        ['LIVE_EMPTY_DOCUMENT_UI', 'LIVE_REPORT_CRITERIA_ONLY'].includes(asset.scope)
          ? 'native-viewport-screenshot'
          : 'native-element-screenshot',
      );
      assert.equal(proof.sha256, asset.sha256);
      assert.equal(proof.capturedAt, asset.capturedAt);
    } else {
      assert.equal(asset.scope, 'UI_ONLY_FROM_HISTORICAL_FAILURE_ARTIFACT');
      assert(asset.source.startsWith('screenshots/FAIL_') || asset.source.startsWith('target/'));
    }
  }
});

test('the supplemental visual batch has complete illustrated steps and honest verification boundaries', () => {
  const illustrated = catalog.filter((x) => x.key.startsWith('illustrated-v3-'));
  assert.equal(illustrated.length, 36);
  for (const entry of illustrated) {
    assert.equal(entry.content.verifiedAt, '');
    assert.equal(entry.content.steps.length, 3);
    assert(entry.content.steps.every((s) => s.image && s.caption.includes('أرشيفية') && s.focus));
    assert(entry.content.verificationNote.includes('not LIVE'));
    assert(entry.content.activities.length > 0);
  }
});

test('current read-only capture articles retain reviewed screenshots and cannot be mistaken for qualified transactions', () => {
  const live = catalog.filter((x) => x.key.startsWith('live-ui-v1-'));
  assert.equal(live.length, 20);
  for (const entry of live) {
    assert.equal(entry.content.verifiedAt, released.has(entry.id) ? '2026-11-03' : '');
    assert(
      entry.content.verificationNote.includes(
        'No save, data mutation or transaction qualification',
      ),
    );
    assert(entry.content.steps.every((s) => s.image && s.caption.includes('غير محفوظ')));
  }
});
