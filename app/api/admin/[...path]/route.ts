import businessRules from '@/lib/source-business-rules.json';
import { env } from 'cloudflare:workers';
import { createReplyToken } from '@/lib/reply-token';
import { getPublished } from '@/lib/guide-server';
import { issueActivation } from '@/lib/team-auth';
import { z } from 'zod';
import { canEdit, canManageStaff, publishIssues, type Role } from '@/lib/guide-model';
import {
  requireStaff,
  database,
  apiGuard,
  json,
  sameOrigin,
  bodyJSON,
  readLimited,
  getDraft,
  draftFromRow,
  bucket,
  now,
  GuideError,
  auditStatement,
  packFromRow,
} from '@/lib/guide-server';
import { createDraft, changeArticle, savePack } from '@/lib/guide-write';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ path: string[] }> };
const reviewing: Role[] = ['owner', 'reviewer'];
export async function GET(request: Request, context: Context) {
  return apiGuard(async () => {
    const user = await requireStaff(),
      { path } = await context.params,
      db = database(),
      url = new URL(request.url);
    if (path[0] === 'readiness' && path.length === 1) {
      if (!canEdit(user.role)) throw new GuideError(403, 'مراجعة الجاهزية متاحة للمحررين فقط.');
      const rows = await db
        .prepare(
          'SELECT * FROM guide_articles WHERE archived=0 ORDER BY updated_at DESC LIMIT 1000',
        )
        .all<Record<string, unknown>>();
      return json({
        articles: rows.results.map((row) => {
          const record = draftFromRow(row),
            c = record.content;
          return {
            id: record.id,
            title: c.title,
            module: c.module,
            status: record.status,
            missingImageSteps: c.steps.flatMap((s, i) => (s.image ? [] : [i + 1])),
            issues: publishIssues(c),
            sourceReviewed: c.verificationNote.startsWith('SOURCE_REVIEW'),
            verifiedAt: c.verifiedAt,
          };
        }),
      });
    }
    if (path[0] === 'business' && path.length === 1) return json({ rules: businessRules });
    if (path[0] === 'session') return json({ user });
    if (path[0] === 'articles' && path.length === 1) {
      const rows = await db
        .prepare(
          `SELECT id,draft_summary,published_summary,status,revision,published_revision,archived,updated_at FROM guide_articles ORDER BY updated_at DESC LIMIT 1000`,
        )
        .all<Record<string, unknown>>();
      return json({
        articles: rows.results
          .filter((r) => user.role !== 'support' || r.published_summary)
          .map((r) => ({
            ...JSON.parse(String(user.role === 'support' ? r.published_summary : r.draft_summary)),
            status: r.status,
            revision: r.revision,
            publishedRevision: r.published_revision,
            archived: !!r.archived,
            updatedAt: r.updated_at,
            hasPublished: !!r.published_summary,
          })),
        limit: 1000,
      });
    }
    if (path[0] === 'articles' && path.length === 2) {
      if (!canEdit(user.role)) throw new GuideError(403, 'المسودات متاحة للمحررين والمراجعين فقط.');
      return json(await getDraft(path[1]));
    }
    if (path[0] === 'articles' && path[2] === 'history') {
      if (!canEdit(user.role)) throw new GuideError(403, 'سجل النسخ غير متاح لصلاحيتك.');
      const rows = await db
        .prepare(
          'SELECT id,revision,action,note,created_at FROM guide_revisions WHERE article_id=? ORDER BY revision DESC LIMIT 100',
        )
        .bind(path[1])
        .all();
      return json({ revisions: rows.results });
    }
    if (path[0] === 'media') {
      if (!canEdit(user.role)) throw new GuideError(403, 'مكتبة الصور متاحة للمحررين فقط.');
      const page = Math.max(0, Math.min(10000, Number(url.searchParams.get('page')) || 0));
      const rows = await db
        .prepare(
          'SELECT id,mime,bytes,alt,created_at AS createdAt FROM guide_media ORDER BY created_at DESC LIMIT 60 OFFSET ?',
        )
        .bind(page * 60)
        .all();
      return json({ media: rows.results, page });
    }
    if (path[0] === 'packs') {
      const rows = await db
        .prepare('SELECT * FROM guide_packs ORDER BY updated_at DESC LIMIT 300')
        .all<Record<string, unknown>>();
      return json({ packs: rows.results.map(packFromRow) });
    }
    if (path[0] === 'feedback') {
      const rows = await db
        .prepare(
          'SELECT id,article_id,vote,comment,resolved,created_at FROM guide_feedback ORDER BY created_at DESC LIMIT 300',
        )
        .all();
      return json({ feedback: rows.results });
    }
    if (path[0] === 'dashboard') {
      const [articleCounts, packCounts, feedbackCounts] = await db.batch([
        db.prepare(
          `SELECT COUNT(*) AS total,SUM(CASE WHEN published_json IS NOT NULL AND archived=0 THEN 1 ELSE 0 END) AS published,SUM(CASE WHEN status='review' THEN 1 ELSE 0 END) AS review,SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) AS draft FROM guide_articles`,
        ),
        db.prepare(
          'SELECT COUNT(*) AS total,COALESCE(SUM(CASE WHEN archived=0 THEN 1 ELSE 0 END),0) AS active FROM guide_packs',
        ),
        db.prepare(
          `SELECT COUNT(*) AS total,COALESCE(SUM(CASE WHEN vote='no' AND resolved=0 THEN 1 ELSE 0 END),0) AS needs_attention FROM guide_feedback`,
        ),
      ]);
      return json({
        articles: articleCounts.results[0],
        packs: packCounts.results[0],
        feedback: feedbackCounts.results[0],
      });
    }
    if (path[0] === 'staff') {
      if (!canManageStaff(user.role)) throw new GuideError(403, 'إدارة الفريق لمسؤول النظام فقط.');
      const [members, invites] = await db.batch([
        db.prepare(
          'SELECT user_id AS userId,email,display_name AS displayName,role,active,EXISTS(SELECT 1 FROM guide_credentials c WHERE c.user_id=guide_staff.user_id) AS hasPassword FROM guide_staff ORDER BY created_at',
        ),
        db.prepare(
          'SELECT email,role,active,created_at AS createdAt FROM guide_invitations ORDER BY created_at DESC',
        ),
      ]);
      return json({ members: members.results, invitations: invites.results });
    }
    if (path[0] === 'audit') {
      if (!reviewing.includes(user.role))
        throw new GuideError(403, 'السجل متاح للمراجع والمسؤول فقط.');
      const logs = await db
        .prepare(
          'SELECT action,entity_id,detail,created_at FROM guide_audit ORDER BY created_at DESC LIMIT 100',
        )
        .all();
      return json({ logs: logs.results });
    }
    if (path[0] === 'export') {
      if (!reviewing.includes(user.role))
        throw new GuideError(403, 'تصدير المحتوى متاح للمراجع والمسؤول فقط.');
      const [a, r, p, m] = await db.batch([
        db.prepare('SELECT * FROM guide_articles'),
        db.prepare('SELECT * FROM guide_revisions'),
        db.prepare('SELECT * FROM guide_packs'),
        db.prepare('SELECT id,mime,bytes,alt FROM guide_media'),
      ]);
      return new Response(
        JSON.stringify(
          {
            format: 'plugin-guide-content-v1',
            exportedAt: now(),
            articles: a.results,
            revisions: r.results,
            packs: p.results,
            media: m.results,
          },
          null,
          2,
        ),
        {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': 'attachment; filename="plugin-guide-content.json"',
            'Cache-Control': 'no-store',
          },
        },
      );
    }
    throw new GuideError(404, 'المسار غير موجود.');
  });
}
export async function POST(request: Request, context: Context) {
  return apiGuard(async () => {
    sameOrigin(request);
    const { path } = await context.params,
      user = await requireStaff(),
      db = database();
    if (path[0] === 'replies' && path.length === 1) {
      const v = z
        .object({ articleId: z.string().regex(/^[a-zA-Z0-9-]{1,100}$/) })
        .strict()
        .parse(await bodyJSON(request));
      if (!(await getPublished(v.articleId)))
        throw new GuideError(404, 'الشرح غير منشور أو تم إيقافه.');
      if (!env.GUIDE_RATE_SECRET) throw new GuideError(503, 'إعداد روابط الرد غير مكتمل.');
      const token = await createReplyToken(env.GUIDE_RATE_SECRET, v.articleId);
      return json({ path: '/help/' + v.articleId + '?reply=' + token });
    }
    if (path[0] === 'media') {
      if (!canEdit(user.role)) throw new GuideError(403, 'رفع الصور متاح للمحررين فقط.');
      if (Number(request.headers.get('Content-Length') || 0) > 7 * 1024 * 1024)
        throw new GuideError(413, 'الحد الأقصى للصورة ٦ ميجابايت.');
      const contentType = request.headers.get('Content-Type') || '';
      if (!contentType.startsWith('multipart/form-data;'))
        throw new GuideError(415, 'ارفع الصورة من نموذج مكتبة الصور.');
      const data = await readLimited(request, 7 * 1024 * 1024);
      const form = await new Response(data, {
          headers: { 'Content-Type': contentType },
        }).formData(),
        file = form.get('file'),
        alt = String(form.get('alt') || '').trim();
      if (!(file instanceof File) || file.size > 6 * 1024 * 1024 || file.size < 20)
        throw new GuideError(400, 'اختَر صورة من PNG أو JPEG أو WebP بحجم حتى ٦ ميجابايت.');
      if (alt.length < 5 || alt.length > 280)
        throw new GuideError(400, 'اكتب وصفًا للصورة من ٥ إلى ٢٨٠ حرفًا.');
      const bytes = new Uint8Array(await file.arrayBuffer());
      let mime = '';
      if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71)
        mime = 'image/png';
      else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) mime = 'image/jpeg';
      else if (
        String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
        String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
      )
        mime = 'image/webp';
      if (!mime) throw new GuideError(415, 'نوع الصورة غير مدعوم. لا ترفع SVG أو ملفات مستندات.');
      const id = crypto.randomUUID(),
        key = 'guide-media/' + id;
      await bucket().put(key, bytes, { httpMetadata: { contentType: mime } });
      try {
        await db.batch([
          db
            .prepare(
              'INSERT INTO guide_media (id,object_key,mime,bytes,alt,uploaded_by,created_at) VALUES (?,?,?,?,?,?,?)',
            )
            .bind(id, key, mime, bytes.length, alt, user.userId, now()),
          auditStatement(user.userId, 'media.upload', id),
        ]);
      } catch (e) {
        await bucket().delete(key);
        throw e;
      }
      return json({ id, mime, bytes: bytes.length, alt }, 201);
    }
    const raw = await bodyJSON(request);
    if (path[0] === 'articles' && path.length === 1) {
      if (!canEdit(user.role)) throw new GuideError(403, 'إنشاء الشروحات متاح للمحررين فقط.');
      return json(await createDraft(user, raw.content), 201);
    }
    if (path[0] === 'articles' && path[2] === 'transition') {
      if (!canEdit(user.role)) throw new GuideError(403, 'تعديل الشروحات غير متاح لصلاحيتك.');
      const v = z
        .object({
          revision: z.number().int().min(1),
          action: z.enum(['submit', 'publish', 'return', 'archive', 'unarchive', 'restore']),
          note: z.string().max(1200).optional(),
          historyId: z.string().uuid().optional(),
        })
        .parse(raw);
      return json(
        await changeArticle(user, path[1], v.revision, v.action, undefined, v.note, v.historyId),
      );
    }
    if (path[0] === 'packs' && path.length === 1) return json(await savePack(user, raw), 201);
    if (path[0] === 'feedback' && path[1]) {
      const v = z.object({ resolved: z.boolean() }).parse(raw);
      await db.batch([
        db
          .prepare('UPDATE guide_feedback SET resolved=? WHERE id=?')
          .bind(v.resolved ? 1 : 0, path[1]),
        auditStatement(user.userId, 'feedback.review', path[1]),
      ]);
      return json({ ok: true });
    }
    if (path[0] === 'staff' && path[1] === 'activation' && path[2]) {
      if (!canManageStaff(user.role)) throw new GuideError(403, 'الإجراء لمسؤول الفريق فقط.');
      const member = await db
        .prepare('SELECT user_id,active FROM guide_staff WHERE user_id=?')
        .bind(path[2])
        .first<{ user_id: string; active: number }>();
      if (!member || !member.active) throw new GuideError(400, 'فعّل العضو أولًا.');
      await db.prepare('DELETE FROM guide_sessions WHERE user_id=?').bind(member.user_id).run();
      return json({ activationPath: await issueActivation(member.user_id, user.userId) });
    }
    if (path[0] === 'staff' && path[1] === 'invitations') {
      if (!canManageStaff(user.role)) throw new GuideError(403, 'إضافة الأعضاء لمسؤول الفريق فقط.');
      const v = z
          .object({
            email: z.string().trim().email().max(254),
            displayName: z.string().trim().min(2).max(120),
            role: z.enum(['reviewer', 'editor', 'support']),
          })
          .parse(raw),
        email = v.email.toLowerCase();
      const existing = await db
        .prepare('SELECT user_id FROM guide_staff WHERE lower(email)=?')
        .bind(email)
        .first();
      if (existing)
        throw new GuideError(409, 'البريد موجود بالفعل. استخدم رابط إعادة تعيين من قائمة الأعضاء.');
      const id = crypto.randomUUID(),
        stamp = now();
      await db.batch([
        db
          .prepare(
            'INSERT INTO guide_staff (user_id,email,display_name,role,active,created_at,updated_at) VALUES (?,?,?,?,1,?,?)',
          )
          .bind(id, email, v.displayName, v.role, stamp, stamp),
        auditStatement(user.userId, 'staff.invitation', id),
      ]);
      return json({ activationPath: await issueActivation(id, user.userId) }, 201);
    }
    throw new GuideError(404, 'المسار غير موجود.');
  });
}
export async function PUT(request: Request, context: Context) {
  return apiGuard(async () => {
    sameOrigin(request);
    const { path } = await context.params,
      user = await requireStaff(),
      db = database(),
      raw = await bodyJSON(request);
    if (path[0] === 'articles' && path.length === 2) {
      if (!canEdit(user.role)) throw new GuideError(403, 'الحفظ متاح للمحررين فقط.');
      const v = z.object({ revision: z.number().int().min(1), content: z.unknown() }).parse(raw);
      return json(await changeArticle(user, path[1], v.revision, 'save', v.content));
    }
    if (path[0] === 'packs' && path.length === 2) {
      const revision = z.number().int().min(1).parse(raw.revision);
      if (raw.action === 'delete') {
        const result = await db.batch([
          db
            .prepare(
              'INSERT INTO guide_audit (id,actor_id,action,entity_id,detail,created_at) SELECT ?,?,?,id,?,? FROM guide_packs WHERE id=? AND revision=?',
            )
            .bind(
              crypto.randomUUID(),
              user.userId,
              'pack.delete',
              'Deleted customer handover guide',
              now(),
              path[1],
              revision,
            ),
          db.prepare('DELETE FROM guide_packs WHERE id=? AND revision=?').bind(path[1], revision),
        ]);
        if (!result[1].meta.changes)
          throw new GuideError(409, 'الدليل اتعدل أو اتحذف. حدّث القائمة.');
        return json({ ok: true });
      }

      if (raw.action === 'archive' || raw.action === 'activate') {
        const r = await db
          .prepare(
            'UPDATE guide_packs SET archived=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?',
          )
          .bind(raw.action === 'archive' ? 1 : 0, now(), path[1], revision)
          .run();
        if (!r.meta.changes) throw new GuideError(409, 'الدليل اتعدّل أو غير موجود.');
        await auditStatement(user.userId, 'pack.' + raw.action, path[1]).run();
        return json({ ok: true });
      }
      return json(await savePack(user, raw, path[1], revision));
    }
    if (path[0] === 'staff' && path.length === 2) {
      if (!canManageStaff(user.role))
        throw new GuideError(403, 'تعديل الأعضاء متاح لمسؤول النظام فقط.');
      const v = z
        .object({ role: z.enum(['reviewer', 'editor', 'support']), active: z.boolean() })
        .parse(raw);
      const target = await db
        .prepare('SELECT role FROM guide_staff WHERE user_id=?')
        .bind(path[1])
        .first<{ role: string }>();
      if (!target) throw new GuideError(404, 'العضو غير موجود.');
      if (target.role === 'owner' || path[1] === user.userId)
        throw new GuideError(400, 'لا يمكن تعديل أو تعطيل حساب المسؤول الأساسي من هنا.');
      await db.batch([
        db
          .prepare('UPDATE guide_staff SET role=?,active=?,updated_at=? WHERE user_id=?')
          .bind(v.role, v.active ? 1 : 0, now(), path[1]),
        db.prepare('DELETE FROM guide_sessions WHERE user_id=?').bind(path[1]),
        db.prepare('DELETE FROM guide_activation_tokens WHERE user_id=?').bind(path[1]),
        auditStatement(user.userId, 'staff.update', path[1], v.role + ':' + v.active),
      ]);
      return json({ ok: true });
    }
    throw new GuideError(404, 'المسار غير موجود.');
  });
}
