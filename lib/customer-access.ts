import { cookies } from 'next/headers';
import { getPack, packArticles, resolveStaff, GuideError } from './guide-server';
import { customerReply, REPLY_COOKIE } from './reply-access';
export const CUSTOMER_COOKIE = 'guide_customer_pack';
export async function customerPack(explicit?: string) {
  if (!explicit && (await cookies()).get(REPLY_COOKIE)?.value) return null;
  const id = explicit || (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!id || !/^[a-f0-9-]{36}$/i.test(id)) return null;
  return getPack(id);
}
export async function customerArticles(explicit?: string) {
  if (!explicit && (await cookies()).get(REPLY_COOKIE)?.value) {
    const scope = await customerReply();
    if (!scope) throw new GuideError(404, 'رابط الإجابة غير متاح أو تم إيقافه.');
    return { pack: scope.pack, articles: [scope.summary] };
  }
  const pack = await customerPack(explicit);
  if (!pack) throw new GuideError(404, 'الدليل غير متاح أو تم إيقافه.');
  return { pack, articles: await packArticles(pack) };
}
export async function allowedCustomerArticle(id: string, explicit?: string) {
  if (!explicit && (await resolveStaff())) return true;
  try {
    return (await customerArticles(explicit)).articles.some((a) => a.id === id);
  } catch {
    return false;
  }
}
