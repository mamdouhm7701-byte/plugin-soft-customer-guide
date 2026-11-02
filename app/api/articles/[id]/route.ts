import {apiGuard,json,getPublished,GuideError} from '@/lib/guide-server';
export const dynamic='force-dynamic';
export async function GET(request:Request,context:{params:Promise<{id:string}>}){return apiGuard(async()=>{const a=await getPublished((await context.params).id);if(!a)throw new GuideError(404,'الشرح غير متاح.');return json(a);});}
