import {apiGuard,json,listPublished} from '@/lib/guide-server';
export const dynamic='force-dynamic';
export async function GET(){return apiGuard(async()=>json({articles:await listPublished()}));}
