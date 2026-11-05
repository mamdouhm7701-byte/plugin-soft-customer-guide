import test from 'node:test';
import assert from 'node:assert/strict';
import { arabicScore, similarity } from '../lib/arabic-search.ts';
test('Arabic search normalizes spelling, synonyms and bounded typos', () => {
  assert(arabicScore('إضافة فاتورة عميل', 'ازاي انشاء فاتوره زبون') > 0);
  assert(arabicScore('طباعة الفاتورة', 'طباعه الفاتوره') > 0);
  assert(arabicScore('تسجيل المبيعات', 'المبيعاات') > 0);
  assert.equal(arabicScore('فاتورة مشتريات', 'فاتورة مبيعات'), 0);
  assert.equal(arabicScore('PS-001', 'PS-002'), 0);
  assert(arabicScore('فاتورة عميل', 'فاتورة عميل') > arabicScore('فواتير زبون', 'فاتورة عميل'));
});
test('similar titles are suggestions with a bounded lexical score', () => {
  assert(similarity('اضافة فاتورة عميل', 'انشاء فواتير زبون') > 0.8);
  assert.equal(similarity('فاتورة مبيعات', 'صرف مخزون'), 0);
});
