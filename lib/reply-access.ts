import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
import { getPack, packArticles, getPublished } from './guide-server';
import { readReplyToken } from './reply-token';
export const REPLY_COOKIE = 'guide_customer_reply';
export async function customerReply(explicit?: string) {
  const token = explicit || (await cookies()).get(REPLY_COOKIE)?.value;
  if (!token) return null;
  const grant = await readReplyToken(env.GUIDE_RATE_SECRET || '', token);
  if (!grant) return null;
  const pack = await getPack(grant.packId);
  if (!pack) return null;
  const summary = (await packArticles(pack)).find((a) => a.id === grant.articleId);
  if (!summary) return null;
  const article = await getPublished(grant.articleId);
  return article ? { token, pack, summary, article } : null;
}
