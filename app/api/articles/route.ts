import { customerArticles } from '@/lib/customer-access';
import { apiGuard, json, listPublished, resolveStaff } from '@/lib/guide-server';
export const dynamic = 'force-dynamic';
export async function GET() {
  return apiGuard(async () =>
    json({
      articles: (await resolveStaff())
        ? await listPublished()
        : (await customerArticles()).articles,
    }),
  );
}
