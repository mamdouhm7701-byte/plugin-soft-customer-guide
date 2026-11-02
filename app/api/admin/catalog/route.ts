import catalog from '@/lib/faq-catalog.json';
import coverage from '@/lib/catalog-coverage.json';
import {articleSchema,summaryOf} from '@/lib/guide-model';
import {apiGuard,requireStaff,sameOrigin,database,json,now,auditStatement} from '@/lib/guide-server';
export const dynamic='force-dynamic';
export async function GET(){return apiGuard(async()=>{await requireStaff(['owner','reviewer','editor']);return json(coverage);});}
export async function POST(request:Request){return apiGuard(async()=>{
 sameOrigin(request);const user=await requireStaff(['owner','reviewer']),db=database(),stamp=now();
 // Validate the complete shipped package before writing any article.
 const entries=catalog.map(x=>({...x,content:articleSchema.parse(x.content)}));
 let inserted=0;
 for(const entry of entries){
  const content=JSON.stringify(entry.content);
  const results=await db.batch([
   db.prepare(`INSERT OR IGNORE INTO guide_articles (id,draft_json,draft_summary,status,revision,archived,review_note,updated_by,updated_at) VALUES (?,?,?,'draft',1,0,'',?,?)`).bind(entry.id,content,JSON.stringify(summaryOf(entry.id,entry.content,1,stamp)),user.userId,stamp),
   db.prepare(`INSERT OR IGNORE INTO guide_revisions (id,article_id,revision,content_json,action,actor_id,note,created_at) SELECT ?,id,1,draft_json,'create',?,'FAQ catalog v2; static evidence, verification pending',? FROM guide_articles WHERE id=? AND NOT EXISTS(SELECT 1 FROM guide_revisions WHERE article_id=?)`).bind(entry.id,user.userId,stamp,entry.id,entry.id),
  ]);
  inserted+=results[0].meta.changes;
 }
 await auditStatement(user.userId,'catalog.import','faq-v2',JSON.stringify({inserted,skipped:entries.length-inserted,total:entries.length})).run();
 return json({inserted,skipped:entries.length-inserted,total:entries.length,published:0});
});}
