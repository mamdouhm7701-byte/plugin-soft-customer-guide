import { resolveStaff } from '@/lib/guide-server';
import { notFound } from 'next/navigation';
import { ACTIVITIES, matchesActivity, activityName, type Article } from '@/lib/guide-model';
import { listPublished, getPublished } from '@/lib/guide-server';
import { PrintGuide } from '@/components/guide/PrintGuide';
export const dynamic = 'force-dynamic';
export default async function ActivityPrint({ params }: { params: Promise<{ activity: string }> }) {
  if (!(await resolveStaff())) notFound();
  const { activity } = await params;
  if (!ACTIVITIES.some((a) => a.id === activity)) notFound();
  const summaries = (await listPublished()).filter((a) => matchesActivity(a, activity));
  const articles = (await Promise.all(summaries.map((a) => getPublished(a.id)))).filter(
    (a): a is Article => !!a,
  );
  return (
    <PrintGuide
      articles={articles}
      title={'دليل ' + activityName(activity)}
      activity={activity}
      generatedAt={new Date().toISOString()}
      back={'/guides/activity/' + activity}
    />
  );
}
