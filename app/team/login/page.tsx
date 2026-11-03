import { redirect } from 'next/navigation';
import { teamSession } from '@/lib/team-auth';
import { TeamLogin } from '@/components/admin/TeamLogin';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'دخول الفريق',
  robots: { index: false, follow: false },
  referrer: 'no-referrer' as const,
};
export default async function Login() {
  if (await teamSession()) redirect('/admin');
  return (
    <main className="container" style={{ maxWidth: 620, padding: '48px 20px' }}>
      <TeamLogin />
    </main>
  );
}
