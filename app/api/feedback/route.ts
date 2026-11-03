import { allowedCustomerArticle } from '@/lib/customer-access';
import { customerReply } from '@/lib/reply-access';
import { z } from 'zod';
import {
  apiGuard,
  sameOrigin,
  bodyJSON,
  getPublished,
  rateLimit,
  hashValue,
  database,
  GuideError,
  json,
  now,
} from '@/lib/guide-server';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  return apiGuard(async () => {
    sameOrigin(request);
    await rateLimit(request);
    const v = z
      .object({
        articleId: z.string().max(100),
        vote: z.enum(['yes', 'no']),
        comment: z.string().trim().max(600).default(''),
        replyToken: z.string().max(1000).optional(),
      })
      .parse(await bodyJSON(request));
    const allowed = v.replyToken
      ? (await customerReply(v.replyToken))?.article.id === v.articleId
      : await allowedCustomerArticle(v.articleId);
    if (!allowed || !(await getPublished(v.articleId)))
      throw new GuideError(404, 'الشرح غير متاح حاليًا.');
    const cookie = request.headers.get('Cookie') || '',
      old = cookie.match(/(?:^|;\s*)guide_visitor=([a-f0-9-]{36})(?:;|$)/i)?.[1],
      visitor = old || crypto.randomUUID(),
      visitorHash = await hashValue(visitor);
    const stamp = now(),
      voteDay = stamp.slice(0, 10);
    const result = await database()
      .prepare(
        'INSERT OR IGNORE INTO guide_feedback (id,article_id,vote,comment,visitor_hash,vote_day,resolved,created_at) VALUES (?,?,?,?,?,?,0,?)',
      )
      .bind(crypto.randomUUID(), v.articleId, v.vote, v.comment, visitorHash, voteDay, stamp)
      .run();
    if (!result.meta.changes)
      throw new GuideError(409, 'تقييمك للشرح اتسجّل بالفعل النهارده، شكرًا ليك.');
    const response = json({ ok: true });
    response.headers.set(
      'Set-Cookie',
      `guide_visitor=${visitor}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`,
    );
    return response;
  });
}
