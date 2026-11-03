import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CUSTOMER_COOKIE } from '@/lib/customer-access';
import { notFound } from 'next/navigation';
import { getPack, packArticles } from '@/lib/guide-server';
import { Library } from '@/components/guide/Library';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const p = await getPack((await params).id);
  return { title: p?.title || 'الدليل غير متاح', robots: { index: false, follow: false } };
}
export default async function Pack({ params }: { params: Promise<{ id: string }> }) {
  const p = await getPack((await params).id);
  if (!p) notFound();
  if ((await cookies()).get(CUSTOMER_COOKIE)?.value !== p.id)
    redirect('/api/customer/access?guide=' + p.id);
  return <Library pack={p} articles={await packArticles(p)} />;
}
