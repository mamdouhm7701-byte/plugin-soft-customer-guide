import { allowedCustomerArticle } from '@/lib/customer-access';
import { apiGuard, json, getPublished, GuideError } from '@/lib/guide-server';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return apiGuard(async () => {
    const { id } = await context.params;
    if (!(await allowedCustomerArticle(id))) throw new GuideError(404, 'الشرح غير متاح.');
    const a = await getPublished(id);
    if (!a) throw new GuideError(404, 'الشرح غير متاح.');
    return json(a);
  });
}
