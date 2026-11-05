import { arabicScore } from './arabic-search.ts';
import { z } from 'zod';
import archivedScreenshots from './screenshot-assets.json' with { type: 'json' };
export const BUNDLED_SCREENSHOTS = [
  {
    name: 'erp-sales-order.jpg',
    caption: 'شاشة أمر البيع العامة بدون اختيار عميل · نموذج غير محفوظ · 2026-11-02',
  },
  {
    name: 'erp-invoice.jpg',
    caption: 'شاشة فاتورة البيع العامة بدون اختيار عميل · نموذج غير محفوظ · 2026-11-02',
  },
  ...archivedScreenshots.map((x) => ({ name: x.name, caption: x.caption })),
];
const bundledImageNames = BUNDLED_SCREENSHOTS.map((x) => x.name) as [string, ...string[]];
export const ACTIVITIES = [
  {
    id: 'general',
    name: 'النشاط العام',
    description: 'البيع والشراء والمخازن والحسابات في الشاشات العامة.',
  },
  { id: 'restaurant', name: 'المطاعم', description: 'دليل المطعم والكاشير والطلبات والمطبخ.' },
  { id: 'construction', name: 'المقاولات', description: 'العقود ومستندات الأعمال والمتابعة.' },
  { id: 'concrete', name: 'الخرسانة', description: 'دورة الخرسانة ومستنداتها وتقاريرها.' },
  { id: 'cars', name: 'معارض السيارات', description: 'بيانات السيارات والمبيعات والمتابعة.' },
  { id: 'hr', name: 'الموارد البشرية', description: 'الموظفون والحركات والرواتب.' },
] as const;
export const MODULES = [
  { id: 'sales', name: 'المبيعات' },
  { id: 'purchases', name: 'المشتريات' },
  { id: 'products', name: 'الأصناف' },
  { id: 'inventory', name: 'المخازن والجرد' },
  { id: 'dealers', name: 'العملاء والموردون' },
  { id: 'finance', name: 'الحركات المالية' },
  { id: 'accounting', name: 'الحسابات' },
  { id: 'reports', name: 'التقارير' },
  { id: 'settings', name: 'الإعدادات والصلاحيات' },
  { id: 'hr', name: 'الموارد البشرية' },
  { id: 'support', name: 'طلب المساعدة' },
] as const;
export const ROLES = ['owner', 'reviewer', 'editor', 'support'] as const;
export type Role = (typeof ROLES)[number];
export type StaffUser = {
  userId: string;
  email: string;
  displayName: string;
  role: Role;
  active: number;
};
export const ROLE_LABELS: Record<Role, string> = {
  owner: 'مسؤول النظام',
  reviewer: 'مراجع وناشر',
  editor: 'محرر محتوى',
  support: 'فريق الدعم',
};
export const canEdit = (r: Role) => ['owner', 'reviewer', 'editor'].includes(r);
export const canPublish = (r: Role) => r === 'owner' || r === 'reviewer';
export const canManageStaff = (r: Role) => r === 'owner';
export const ACTION_LABELS: Record<string, string> = {
  'auth.login': 'دخول الفريق',
  'auth.activation': 'إصدار رابط تفعيل أو إعادة تعيين',
  'auth.password-set': 'تعيين كلمة السر وإلغاء الجلسات السابقة',
  'catalog.import': 'إضافة حزمة الأسئلة',
  create: 'إنشاء مسودة',
  save: 'حفظ المسودة',
  initial: 'المحتوى الأولي الموثّق',
  submit: 'إرسال للمراجعة',
  publish: 'اعتماد ونشر',
  return: 'إرجاع للمحرر',
  archive: 'إيقاف النشر',
  unarchive: 'إعادة لمسودة',
  restore: 'استعادة نسخة سابقة',
  'article.create': 'إنشاء مسودة',
  'article.save': 'حفظ مسودة',
  'article.submit': 'إرسال للمراجعة',
  'article.publish': 'نشر الشرح',
  'article.return': 'إرجاع للمحرر',
  'article.archive': 'إيقاف نشر شرح',
  'article.unarchive': 'استعادة شرح مؤرشف',
  'article.restore': 'استعادة نسخة كمسودة',
  'media.upload': 'رفع صورة',
  'pack.delete': 'حذف دليل العميل',
  'pack.save': 'حفظ دليل التسليم',
  'pack.archive': 'إيقاف رابط التسليم',
  'pack.activate': 'تفعيل رابط التسليم',
  'feedback.review': 'مراجعة ملاحظة عميل',
  'question.create': 'تسجيل سؤال متكرر',
  'question.repeat': 'تسجيل تكرار سؤال',
  'question.link': 'ربط سؤال بشرح',
  'question.reopen': 'إعادة فتح سؤال',
  'staff.invitation': 'السماح بدخول عضو',
  'staff.update': 'تعديل صلاحية عضو',
};
export const actionName = (id: string) => ACTION_LABELS[id] || id;
export const activitySchema = z.enum([
  'general',
  'restaurant',
  'construction',
  'concrete',
  'cars',
  'hr',
]);
export const moduleSchema = z.enum([
  'sales',
  'purchases',
  'products',
  'inventory',
  'dealers',
  'finance',
  'accounting',
  'reports',
  'settings',
  'hr',
  'support',
]);
const cleanText = (max: number) =>
  z
    .string()
    .max(max)
    .transform((v) => v.trim());
