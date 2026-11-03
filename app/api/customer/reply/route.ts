import { customerReply, REPLY_COOKIE } from '@/lib/reply-access';
import { CUSTOMER_COOKIE } from '@/lib/customer-access';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const url = new URL(request.url),
    token = url.searchParams.get('token') || '';
  const scope = await customerReply(token);
  if (!scope)
    return new Response('رابط الإجابة غير متاح أو تم إيقافه.', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  const headers = new Headers({
    Location: '/help/' + scope.article.id + '?reply=' + encodeURIComponent(token),
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
  });
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  headers.append(
    'Set-Cookie',
    `${REPLY_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`,
  );
  headers.append(
    'Set-Cookie',
    `${CUSTOMER_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
  );
  return new Response(null, { status: 303, headers });
}
