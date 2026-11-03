import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { articleSchema, publishIssues } from '../lib/guide-model.ts';
const catalog = JSON.parse(fs.readFileSync('lib/faq-catalog.json', 'utf8'));
const rules = JSON.parse(fs.readFileSync('lib/source-business-rules.json', 'utf8'));
test('source-backed business concepts have exact provenance, appropriate activity and release-ready bounded explanations', () => {
  assert.equal(rules.length, 21);
  assert.equal(new Set(rules.map((r: { id: string }) => r.id)).size, rules.length);
  for (const rule of rules) {
    assert.match(rule.sha256, /^[a-f0-9]{64}$/);
    assert(rule.source.startsWith('src/') || rule.source.startsWith('docs/'));
    const entry = catalog.find(
      (e: { key: string }) => e.key === 'business-v1-' + rule.id.toLowerCase(),
    );
    assert(entry);
    const c = articleSchema.parse(entry.content);
    assert.deepEqual(c.activities, rule.activities);
    assert.equal(c.summary, rule.answer);
    assert(c.steps[1].text === rule.example);
    assert(c.verificationNote.includes(rule.sha256));
    assert(c.verificationNote.includes('not LIVE'));
    assert.equal(publishIssues(c).length, 0);
  }
});
test('payroll and stock explanations keep distinct calculation rules and known app differences', () => {
  const rule = (id: string) => rules.find((r: { id: string }) => r.id === id);
  assert(rule('HR-DAYS').answer.includes('30.4167'));
  assert(rule('HR-FIRST').answer.includes('365'));
  assert(rule('HR-DAYS').example.includes('328.77'));
  assert(rule('HR-FIRST').example.includes('1643.84'));
  assert(rule('SL-ORDER').answer.includes('الحجز مفهوم مستقل'));
  assert(rule('REST-RETURN-ISSUE').scope === 'HISTORICAL_DOCUMENTED_EVIDENCE');
  assert(rule('REST-RETURN-ISSUE').example.includes('لا تحفظ'));
});
