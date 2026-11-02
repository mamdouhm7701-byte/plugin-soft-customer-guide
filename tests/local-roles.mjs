import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const base='http://127.0.0.1:5173',checks=[];
const dbArgs=['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--command'];
function role(value,active=1){const sql=`UPDATE guide_staff SET role='${value}',active=${active} WHERE user_id='local_seedy' AND email='seedy@sites.test'`;
 const r=spawnSync(process.execPath,[...dbArgs,sql],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr||r.stdout);
}
const login=await fetch(base+'/signin-with-chatgpt?return_to=%2Fadmin',{redirect:'manual'});const cookie=login.headers.get('set-cookie')?.split(';')[0];assert(cookie);
async function req(path,status,body){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{Cookie:cookie,...(body?{Origin:base,'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});assert.equal(r.status,status,`${path}: ${await r.text()}`);}
let draftId='';
try{
 const seed=JSON.parse(fs.readFileSync('lib/seed-articles.json','utf8'))[0].content;seed.title='مسودة تحقق محلي للصلاحيات';
 const r=await fetch(base+'/api/admin/articles',{method:'POST',headers:{Cookie:cookie,Origin:base,'Content-Type':'application/json'},body:JSON.stringify({content:seed})});const draft=await r.json();assert.equal(r.status,201);draftId=draft.id;
 role('support');
 await req('/api/admin/catalog',403);await req('/api/admin/catalog',403,{});
 await req('/api/admin/dashboard',200);await req('/api/admin/packs',200);await req('/api/admin/articles/'+draftId,403);await req('/api/admin/media',403);await req('/api/admin/staff',403);await req('/api/admin/audit',403);await req('/api/admin/export',403);await req('/api/admin/articles',403,{content:seed});
 const list=await (await fetch(base+'/api/admin/articles',{headers:{Cookie:cookie}})).json();assert(!list.articles.some(a=>a.id===draftId));checks.push('support can use the library/packs but cannot view drafts, media, staff, audit or export');
 role('editor');
 await req('/api/admin/catalog',200);await req('/api/admin/catalog',403,{});
 await req('/api/admin/articles/'+draftId,200);await req('/api/admin/media',200);await req('/api/admin/staff',403);await req('/api/admin/export',403);await req('/api/admin/articles/'+draftId+'/transition',403,{revision:1,action:'publish'});checks.push('editor can edit drafts but cannot publish or manage staff');
 role('reviewer');await req('/api/admin/audit',200);await req('/api/admin/export',200);await req('/api/admin/staff',403);checks.push('reviewer can review/export but cannot administer membership');
 role('support',0);await req('/api/admin/session',403);await req('/api/admin/dashboard',403);checks.push('disabled staff lose access server-side');
}finally{
 role('owner',1);
 if(draftId){const r=await fetch(base+'/api/admin/articles/'+draftId,{headers:{Cookie:cookie}});const d=await r.json();await fetch(base+'/api/admin/articles/'+draftId+'/transition',{method:'POST',headers:{Cookie:cookie,Origin:base,'Content-Type':'application/json'},body:JSON.stringify({revision:d.revision,action:'archive'})});}
 fs.mkdirSync('qa',{recursive:true});fs.writeFileSync('qa/local-role-evidence.json',JSON.stringify({executedAt:new Date().toISOString(),environment:base,localOwnerRestored:true,testDraft:draftId,checks},null,2));
}
console.log(JSON.stringify({passed:checks.length,localOwnerRestored:true}));
