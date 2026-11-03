import { env } from 'cloudflare:workers';
import { teamSession } from './team-auth';
import { redirect } from 'next/navigation';
import seedData from './seed-articles.json';
import releasedData from './released-articles.json';
import releaseBaselines from './release-baselines.json';
import { matchesReviewedBaseline } from './release-policy';
import {
  articleSchema,
  codeFor,
  summaryOf,
  matchesActivity,
  type Article,
  type ArticleContent,
  type ArticleSummary,
  type StaffUser,
  type GuidePack,
  type DraftRecord,
  type Role,
} from './guide-model';

export class GuideError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
export const now = () => new Date().toISOString();
export function database() {
  if (!env.DB) throw new GuideError(503, 'قاعدة البيانات غير متاحة حاليًا. حاول مرة أخرى.');
  return env.DB;
}
export function bucket() {
  if (!env.BUCKET) throw new GuideError(503, 'تخزين الصور غير متاح حاليًا.');
  return env.BUCKET;
}
export const seeds = [...seedData, ...releasedData].map((s) => ({
  id: s.id,
  content: articleSchema.parse(s.content),
}));
const seededAt = '2026-11-03T00:00:00.000Z';
export async function seedInitialContent() {
  const db = database();
  const existing = await db.prepare('SELECT id FROM guide_articles').all<{ id: string }>();
  const present = new Set(existing.results.map((r) => r.id));
  const missing = seeds.filter((s) => !present.has(s.id));
  for (let offset = 0; offset < missing.length; offset += 20) {
    const chunk = missing.slice(offset, offset + 20);
    await db.batch(
      chunk.map((s) =>
        db
          .prepare(
            `INSERT OR IGNORE INTO guide_articles (id,draft_json,draft_summary,published_json,published_summary,status,revision,published_revision,archived,review_note,updated_by,updated_at,published_at) VALUES (?,?,?,?,?,'published',1,1,0,'','initial-screenshot-content',?,?)`,
          )
          .bind(
            s.id,
            JSON.stringify(s.content),
            JSON.stringify(summaryOf(s.id, s.content, 1, seededAt)),
            JSON.stringify({ ...s.content, verificationNote: '' }),
            JSON.stringify(summaryOf(s.id, s.content, 1, seededAt)),
            seededAt,
            seededAt,
          ),
      ),
    );
  }
  const baselineHashes = releaseBaselines as Record<string, string>;
  const candidates = await db
    .prepare(
      "SELECT id,draft_json,revision FROM guide_articles WHERE status='draft' AND archived=0 AND published_json IS NULL",
    )
    .all<{ id: string; draft_json: string; revision: number }>();
  for (const row of candidates.results) {
    const expected = baselineHashes[row.id],
      seed = seeds.find((s) => s.id === row.id);
    if (
      row.revision !== 1 ||
      !expected ||
      !seed ||
      !(await matchesReviewedBaseline(row.draft_json, expected))
    )
      continue;
    const op = crypto.randomUUID(),
      revision = row.revision + 1,
      content = JSON.stringify(seed.content),
      stamp = now();
    const summary = JSON.stringify(summaryOf(seed.id, seed.content, revision, stamp));
    await db.batch([
      db
        .prepare(
          `INSERT INTO guide_revisions (id,article_id,revision,content_json,action,actor_id,note,created_at)
        SELECT ?,id,revision+1,?,'publish','bundled-reviewed-release','Reviewed ERP source release',? FROM guide_articles
        WHERE id=? AND revision=? AND draft_json=? AND status='draft' AND archived=0 AND published_json IS NULL`,
        )
        .bind(op, content, stamp, row.id, row.revision, row.draft_json),
      db
        .prepare(
          `UPDATE guide_articles SET draft_json=?,draft_summary=?,published_json=?,published_summary=?,status='published',revision=?,published_revision=?,review_note='',updated_by='bundled-reviewed-release',updated_at=?,published_at=?
        WHERE id=? AND revision=? AND draft_json=? AND status='draft' AND archived=0 AND published_json IS NULL AND EXISTS(SELECT 1 FROM guide_revisions WHERE id=?)`,
        )
        .bind(
          content,
          summary,
          JSON.stringify({ ...seed.content, verificationNote: '' }),
          summary,
          revision,
          revision,
          stamp,
          stamp,
          row.id,
          row.revision,
          row.draft_json,
          op,
        ),
      db
        .prepare(
          `INSERT INTO guide_audit (id,actor_id,action,entity_id,detail,created_at)
        SELECT ?,'bundled-reviewed-release','article.publish',?,'Reviewed source release; unchanged baseline draft',? WHERE EXISTS(SELECT 1 FROM guide_revisions WHERE id=?)`,
        )
        .bind(crypto.randomUUID(), row.id, stamp, op),
    ]);
  }
  const histories = await db
    .prepare('SELECT article_id FROM guide_revisions WHERE revision=1')
    .all<{ article_id: string }>();
  const recorded = new Set(histories.results.map((r) => r.article_id));
  const missingHistory = seeds.filter((s) => !recorded.has(s.id));
  for (let offset = 0; offset < missingHistory.length; offset += 20) {
    await db.batch(
      missingHistory
        .slice(offset, offset + 20)
        .map((s) =>
          db
            .prepare(
              `INSERT INTO guide_revisions (id,article_id,revision,content_json,action,actor_id,note,created_at) SELECT ?,id,1,draft_json,'initial','initial-screenshot-content','Initial screenshot-backed content',? FROM guide_articles WHERE id=? AND revision=1 AND updated_by='initial-screenshot-content' AND NOT EXISTS(SELECT 1 FROM guide_revisions WHERE article_id=? AND revision=1)`,
            )
            .bind(crypto.randomUUID(), seededAt, s.id, s.id),
        ),
    );
  }
}
type Row = Record<string, unknown>;
export function draftFromRow(r: Row): DraftRecord {
  return {
    id: String(r.id),
    content: articleSchema.parse(JSON.parse(String(r.draft_json))),
    status: String(r.status),
    revision: Number(r.revision),
    publishedRevision: r.published_revision === null ? null : Number(r.published_revision),
    archived: !!r.archived,
    reviewNote: String(r.review_note ?? ''),
    updatedAt: String(r.updated_at),
    publishedAt: r.published_at ? String(r.published_at) : null,
  };
}
export function packFromRow(r: Row): GuidePack {
  return {
    id: String(r.id),
    title: String(r.title),
    activity: String(r.activity),
    modules: JSON.parse(String(r.modules_json)),
    articleIds: JSON.parse(String(r.article_ids_json)),
    welcome: String(r.welcome),
    archived: !!r.archived,
    revision: Number(r.revision),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}
export async function resolveStaff(): Promise<StaffUser | null> {
  return teamSession();
}
export async function requireStaff(roles?: Role[]) {
  const staff = await teamSession();
  if (!staff) throw new GuideError(401, 'سجّل الدخول بحساب الفريق أولًا.');
  if (roles && !roles.includes(staff.role))
    throw new GuideError(403, 'صلاحيتك لا تسمح بتنفيذ الإجراء ده.');
  return staff;
}
export async function staffPage() {
  const staff = await teamSession();
  if (!staff) redirect('/team/login');
  await seedInitialContent();
  return staff;
}
export async function listPublished(): Promise<ArticleSummary[]> {
  const rows = await database()
    .prepare('SELECT id,published_summary FROM guide_articles')
    .all<{ id: string; published_summary: string | null }>();
  const present = new Set(rows.results.map((r) => r.id));
  const summaries = rows.results
    .filter((r) => r.published_summary)
    .map((r) => JSON.parse(r.published_summary!) as ArticleSummary);
  // Initial, bounded screenshot articles ship with the app; any DB row supersedes its seed, including an archived row.
  for (const s of seeds)
    if (!present.has(s.id)) summaries.push(summaryOf(s.id, s.content, 1, seededAt));
  return summaries.sort(
    (a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.code.localeCompare(b.code),
  );
}
export async function getPublished(id: string): Promise<Article | null> {
  const row = await database()
    .prepare(
      'SELECT published_json,published_revision,published_at,archived FROM guide_articles WHERE id=?',
    )
    .bind(id)
    .first<Row>();
  if (row) {
    if (row.archived || !row.published_json) return null;
    return {
      id,
      code: codeFor(id),
      content: {
        ...articleSchema.parse(JSON.parse(String(row.published_json))),
        verificationNote: '',
      },
      publishedAt: String(row.published_at),
      revision: Number(row.published_revision),
    };
  }
  const seed = seeds.find((s) => s.id === id);
  return seed
    ? {
        id,
        code: codeFor(id),
        content: { ...seed.content, verificationNote: '' },
        publishedAt: seededAt,
        revision: 1,
      }
    : null;
}
export async function getDraft(id: string) {
  const r = await database()
    .prepare('SELECT * FROM guide_articles WHERE id=?')
    .bind(id)
    .first<Row>();
  if (!r) throw new GuideError(404, 'الشرح غير موجود.');
  return draftFromRow(r);
}
export async function getPack(id: string, includeArchived = false) {
  const r = await database().prepare('SELECT * FROM guide_packs WHERE id=?').bind(id).first<Row>();
  if (!r || (!includeArchived && r.archived)) return null;
  return packFromRow(r);
}
export async function packArticles(pack: GuidePack) {
  const list = (await listPublished()).filter(
    (a) =>
      matchesActivity(a, pack.activity) &&
      pack.modules.includes(a.module) &&
      (!pack.articleIds.length || pack.articleIds.includes(a.id)),
  );
  return list;
}
export async function mediaExists(content: ArticleContent) {
  const ids = [
    ...new Set(content.steps.flatMap((s) => (s.image?.kind === 'media' ? [s.image.id] : []))),
  ];
  if (!ids.length) return;
  const rows = await database()
    .prepare(`SELECT id FROM guide_media WHERE id IN (${ids.map(() => '?').join(',')})`)
    .bind(...ids)
    .all<{ id: string }>();
  if (rows.results.length !== ids.length)
    throw new GuideError(400, 'بعض الصور غير موجودة في المكتبة. اختَر صورًا مرفوعة على الموقع.');
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Cookie' },
  });
}
export async function apiGuard(fn: () => Promise<Response>) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof GuideError) return json({ error: e.message, details: e.details }, e.status);
    if (e instanceof Error && e.name === 'ZodError')
      return json(
        { error: 'راجع البيانات المطلوبة وحدود الحقول.', details: JSON.parse(e.message) },
        400,
      );
    console.error('guide_operation_failed', e instanceof Error ? e.message : 'unknown');
    return json({ error: 'تعذر تنفيذ الطلب. حاول مرة أخرى أو راجع مسؤول النظام.' }, 500);
  }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('Origin');
  if (!origin || origin !== new URL(request.url).origin)
    throw new GuideError(403, 'الطلب لازم يبدأ من نفس الموقع.');
}
export async function readLimited(request: Request, limit: number) {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) {
      await reader.cancel();
      throw new GuideError(413, 'حجم الطلب أكبر من المسموح.');
    }
    chunks.push(value);
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}
export async function bodyJSON(request: Request) {
  if (!request.headers.get('Content-Type')?.includes('application/json'))
    throw new GuideError(415, 'صيغة الطلب غير صحيحة.');
  const text = new TextDecoder().decode(await readLimited(request, 160000));
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new GuideError(400, 'البيانات غير صالحة.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new GuideError(400, 'البيانات لازم تكون نموذجًا صالحًا.');
  return value as Record<string, unknown>;
}
export function auditStatement(actor: string, action: string, entity: string, detail = '') {
  return database()
    .prepare(
      'INSERT INTO guide_audit (id,actor_id,action,entity_id,detail,created_at) VALUES (?,?,?,?,?,?)',
    )
    .bind(crypto.randomUUID(), actor, action, entity, detail.slice(0, 1200), now());
}
export async function hashValue(value: string) {
  const salt = env.GUIDE_RATE_SECRET;
  if (!salt) throw new GuideError(503, 'إعداد استقبال التقييمات غير مكتمل.');
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(salt + ':' + value),
  );
  return [...new Uint8Array(digest)].map((v) => v.toString(16).padStart(2, '0')).join('');
}
export async function rateLimit(request: Request) {
  const seconds = Math.floor(Date.now() / 1000),
    window = Math.floor(seconds / 3600),
    ip = request.headers.get('CF-Connecting-IP') || 'local';
  const key = 'feedback:' + window + ':' + (await hashValue(ip));
  const r = await database()
    .prepare(
      'INSERT INTO guide_rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count',
    )
    .bind(key, (window + 1) * 3600)
    .first<{ count: number }>();
  if (!r || r.count > 40) throw new GuideError(429, 'وصلت لعدد المحاولات المسموح. جرّب بعد شوية.');
  if (Math.random() < 0.05)
    await database()
      .prepare('DELETE FROM guide_rate_limits WHERE expires_at<?')
      .bind(seconds - 86400)
      .run();
}
