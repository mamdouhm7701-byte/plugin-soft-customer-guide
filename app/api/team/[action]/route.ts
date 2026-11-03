import { z } from 'zod';
import { cookies } from 'next/headers';
import { apiGuard, bodyJSON, sameOrigin, json, database, GuideError } from '@/lib/guide-server';
import {
  changeOwnPassword,
  signIn,
  activatePassword,
  sessionCookie,
  SESSION_COOKIE,
} from '@/lib/team-auth';
import { tokenHash } from '@/lib/passwords';
import { provisionConfiguredOwner } from '@/lib/owner-bootstrap';
export const dynamic = 'force-dynamic';
export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  return apiGuard(async () => {
    sameOrigin(request);
    const { action } = await params;
    if (action === 'logout') {
      const token = (await cookies()).get(SESSION_COOKIE)?.value;
      if (token)
        await database()
          .prepare('DELETE FROM guide_sessions WHERE token_hash=?')
          .bind(await tokenHash(token))
          .run();
      const response = json({ ok: true });
      response.headers.set('Set-Cookie', sessionCookie(request, '', true));
      return response;
    }
    const raw = await bodyJSON(request);
    if (action === 'password') {
      const v = z
        .object({
          currentPassword: z.string().min(1).max(128),
          newPassword: z.string().min(12).max(128),
        })
        .parse(raw);
      await changeOwnPassword(request, v.currentPassword, v.newPassword);
      const response = json({ ok: true });
      response.headers.set('Set-Cookie', sessionCookie(request, '', true));
      return response;
    }
    if (action === 'login') {
      const v = z
          .object({
            email: z
              .string()
              .trim()
              .email()
              .max(254)
              .transform((s) => s.toLowerCase()),
            password: z.string().min(1).max(128),
          })
          .parse(raw),
        token = await signIn(request, v.email, v.password);
      const response = json({ ok: true });
      response.headers.set('Set-Cookie', sessionCookie(request, token));
      return response;
    }
    if (action === 'activate') {
      const v = z
        .object({
          token: z.string().regex(/^[a-f0-9]{64}$/),
          password: z.string().min(12).max(128),
        })
        .parse(raw);
      await provisionConfiguredOwner();
      await activatePassword(request, v.token, v.password);
      return json({ ok: true });
    }
    throw new GuideError(404, 'المسار غير موجود.');
  });
}
