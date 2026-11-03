import { resolveStaff } from '@/lib/guide-server';
import { notFound } from 'next/navigation';
import { ACTIVITIES, matchesActivity, activityName } from '@/lib/guide-model';
import { listPublished } from '@/lib/guide-server';
import { Library } from '@/components/guide/Library';
export const dynamic = 'force-dynamic';
export default async function ActivityGuide({ params }: { params: Promise<{ activity: string }> }) {
  if (!(await resolveStaff())) notFound();
  const { activity } = await params;
  if (!ACTIVITIES.some((a) => a.id === activity)) notFound();
  const articles = (await listPublished()).filter((a) => matchesActivity(a, activity));
  return (
    <Library
      articles={articles}
      initialActivity={activity}
      pack={{
        id: 'activity-' + activity,
        title: 'دليل ' + activityName(activity) + ' بعد التدريب',
        activity,
        modules: [],
        articleIds: [],
        welcome:
          'مرجع عام لنشاطك، بيعرض الشروحات المنشورة والمراجَعة فقط. أي تحديث معتمد بيظهر هنا على نفس الرابط.',
        archived: false,
        revision: 1,
        createdAt: '',
        updatedAt: '',
      }}
    />
  );
}
