import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { redirect } from 'next/navigation';
import { chatGPTSignInPath } from '@/app/chatgpt-auth';
import seedData from './seed-articles.json';
import { articleSchema, codeFor, summaryOf, matchesActivity, type Article, type ArticleContent, type ArticleSummary, type StaffUser, type GuidePack, type DraftRecord, type Role } from './guide-model';

export class GuideError extends Error {status:number;details?:unknown;constructor(status:number,message:string,details?:unknown){super(message);this.status=status;this.details=details;}}
export const now=()=>new Date().toISOString();
export function database(){if(!env.DB)throw new GuideError(503,'قاعدة البيانات غير متاحة حاليًا. حاول مرة أخرى.');return env.DB;}
export function bucket(){if(!env.BUCKET)throw new GuideError(503,'تخزين الصور غير متاح حاليًا.');return env.BUCKET;}
export const seeds=seedData.map(s=>({id:s.id,content:articleSchema.parse(s.content)}));
const seededAt='2026-11-02T00:00:00.000Z';
export async function seedInitialContent(){
 const db=database();
 await db.batch(seeds.map(s=>db.prepare(`INSERT OR IGNORE INTO guide_articles (id,draft_json,draft_summary,published_json,published_summary,status,revision,published_revision,archived,review_note,updated_by,updated_at,published_at) VALUES (?,?,?,?,?,'published',1,1,0,'','initial-screenshot-content',?,?)`).bind(s.id,JSON.stringify(s.content),JSON.stringify(summaryOf(s.id,s.content,1,seededAt)),JSON.stringify({...s.content,verificationNote:''}),JSON.stringify(summaryOf(s.id,s.content,1,seededAt)),seededAt,seededAt)));
 await db.batch(seeds.map(s=>db.prepare(`INSERT INTO guide_revisions (id,article_id,revision,content_json,action,actor_id,note,created_at) SELECT ?,id,1,draft_json,'initial','initial-screenshot-content','Initial screenshot-backed content',? FROM guide_articles WHERE id=? AND revision=1 AND updated_by='initial-screenshot-content' AND NOT EXISTS(SELECT 1 FROM guide_revisions WHERE article_id=? AND revision=1)`).bind(crypto.randomUUID(),seededAt,s.id,s.id)));
}
type Row=Record<string,unknown>;
export function draftFromRow(r:Row):DraftRecord{return{id:String(r.id),content:articleSchema.parse(JSON.parse(String(r.draft_json))),status:String(r.status),revision:Number(r.revision),publishedRevision:r.published_revision===null?null:Number(r.published_revision),archived:!!r.archived,reviewNote:String(r.review_note??''),updatedAt:String(r.updated_at),publishedAt:r.published_at?String(r.published_at):null};}
export function packFromRow(r:Row):GuidePack{return{id:String(r.id),title:String(r.title),activity:String(r.activity),modules:JSON.parse(String(r.modules_json)),articleIds:JSON.parse(String(r.article_ids_json)),welcome:String(r.welcome),archived:!!r.archived,revision:Number(r.revision),createdAt:String(r.created_at),updatedAt:String(r.updated_at)};}
function staffFromRow(r:Row):StaffUser{return{userId:String(r.user_id),email:String(r.email),displayName:String(r.display_name),role:String(r.role) as Role,active:Number(r.active)};}
export async function resolveStaff():Promise<StaffUser|null>{
 const user=await getChatGPTUser();if(!user)return null;
 const db=database();const existing=await db.prepare('SELECT * FROM guide_staff WHERE user_id=?').bind(user.userId).first<Row>();
 if(existing)return Number(existing.active)===1?staffFromRow(existing):null;
 const email=user.email.trim().toLowerCase(),stamp=now();
 if(env.GUIDE_BOOTSTRAP_EMAIL&&email===env.GUIDE_BOOTSTRAP_EMAIL.trim().toLowerCase()){
  await db.prepare(`INSERT OR IGNORE INTO guide_staff (user_id,email,display_name,role,active,created_at,updated_at) SELECT ?,?,?,'owner',1,?,? WHERE NOT EXISTS (SELECT 1 FROM guide_staff WHERE role='owner')`).bind(user.userId,email,user.displayName,stamp,stamp).run();
 }else{
  await db.batch([
   db.prepare(`INSERT OR IGNORE INTO guide_staff (user_id,email,display_name,role,active,created_at,updated_at) SELECT ?,?,?,role,1,?,? FROM guide_invitations WHERE email=? AND active=1`).bind(user.userId,email,user.displayName,stamp,stamp,email),
   db.prepare(`UPDATE guide_invitations SET active=0 WHERE email=? AND EXISTS (SELECT 1 FROM guide_staff WHERE user_id=?)`).bind(email,user.userId),
  ]);
 }
 const row=await db.prepare('SELECT * FROM guide_staff WHERE user_id=? AND active=1').bind(user.userId).first<Row>();
 if(!row)return null;await seedInitialContent();return staffFromRow(row);
}
export async function requireStaff(roles?:Role[]){const user=await getChatGPTUser();if(!user)throw new GuideError(401,'سجّل الدخول بحساب الفريق أولًا.');const staff=await resolveStaff();if(!staff)throw new GuideError(403,'الحساب غير مصرح له بإدارة الدليل. اطلب إضافة بريدك من مسؤول الفريق.');if(roles&&!roles.includes(staff.role))throw new GuideError(403,'صلاحيتك لا تسمح بتنفيذ الإجراء ده.');return staff;}
export async function staffPage(){const user=await getChatGPTUser();if(!user)redirect(chatGPTSignInPath('/admin'));return resolveStaff();}
export async function listPublished():Promise<ArticleSummary[]>{
 const rows=await database().prepare('SELECT id,published_summary FROM guide_articles').all<{id:string;published_summary:string|null}>();
 const present=new Set(rows.results.map(r=>r.id));
 const summaries=rows.results.filter(r=>r.published_summary).map(r=>JSON.parse(r.published_summary!) as ArticleSummary);
 // Initial, bounded screenshot articles ship with the app; any DB row supersedes its seed, including an archived row.
 for(const s of seeds)if(!present.has(s.id))summaries.push(summaryOf(s.id,s.content,1,seededAt));
 return summaries.sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)||a.code.localeCompare(b.code));
}
export async function getPublished(id:string):Promise<Article|null>{
 const row=await database().prepare('SELECT published_json,published_revision,published_at,archived FROM guide_articles WHERE id=?').bind(id).first<Row>();
 if(row){if(row.archived||!row.published_json)return null;return{id,code:codeFor(id),content:{...articleSchema.parse(JSON.parse(String(row.published_json))),verificationNote:''},publishedAt:String(row.published_at),revision:Number(row.published_revision)};}
 const seed=seeds.find(s=>s.id===id);return seed?{id,code:codeFor(id),content:{...seed.content,verificationNote:''},publishedAt:seededAt,revision:1}:null;
}
export async function getDraft(id:string){const r=await database().prepare('SELECT * FROM guide_articles WHERE id=?').bind(id).first<Row>();if(!r)throw new GuideError(404,'الشرح غير موجود.');return draftFromRow(r);}
export async function getPack(id:string,includeArchived=false){const r=await database().prepare('SELECT * FROM guide_packs WHERE id=?').bind(id).first<Row>();if(!r||(!includeArchived&&r.archived))return null;return packFromRow(r);}
export async function packArticles(pack:GuidePack){const list=(await listPublished()).filter(a=>matchesActivity(a,pack.activity)&&pack.modules.includes(a.module)&&(!pack.articleIds.length||pack.articleIds.includes(a.id)));return list;}
export async function mediaExists(content:ArticleContent){const ids=[...new Set(content.steps.flatMap(s=>s.image?.kind==='media'?[s.image.id]:[]))];if(!ids.length)return;const rows=await database().prepare(`SELECT id FROM guide_media WHERE id IN (${ids.map(()=>'?').join(',')})`).bind(...ids).all<{id:string}>();if(rows.results.length!==ids.length)throw new GuideError(400,'بعض الصور غير موجودة في المكتبة. اختَر صورًا مرفوعة على الموقع.');}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Cookie'}});}
export async function apiGuard(fn:()=>Promise<Response>){try{return await fn();}catch(e){if(e instanceof GuideError)return json({error:e.message,details:e.details},e.status);if(e instanceof Error&&e.name==='ZodError')return json({error:'راجع البيانات المطلوبة وحدود الحقول.',details:JSON.parse(e.message)},400);console.error('guide_operation_failed',e instanceof Error?e.message:'unknown');return json({error:'تعذر تنفيذ الطلب. حاول مرة أخرى أو راجع مسؤول النظام.'},500);}}
export function sameOrigin(request:Request){const origin=request.headers.get('Origin');if(!origin||origin!==new URL(request.url).origin)throw new GuideError(403,'الطلب لازم يبدأ من نفس الموقع.');}
export async function readLimited(request:Request,limit:number){const reader=request.body?.getReader();if(!reader)return new Uint8Array();const chunks:Uint8Array[]=[];let length=0;while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>limit){await reader.cancel();throw new GuideError(413,'حجم الطلب أكبر من المسموح.');}chunks.push(value);}const body=new Uint8Array(length);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.byteLength;}return body;}
export async function bodyJSON(request:Request){if(!request.headers.get('Content-Type')?.includes('application/json'))throw new GuideError(415,'صيغة الطلب غير صحيحة.');const text=new TextDecoder().decode(await readLimited(request,160000));let value:unknown;try{value=JSON.parse(text);}catch{throw new GuideError(400,'البيانات غير صالحة.');}if(!value||typeof value!=='object'||Array.isArray(value))throw new GuideError(400,'البيانات لازم تكون نموذجًا صالحًا.');return value as Record<string,unknown>;}
export function auditStatement(actor:string,action:string,entity:string,detail=''){return database().prepare('INSERT INTO guide_audit (id,actor_id,action,entity_id,detail,created_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),actor,action,entity,detail.slice(0,1200),now());}
export async function hashValue(value:string){const salt=env.GUIDE_RATE_SECRET;if(!salt)throw new GuideError(503,'إعداد استقبال التقييمات غير مكتمل.');const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+':'+value));return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');}
export async function rateLimit(request:Request){const seconds=Math.floor(Date.now()/1000),window=Math.floor(seconds/3600),ip=request.headers.get('CF-Connecting-IP')||'local';const key='feedback:'+window+':'+await hashValue(ip);const r=await database().prepare('INSERT INTO guide_rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,(window+1)*3600).first<{count:number}>();if(!r||r.count>40)throw new GuideError(429,'وصلت لعدد المحاولات المسموح. جرّب بعد شوية.');if(Math.random()<.05)await database().prepare('DELETE FROM guide_rate_limits WHERE expires_at<?').bind(seconds-86400).run();}