const focusSchema = z
  .object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    w: z.number().min(2).max(100),
    h: z.number().min(2).max(100),
  })
  .refine(
    (v) => v.x - v.w / 2 >= 0 && v.x + v.w / 2 <= 100 && v.y - v.h / 2 >= 0 && v.y + v.h / 2 <= 100,
    'التحديد يجب أن يكون داخل حدود الصورة.',
  );
export const imageSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('asset'), name: z.enum(bundledImageNames) }),
  z.object({ kind: z.literal('media'), id: z.string().uuid() }),
]);
export const stepSchema = z.object({
  title: cleanText(160),
  text: cleanText(1800),
  image: imageSchema.nullable(),
  caption: cleanText(280),
  focus: focusSchema.nullable(),
});
export const articleSchema = z.object({
  title: cleanText(180),
  summary: cleanText(1000),
  module: moduleSchema,
  activities: z
    .array(z.enum(['all', 'general', 'restaurant', 'construction', 'concrete', 'cars', 'hr']))
    .min(1)
    .max(7)
    .transform((v) => [...new Set(v)]),
  aliases: z.array(cleanText(100)).max(30),
  kind: z.enum(['خطوات تنفيذ', 'تشخيص مشكلة', 'شرح مفهوم', 'توضيح حسابات', 'التواصل مع الدعم']),
  scopeNote: cleanText(1200),
  prerequisites: z.array(cleanText(400)).max(12),
  prerequisitesMode: z.enum(['important', 'details', 'hidden']).optional(),
  steps: z.array(stepSchema).max(24),
  outcome: cleanText(1200),
  warnings: z.array(cleanText(600)).max(12),
  relatedIds: z
    .array(
      z
        .string()
        .regex(/^[a-zA-Z0-9-]+$/)
        .max(100),
    )
    .max(8),
  reply: cleanText(1800),
  verifiedAt: z.string().max(32),
  verificationNote: cleanText(1500),
});
export type ArticleContent = z.infer<typeof articleSchema>;
export type ArticleImage = z.infer<typeof imageSchema>;
export type Step = z.infer<typeof stepSchema>;
export type Article = {
  id: string;
  code: string;
  content: ArticleContent;
  publishedAt: string;
  revision: number;
};
export type ArticleSummary = {
  id: string;
  code: string;
  title: string;
  summary: string;
  module: string;
  activities: string[];
  aliases: string[];
  kind: string;
  stepCount: number;
  image: ArticleImage | null;
  publishedAt: string;
  revision: number;
};
export type DraftRecord = {
  id: string;
  content: ArticleContent;
  status: string;
  revision: number;
  publishedRevision: number | null;
  archived: boolean;
  reviewNote: string;
  updatedAt: string;
  publishedAt: string | null;
};
export type MediaRecord = {
  id: string;
  mime: string;
  bytes: number;
  alt: string;
  createdAt: string;
};
export type GuidePack = {
  id: string;
  title: string;
  activity: string;
  modules: string[];
  articleIds: string[];
  welcome: string;
  archived: boolean;
  revision: number;
  createdAt: string;
  updatedAt: string;
};
export const packSchema = z.object({
  title: z.string().trim().min(4).max(160),
  activity: activitySchema,
  modules: z
    .array(moduleSchema)
    .min(1)
    .max(11)
    .transform((v) => [...new Set(v)]),
  articleIds: z.array(
    z
      .string()
      .regex(/^[a-zA-Z0-9-]+$/)
      .max(100),
  ),
  welcome: cleanText(1400),
});
export function publishIssues(c: ArticleContent): string[] {
  const errors: string[] = [];
  if (c.title.length < 8) errors.push('اكتب عنوانًا واضحًا من ٨ حروف على الأقل.');
  if (c.summary.length < 20) errors.push('اكتب إجابة مختصرة مفيدة من ٢٠ حرفًا على الأقل.');
  if (!c.steps.length) errors.push('أضف خطوة واحدة على الأقل.');
  c.steps.forEach((s, i) => {
    if (s.title.length < 3 || s.text.length < 10) errors.push(`أكمل عنوان وشرح الخطوة ${i + 1}.`);
    if (!s.image) errors.push(`أضف صورة فعلية للخطوة ${i + 1}.`);
    if (s.caption.length < 5) errors.push(`أضف وصفًا للصورة في الخطوة ${i + 1}.`);
  });
  if (c.outcome.length < 10) errors.push('وضّح النتيجة التي يتأكد منها العميل.');
  if (c.reply.length < 10) errors.push('أضف صيغة رد جاهزة للدعم.');
  const verified = Date.parse(c.verifiedAt),
    today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(c.verifiedAt) ||
    Number.isNaN(verified) ||
    (!Number.isNaN(verified) && new Date(verified).toISOString().slice(0, 10) !== c.verifiedAt) ||
    c.verifiedAt > today
  )
    errors.push('أدخل تاريخ تحقق صالحًا وغير مستقبلي.');
  if (c.verificationNote.length < 12) errors.push('وثّق مصدر التحقق وحدود الشرح قبل النشر.');
  return errors;
}
export function summaryOf(
  id: string,
  c: ArticleContent,
  revision: number,
  publishedAt: string,
): ArticleSummary {
  return {
    id,
    code: codeFor(id),
    title: c.title,
    summary: c.summary,
    module: c.module,
    activities: c.activities,
    aliases: c.aliases,
    kind: c.kind,
    stepCount: c.steps.length,
    image: c.steps.find((s) => s.image)?.image ?? null,
    revision,
    publishedAt,
  };
}
export const codeFor = (id: string) =>
  id === 'open-sales-order'
    ? 'PS-001'
    : id === 'open-sales-invoice'
      ? 'PS-002'
      : id === 'search-item'
        ? 'PS-003'
        : id === 'read-totals'
          ? 'PS-004'
          : id === 'support-request'
            ? 'PS-005'
            : 'PS-' + id.replaceAll('-', '').slice(0, 12).toUpperCase();
export const normalize = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase();
export function matchesActivity(a: { activities: string[] }, activity: string) {
  return a.activities.includes('all') || a.activities.includes(activity);
}
export function matchesSearch(a: ArticleSummary, q: string) {
  return arabicScore([a.title, a.summary, ...a.aliases, a.code].join(' '), q) > 0;
}
export function imageSrc(img: ArticleImage | null) {
  return !img ? '' : img.kind === 'asset' ? '/assets/' + img.name : '/api/media/' + img.id;
}
export const activityName = (id: string) =>
  ACTIVITIES.find((a) => a.id === id)?.name ?? 'كل الأنشطة';
export const moduleName = (id: string) => MODULES.find((a) => a.id === id)?.name ?? id;
export function emptyContent(): ArticleContent {
  return {
    title: '',
    summary: '',
    module: 'sales',
    activities: ['general'],
    aliases: [],
    kind: 'خطوات تنفيذ',
    scopeNote: '',
    prerequisites: [],
    steps: [],
    outcome: '',
    warnings: [],
    relatedIds: [],
    reply: '',
    verifiedAt: '',
    verificationNote: '',
  };
}
