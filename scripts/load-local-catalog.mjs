// Local D1 editorial import. Does not create sessions, replace owner credentials or publish.
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {articleSchema,summaryOf} from '../lib/guide-model.ts';
const catalog=JSON.parse(fs.readFileSync('lib/faq-catalog.json','utf8')).map(x=>({...x,content:articleSchema.parse(x.content)}));
const args=['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state'];
function query(sql){const result=spawnSync(process.execPath,[...args,'--command',sql,'--json'],{encoding:'utf8'});if(result.status!==0)throw Error('Local catalog read failed');return JSON.parse(result.stdout)[0].results;}
const present=new Set(query('SELECT id FROM guide_articles').map(r=>r.id));
const missing=catalog.filter(x=>!present.has(x.id)),stamp=new Date().toISOString();
const quote=x=>"'"+String(x).replaceAll("'","''")+"'";
fs.mkdirSync('.sites-runtime',{recursive:true});
for(let offset=0;offset<catalog.length;offset+=40){
 const statements=[];
 for(const entry of catalog.slice(offset,offset+40)){
  const values=[entry.id,JSON.stringify(entry.content),JSON.stringify(summaryOf(entry.id,entry.content,1,stamp))].map(quote);
  statements.push(`INSERT OR IGNORE INTO guide_articles (id,draft_json,draft_summary,status,revision,archived,review_note,updated_by,updated_at) VALUES (${values.join(',')},'draft',1,0,'','catalog-v3-local-import',${quote(stamp)});`);
  statements.push(`INSERT OR IGNORE INTO guide_revisions (id,article_id,revision,content_json,action,actor_id,note,created_at) SELECT ${quote(entry.id)},id,1,draft_json,'create','catalog-v3-local-import','Historical UI guidance; verification pending',${quote(stamp)} FROM guide_articles WHERE id=${quote(entry.id)} AND updated_by='catalog-v3-local-import' AND revision=1 AND NOT EXISTS(SELECT 1 FROM guide_revisions WHERE article_id=${quote(entry.id)});`);
 }
 fs.writeFileSync('.sites-runtime/catalog-import.sql',statements.join('\n'));
 const result=spawnSync(process.execPath,[...args,'--file','.sites-runtime/catalog-import.sql'],{encoding:'utf8'});if(result.status!==0)throw Error('Local catalog import failed; safe to retry without overwriting existing articles');
}
const after=query('SELECT id FROM guide_articles');
if(!catalog.every(x=>after.some(r=>r.id===x.id)))throw Error('Local catalog import incomplete');
console.log(JSON.stringify({catalogTotal:catalog.length,inserted:missing.length,preserved:catalog.length-missing.length,publishedByThisOperation:0,localOnly:true}));
