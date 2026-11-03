import { cookies } from 'next/headers';
import { getPack, packArticles, resolveStaff, GuideError } from './guide-server';
export const CUSTOMER_COOKIE = 'guide_customer_pack';
export async function customerPack(explicit?: string) {
  const id = explicit || (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!id || !/^[a-f0-9-]{36}$/i.test(id)) return null;
  return getPack(id);
}
export async function customerArticles(explicit?: string) {
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
