import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { contentWorkbook } from '../lib/content-export.ts';
import { emptyContent, type DraftRecord } from '../lib/guide-model.ts';

test('Excel export keeps Arabic, statuses, full steps and formula-like text as text', async () => {
  const c = emptyContent();
  c.title = '=HYPERLINK("https://example.test")';
  c.summary = 'إجابة عربية للمراجعة';
  c.steps = [
    {
      title: 'مراجعة',
      text: 'تفاصيل الخطوة',
      image: { kind: 'asset', name: 'erp-invoice.jpg' },
      caption: 'صورة فعلية',
      focus: null,
    },
  ];
  const r: DraftRecord = {
    id: 'local-export',
    content: c,
    status: 'draft',
    revision: 2,
    publishedRevision: null,
    archived: false,
    reviewNote: '',
    updatedAt: '2026-11-03',
    publishedAt: null,
  };
  const bytes = await contentWorkbook([r], 'http://127.0.0.1:5174');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(bytes);
  assert.equal(wb.worksheets.length, 2);
  const sheet = wb.getWorksheet('الأسئلة والإجابات')!;
  assert.equal(sheet.views[0].rightToLeft, true);
  assert.equal(sheet.getCell('B2').value, c.title);
  assert.equal(sheet.getCell('B2').type, ExcelJS.ValueType.String);
  assert.equal(sheet.getCell('C2').value, 'مسودة');
  assert.equal(sheet.getCell('P2').value, '');
  assert.equal(sheet.getCell('F2').value, c.summary);
  assert.equal(
    wb.getWorksheet('الخطوات والصور')!.getCell('G2').value,
    'http://127.0.0.1:5174/assets/erp-invoice.jpg',
  );
});
