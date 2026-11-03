import { customerArticles } from '@/lib/customer-access';
import { getPublished } from '@/lib/guide-server';
import { database, bucket, resolveStaff, apiGuard, GuideError } from '@/lib/guide-server';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return apiGuard(async () => {
    const { id } = await context.params;
    if (!/^[a-f0-9-]{36}$/i.test(id)) throw new GuideError(404, 'الصورة غير موجودة.');
    const db = database(),
      published = await db
        .prepare('SELECT media_id FROM guide_public_media WHERE media_id=? LIMIT 1')
        .bind(id)
        .first();
    if (!(await resolveStaff())) {
      if (!published) throw new GuideError(404, 'الصورة غير متاحة.');
      const scoped = await customerArticles();
      let allowed = false;
      for (const summary of scoped.articles) {
        const article = await getPublished(summary.id);
        if (article?.content.steps.some((s) => s.image?.kind === 'media' && s.image.id === id)) {
          allowed = true;
          break;
        }
      }
      if (!allowed) throw new GuideError(404, 'الصورة غير متاحة.');
    }

    const row = await db
      .prepare('SELECT object_key,mime FROM guide_media WHERE id=?')
      .bind(id)
      .first<{ object_key: string; mime: string }>();
    if (!row) throw new GuideError(404, 'الصورة غير موجودة.');
    const object = await bucket().get(row.object_key);
    if (!object) throw new GuideError(404, 'الصورة غير موجودة.');
    return new Response(object.body, {
      headers: {
        'Content-Type': row.mime,
        'Content-Length': String(object.size),
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline',
      },
    });
  });
}
