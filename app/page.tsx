import {Library} from '@/components/guide/Library';
import {listPublished} from '@/lib/guide-server';
import {ACTIVITIES} from '@/lib/guide-model';
export const dynamic='force-dynamic';
export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const p=await searchParams;const activity=ACTIVITIES.some(a=>a.id===p.activity)?p.activity:'general';return <Library articles={await listPublished()} initialActivity={activity}/>;}
