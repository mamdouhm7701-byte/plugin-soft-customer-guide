import { redirect } from 'next/navigation';
import { customerPack } from '@/lib/customer-access';
import { resolveStaff } from '@/lib/guide-server';
import { Library } from '@/components/guide/Library';
import { listPublished } from '@/lib/guide-server';
import { ACTIVITIES } from '@/lib/guide-model';
export const dynamic = 'force-dynamic';
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  if (!(await resolveStaff())) {
    const pack = await customerPack();
    if (pack) redirect('/guides/' + pack.id);
    return (
      <main className="container" style={{ padding: 48 }}>
        <h1>دليل العميل</h1>
        <p>
          افتح رابط دليلك اللي وصلك من فريق التدريب. لو الرابط موقوف أو مش متاح، تواصل مع الدعم.
        </p>
      </main>
    );
  }
  const p = await searchParams;
  const activity = ACTIVITIES.some((a) => a.id === p.activity) ? p.activity : 'general';
  return <Library articles={await listPublished()} initialActivity={activity} />;
}
