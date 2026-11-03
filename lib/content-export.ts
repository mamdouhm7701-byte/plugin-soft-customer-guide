import ExcelJS from 'exceljs';
import { activityName, moduleName, codeFor, type DraftRecord } from './guide-model.ts';

export const exportStatus = (record: DraftRecord) =>
  record.archived
    ? 'مؤرشف'
    : record.status === 'published'
      ? 'منشور'
      : record.status === 'review'
        ? 'بانتظار المراجعة'
        : 'مسودة';

/** Text cells stay strings: user content must never become spreadsheet formulas. */
export async function contentWorkbook(records: DraftRecord[], origin: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Plugin Soft';
  const answers = workbook.addWorksheet('الأسئلة والإجابات', {
    views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }],
  });
  const steps = workbook.addWorksheet('الخطوات والصور', {
    views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }],
  });
  answers.columns = [
    ['الكود', 22],
    ['السؤال', 48],
    ['الحالة', 20],
    ['القسم', 24],
    ['الأنشطة', 38],
    ['الإجابة المختصرة', 70],
    ['قبل البداية', 60],
    ['النتيجة المتوقعة', 60],
    ['تنبيهات', 60],
    ['الرد الجاهز', 80],
    ['نطاق الشرح', 60],
    ['تاريخ التحقق', 20],
    ['ملاحظات التحقق الداخلية', 70],
    ['النسخة', 12],
    ['آخر تعديل', 24],
    ['رابط معاينة الفريق', 65],
  ].map(([header, width]) => ({ header: String(header), width: Number(width) }));
  steps.columns = [
    ['كود الشرح', 22],
    ['السؤال', 48],
    ['رقم الخطوة', 14],
    ['عنوان الخطوة', 38],
    ['الشرح', 85],
    ['وصف الصورة', 60],
    ['رابط الصورة', 70],
  ].map(([header, width]) => ({ header: String(header), width: Number(width) }));
  for (const record of records) {
    const c = record.content,
      code = codeFor(record.id);
    answers.addRow([
      code,
      c.title,
      exportStatus(record),
      moduleName(c.module),
      c.activities.map(activityName).join('، '),
      c.summary,
      c.prerequisites.join('\n'),
      c.outcome,
      c.warnings.join('\n'),
      c.reply,
      c.scopeNote,
      c.verifiedAt,
      c.verificationNote,
      record.revision,
      record.updatedAt,
      !record.archived && record.publishedRevision ? origin + '/help/' + record.id : '',
    ]);
    c.steps.forEach((s, i) =>
      steps.addRow([
        code,
        c.title,
        i + 1,
        s.title,
        s.text,
        s.caption,
        s.image
          ? origin +
            (s.image.kind === 'asset' ? '/assets/' + s.image.name : '/api/media/' + s.image.id)
          : '',
      ]),
    );
  }
  for (const sheet of [answers, steps]) {
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };
    sheet.getRow(1).height = 32;
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7367F0' } };
    });
    sheet.eachRow((row, index) => {
      if (index > 1) {
        row.height = 90;
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'top', horizontal: 'right', wrapText: true };
          cell.font = { name: 'Arial', size: 11 };
        });
      }
    });
  }
  return workbook.xlsx.writeBuffer();
}
