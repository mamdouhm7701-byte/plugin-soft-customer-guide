import { TeamLogin } from '@/components/admin/TeamLogin';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'تفعيل حساب الفريق',
  robots: { index: false, follow: false },
  referrer: 'no-referrer' as const,
};
export default function Activate() {
  return (
    <main className="container" style={{ maxWidth: 620, padding: '48px 20px' }}>
      <TeamLogin activate />
    </main>
  );
}
