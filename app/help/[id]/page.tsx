import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CUSTOMER_COOKIE } from '@/lib/customer-access';
import { customerPack, allowedCustomerArticle } from '@/lib/customer-access';
import { notFound } from 'next/navigation';
import { getPublished, listPublished, getPack, packArticles } from '@/lib/guide-server';
import { ACTIVITIES, matchesActivity } from '@/lib/guide-model';
import { ArticleView } from '@/components/guide/ArticleView';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const a = await getPublished((await params).id);
  return { title: a?.content.title || 'الشرح غير متاح' };
}
export default async function Help({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params,
    p = await searchParams,
    a = await getPublished(id);
  if (!a || !(await allowedCustomerArticle(id, p.guide))) notFound();
  const activity = ACTIVITIES.some((v) => v.id === p.activity) ? p.activity! : 'general';
  const pack = await customerPack(p.guide);
  if (p.guide && !pack) notFound();
  const available = pack ? await packArticles(pack) : await listPublished();
  if (pack && !available.some((x) => x.id === id)) notFound();
  if (pack && (await cookies()).get(CUSTOMER_COOKIE)?.value !== pack.id)
    redirect('/api/customer/access?guide=' + pack.id + '&article=' + encodeURIComponent(id));
  const scopedActivity = pack?.activity || activity;
  const related = available.filter(
    (x) => a.content.relatedIds.includes(x.id) && matchesActivity(x, scopedActivity),
  );
  return <ArticleView article={a} related={related} activity={scopedActivity} packId={pack?.id} />;
}
