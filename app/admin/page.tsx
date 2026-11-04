import { staffPage } from '@/lib/guide-server';

import { AdminApp } from '@/components/admin/AdminApp';
import { Header, Footer, Empty } from '@/components/guide/common';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'مساحة التدريب والدعم', robots: { index: false, follow: false } };
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await staffPage();
  if (!user)
    return (
      <>
        <Header />
        <main className="container not-found">
          <Empty
            title="الحساب مش مضاف للفريق"
            text="اطلب من مسؤول الدليل إضافة بريد الحساب للفريق، أو سجّل الخروج وادخل بالحساب المصرح له."
          >
            <a href="/team/login" target="_top" className="button secondary">
              تسجيل الخروج وتغيير الحساب
            </a>
          </Empty>
        </main>
        <Footer />
      </>
    );
  const p = await searchParams;
  const allowed = [
    'dashboard',
    'articles',
    'packs',
    'questions',
    'feedback',
    'help',
    'account',
    ...(['owner', 'reviewer', 'editor'].includes(user.role) ? ['editor', 'media'] : []),
    ...(['owner', 'reviewer'].includes(user.role) ? ['audit'] : []),
    ...(user.role === 'owner' ? ['staff'] : []),
  ];
  return (
    <AdminApp
      user={user}
      initialTab={allowed.includes(p.tab || '') ? p.tab : 'dashboard'}
      initialId={p.id || ''}
      initialQuery={(p.q || '').slice(0, 500)}
    />
  );
}
