import { articleSchema, summaryOf, canPublish, publishIssues, packSchema, matchesActivity, type ArticleContent, type StaffUser } from './guide-model';
import { database, getDraft, GuideError, now, mediaExists, auditStatement, listPublished, getPack, packFromRow } from './guide-server';

const publicSnapshot=(content:ArticleContent)=>({...content,verificationNote:''});
export async function createDraft(user:StaffUser,raw:unknown){
 const content=articleSchema.parse(raw);await mediaExists(content);const db=database(),id=crypto.randomUUID(),stamp=now();
 await db.batch([
  db.prepare(`INSERT INTO guide_articles (id,draft_json,draft_summary,status,revision,archived,review_note,updated_by,updated_at) VALUES (?,?,?,'draft',1,0,'',?,?)`).bind(id,JSON.stringify(content),JSON.stringify(summaryOf(id,content,1,stamp)),user.userId,stamp),
  db.prepare('INSERT INTO guide_revisions (id,article_id,revision,content_json,action,actor_id,note,created_at) VALUES (?,?,1,?,?,?,?,?)').bind(crypto.randomUUID(),id,JSON.stringify(content),'create',user.userId,'',stamp),
  auditStatement(user.userId,'article.create',id),
 ]);return getDraft(id);
}
export async function changeArticle(user:StaffUser,id:string,expected:number,action:string,rawContent?:unknown,note='',historyId=''){
 const db=database(),current=await getDraft(id);if(current.revision!==expected)throw new GuideError(409,'الشرح اتعدّل من مستخدم آخر. افتح النسخة الأحدث قبل الحفظ.');
 let content=current.content,status=current.status,archived=current.archived,reviewNote=current.reviewNote;
 if(action==='save'){
  if(current.archived)throw new GuideError(409,'أعد الشرح لمسودة قبل تعديله.');content=articleSchema.parse(rawContent);status='draft';reviewNote='';
 }else if(action==='restore'){
  const previous=await db.prepare('SELECT content_json FROM guide_revisions WHERE id=? AND article_id=?').bind(historyId,id).first<{content_json:string}>();if(!previous)throw new GuideError(404,'النسخة المطلوبة غير موجودة.');content=articleSchema.parse(JSON.parse(previous.content_json));status='draft';archived=false;reviewNote='';
 }else if(action==='submit'){
  if(current.archived)throw new GuideError(409,'الشرح مؤرشف.');const issues=publishIssues(content);if(issues.length)throw new GuideError(400,'أكمل الشرح قبل إرساله للمراجعة.',issues);status='review';reviewNote='';
 }else if(action==='publish'){
  if(!canPublish(user.role))throw new GuideError(403,'النشر متاح للمراجع أو مسؤول النظام فقط.');if(current.status!=='review'||current.archived)throw new GuideError(409,'أرسل المسودة للمراجعة أولًا.');const issues=publishIssues(content);if(issues.length)throw new GuideError(400,'المحتوى غير جاهز للنشر.',issues);status='published';archived=false;reviewNote='';
 }else if(action==='return'){
  if(!canPublish(user.role))throw new GuideError(403,'إرجاع المراجعة متاح للمراجع فقط.');if(note.trim().length<5)throw new GuideError(400,'وضّح سبب إرجاع المسودة.');status='draft';reviewNote=note.trim().slice(0,1200);
 }else if(action==='archive'){
  if(!canPublish(user.role))throw new GuideError(403,'إيقاف النشر متاح للمراجع فقط.');status='archived';archived=true;
 }else if(action==='unarchive'){
  if(!canPublish(user.role))throw new GuideError(403,'استعادة الشرح متاحة للمراجع فقط.');status='draft';archived=false;
 }else throw new GuideError(400,'الإجراء غير معروف.');
 await mediaExists(content);
 const op=crypto.randomUUID(),stamp=now(),revision=expected+1,serialized=JSON.stringify(content),draftSummary=JSON.stringify(summaryOf(id,content,revision,stamp));
 const statement=db.prepare(`INSERT INTO guide_revisions (id,article_id,revision,content_json,action,actor_id,note,created_at) SELECT ?,id,revision+1,?,?,?,?,? FROM guide_articles WHERE id=? AND revision=?`).bind(op,serialized,action,user.userId,note.slice(0,1200),stamp,id,expected);
 const update=action==='publish'
  ?db.prepare(`UPDATE guide_articles SET draft_json=?,draft_summary=?,published_json=?,published_summary=?,status=?,revision=?,published_revision=?,archived=0,review_note='',updated_by=?,updated_at=?,published_at=? WHERE id=? AND revision=? AND EXISTS(SELECT 1 FROM guide_revisions WHERE id=?)`).bind(serialized,draftSummary,JSON.stringify(publicSnapshot(content)),JSON.stringify(summaryOf(id,content,revision,stamp)),status,revision,revision,user.userId,stamp,stamp,id,expected,op)
  :action==='archive'
   ?db.prepare(`UPDATE guide_articles SET status='archived',revision=?,archived=1,published_json=NULL,published_summary=NULL,published_revision=NULL,review_note=?,updated_by=?,updated_at=? WHERE id=? AND revision=? AND EXISTS(SELECT 1 FROM guide_revisions WHERE id=?)`).bind(revision,reviewNote,user.userId,stamp,id,expected,op)
   :db.prepare(`UPDATE guide_articles SET draft_json=?,draft_summary=?,status=?,revision=?,archived=?,review_note=?,updated_by=?,updated_at=? WHERE id=? AND revision=? AND EXISTS(SELECT 1 FROM guide_revisions WHERE id=?)`).bind(serialized,draftSummary,status,revision,archived?1:0,reviewNote,user.userId,stamp,id,expected,op);
 const statements=[statement,update];
 if(action==='publish'||action==='archive'){
  statements.push(db.prepare('DELETE FROM guide_public_media WHERE article_id=? AND EXISTS(SELECT 1 FROM guide_revisions WHERE id=?)').bind(id,op));
  if(action==='publish')for(const mediaId of [...new Set(content.steps.flatMap(s=>s.image?.kind==='media'?[s.image.id]:[]))])statements.push(db.prepare('INSERT INTO guide_public_media (article_id,media_id) SELECT ?,? WHERE EXISTS(SELECT 1 FROM guide_revisions WHERE id=?)').bind(id,mediaId,op));
 }
 statements.push(db.prepare('INSERT INTO guide_audit (id,actor_id,action,entity_id,detail,created_at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM guide_revisions WHERE id=?)').bind(crypto.randomUUID(),user.userId,'article.'+action,id,note.slice(0,1200),stamp,op));
 const results=await db.batch(statements);if(!results[1].meta.changes)throw new GuideError(409,'الشرح اتعدّل أثناء تنفيذ الإجراء. أعد فتح أحدث نسخة.');return getDraft(id);
}
export async function savePack(user:StaffUser,raw:unknown,id?:string,expected?:number){
 const content=packSchema.parse(raw),available=(await listPublished()).filter(a=>matchesActivity(a,content.activity)&&(content.modules as string[]).includes(a.module));
 if(content.articleIds.some(x=>!available.some(a=>a.id===x)))throw new GuideError(400,'اختر شروحات منشورة تنطبق على النشاط والأقسام المحددة.');
 const selected=content.articleIds.length?available.filter(a=>content.articleIds.includes(a.id)):available;
 if(!selected.length)throw new GuideError(400,'لا توجد شروحات منشورة مناسبة. أضف محتوى موثّقًا للنشاط قبل إنشاء دليل العميل.');
 if(selected.length>60)throw new GuideError(400,'اختر حتى ٦٠ شرحًا لكل دليل تسليم.');
 const db=database(),stamp=now();
 if(id){const current=await getPack(id,true);if(!current)throw new GuideError(404,'دليل التسليم غير موجود.');if(current.revision!==expected)throw new GuideError(409,'الدليل اتعدّل بالفعل. افتح أحدث نسخة.');const r=await db.prepare('UPDATE guide_packs SET title=?,activity=?,modules_json=?,article_ids_json=?,welcome=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(content.title,content.activity,JSON.stringify(content.modules),JSON.stringify(content.articleIds),content.welcome,stamp,id,expected).run();if(!r.meta.changes)throw new GuideError(409,'حدث تعديل متزامن. حاول مرة أخرى.');}
 else{id=crypto.randomUUID();await db.prepare('INSERT INTO guide_packs (id,title,activity,modules_json,article_ids_json,welcome,archived,revision,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,0,1,?,?,?)').bind(id,content.title,content.activity,JSON.stringify(content.modules),JSON.stringify(content.articleIds),content.welcome,user.userId,stamp,stamp).run();}
 await auditStatement(user.userId,'pack.save',id).run();return getPack(id,true);
}
