import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
import { getPack, packArticles, getPublished } from './guide-server';
import { summaryOf } from './guide-model';
import { readReplyToken } from './reply-token';
export const REPLY_COOKIE = 'guide_customer_reply';
export async function customerReply(explicit?: string) {
  const token = explicit || (await cookies()).get(REPLY_COOKIE)?.value;
  if (!token) return null;
  const grant = await readReplyToken(env.GUIDE_RATE_SECRET || '', token);
  if (!grant) return null;
  const article = await getPublished(grant.articleId);
  if (!article) return null;
  const pack = grant.packId ? await getPack(grant.packId) : null;
  if (grant.packId && (!pack || !(await packArticles(pack)).some((a) => a.id === grant.articleId)))
    return null;
  const activity =
    pack?.activity || article.content.activities.find((a) => a !== 'all') || 'general';
  return {
    token,
    pack,
    activity,
    article,
    summary: summaryOf(article.id, article.content, article.revision, article.publishedAt),
  };
}
