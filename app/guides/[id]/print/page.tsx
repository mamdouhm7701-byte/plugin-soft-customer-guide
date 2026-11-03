import { notFound } from 'next/navigation';
import { getPack, packArticles, getPublished } from '@/lib/guide-server';
import { type Article } from '@/lib/guide-model';
import { PrintGuide } from '@/components/guide/PrintGuide';
export const dynamic = 'force-dynamic';
export default async function PrintPack({ params }: { params: Promise<{ id: string }> }) {
  const p = await getPack((await params).id);
  if (!p) notFound();
  const list = await packArticles(p);
  const articles = (await Promise.all(list.map((a) => getPublished(a.id)))).filter(
    (a): a is Article => a !== null,
  );
  return (
    <PrintGuide
      articles={articles}
      title={p.title}
      activity={p.activity}
      welcome={p.welcome}
      generatedAt={new Date().toISOString()}
      back={'/guides/' + p.id}
    />
  );
}
