import { getPack, packArticles } from '@/lib/guide-server';
import { CUSTOMER_COOKIE } from '@/lib/customer-access';
import { REPLY_COOKIE } from '@/lib/reply-access';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const url = new URL(request.url),
    id = url.searchParams.get('guide') || '';
  const pack = /^[a-f0-9-]{36}$/i.test(id) ? await getPack(id) : null;
  if (!pack)
    return new Response('الدليل غير متاح أو تم إيقافه.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  const article = url.searchParams.get('article');
  if (article && !(await packArticles(pack)).some((x) => x.id === article))
    return new Response('الشرح غير متاح.', { status: 404 });
  const response = new Response(null, {
    status: 303,
    headers: {
      Location: article
        ? '/help/' + encodeURIComponent(article) + '?guide=' + pack.id
        : '/guides/' + pack.id,
      'Set-Cookie': `${CUSTOMER_COOKIE}=${pack.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${url.protocol === 'https:' ? '; Secure' : ''}`,
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
    },
  });
  response.headers.append(
    'Set-Cookie',
    `${REPLY_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${url.protocol === 'https:' ? '; Secure' : ''}`,
  );
  return response;
}
