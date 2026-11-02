import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const args=['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state'];
const r=spawnSync(process.execPath,[...args,'--command',"SELECT id,json_extract(draft_json,'$.title') AS title FROM guide_articles WHERE updated_by='local_seedy'",'--json'],{encoding:'utf8'});
if(r.status!==0)throw Error(r.stderr||r.stdout);
const result=JSON.parse(r.stdout),rows=result[0]?.results||[];
const prefixes=['شرح تحقق محلي لدورة النشر','تحقق محلي - دورة النشر ','مسودة غير منشورة ','تعديل متزامن ','مسودة تحقق محلي للصلاحيات'];
const ids=rows.filter(row=>prefixes.some(prefix=>row.title.startsWith(prefix))||(row.id==='fd0c79ea-5943-46ec-92bb-79742b22469c'&&row.title==='مسودة جديدة غير منشورة')).map(row=>row.id);
for(const id of ids)if(!/^[a-f0-9-]{36}$/.test(id))throw Error('Unexpected local test ID');
const quoted=ids.map(id=>`'${id}'`).join(',')||"''";
function ownedIds(table,column,prefix){const r=spawnSync(process.execPath,[...args,'--command',`SELECT id,${column} AS title FROM ${table} WHERE created_by='local_seedy'`,'--json'],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr||r.stdout);const rows=JSON.parse(r.stdout)[0]?.results||[];const matches=rows.filter(row=>row.title.startsWith(prefix)).map(row=>row.id);for(const id of matches)if(!/^[a-f0-9-]{36}$/.test(id))throw Error('Unexpected test ID');return matches;}
const packIds=ownedIds('guide_packs','title','دليل تسليم تحقق محلي '),questionIds=ownedIds('guide_questions','question','سؤال تحقق محلي لتجربة التكرار ');
const packSQL=packIds.map(id=>`'${id}'`).join(',')||"''",questionSQL=questionIds.map(id=>`'${id}'`).join(',')||"''";
let mediaId='';
if(fs.existsSync('qa/local-integration-evidence.json'))mediaId=JSON.parse(fs.readFileSync('qa/local-integration-evidence.json')).localTestMedia||'';
if(mediaId&&!/^[a-f0-9-]{36}$/.test(mediaId))throw Error('Unexpected local media ID');
const sql=`
BEGIN TRANSACTION;
DELETE FROM guide_packs WHERE created_by='local_seedy' AND id IN (${packSQL});
DELETE FROM guide_questions WHERE created_by='local_seedy' AND id IN (${questionSQL});
DELETE FROM guide_feedback WHERE article_id IN (${quoted});
DELETE FROM guide_public_media WHERE article_id IN (${quoted});
DELETE FROM guide_revisions WHERE article_id IN (${quoted});
DELETE FROM guide_audit WHERE actor_id='local_seedy' AND entity_id IN (${quoted});
DELETE FROM guide_articles WHERE id IN (${quoted}) AND updated_by='local_seedy';
${mediaId?`DELETE FROM guide_media WHERE id='${mediaId}' AND uploaded_by='local_seedy' AND NOT EXISTS(SELECT 1 FROM guide_public_media WHERE media_id='${mediaId}');`:''}
COMMIT;
`;
fs.mkdirSync('qa',{recursive:true});fs.writeFileSync('qa/local-test-cleanup.sql',sql);fs.writeFileSync('qa/local-test-cleanup.json',JSON.stringify({at:new Date().toISOString(),articleIds:ids,mediaId,scope:'Only explicitly named task-owned QA records in local D1; uploaded local blob remains unreferenced. No hosted/ERP cleanup.'},null,2));
const clean=spawnSync(process.execPath,[...args,'--file','qa/local-test-cleanup.sql'],{encoding:'utf8'});if(clean.status!==0)throw Error(clean.stderr||clean.stdout);
console.log(JSON.stringify({removedLocalTestArticles:ids.length,hostedDataTouched:false}));
