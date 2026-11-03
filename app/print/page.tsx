import { customerPack, allowedCustomerArticle } from '@/lib/customer-access';
import { resolveStaff } from '@/lib/guide-server';
import { notFound } from 'next/navigation';
import { listPublished, getPublished, getPack, packArticles } from '@/lib/guide-server';
import { matchesActivity, type Article, ACTIVITIES } from '@/lib/guide-model';
import { PrintGuide } from '@/components/guide/PrintGuide';
export const dynamic = 'force-dynamic';
export default async function Print({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams,
    activity = ACTIVITIES.some((a) => a.id === p.activity) ? p.activity! : 'general';
  const pack = await customerPack(p.guide);
  if (!pack && !(await resolveStaff())) notFound();
  if (p.article && !(await allowedCustomerArticle(p.article, p.guide))) notFound();
  if (p.guide && !pack) notFound();
  if (pack && (!p.article || !(await packArticles(pack)).some((x) => x.id === p.article)))
    notFound();
  const list = p.article
    ? [p.article]
    : (await listPublished())
        .filter((a) => matchesActivity(a, activity) && (!p.module || a.module === p.module))
        .slice(0, 60)
        .map((a) => a.id);
  const articles = (await Promise.all(list.map((id) => getPublished(id)))).filter(
    (a): a is Article => !!a,
  );
  return (
    <PrintGuide
      articles={articles}
      title={p.article && articles[0] ? articles[0].content.title : 'دليل العميل المصوّر'}
      activity={pack?.activity || activity}
      back={pack ? '/guides/' + pack.id : '/'}
      generatedAt={new Date().toISOString()}
    />
  );
}
