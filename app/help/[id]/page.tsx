import {notFound} from 'next/navigation';
import {getPublished,listPublished,getPack} from '@/lib/guide-server';
import {ACTIVITIES,matchesActivity} from '@/lib/guide-model';
import {ArticleView} from '@/components/guide/ArticleView';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const a=await getPublished((await params).id);return{title:a?.content.title||'الشرح غير متاح'};}
export default async function Help({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|undefined>>}){const {id}=await params,p=await searchParams,a=await getPublished(id);if(!a)notFound();const activity=ACTIVITIES.some(v=>v.id===p.activity)?p.activity!:'general';const pack=p.guide?await getPack(p.guide):null;const related=(await listPublished()).filter(x=>a.content.relatedIds.includes(x.id)&&matchesActivity(x,activity));return <ArticleView article={a} related={related} activity={activity} packId={pack?.id}/>;}
