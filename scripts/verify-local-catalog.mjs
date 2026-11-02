import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const base='http://127.0.0.1:5173';
const catalog=JSON.parse(fs.readFileSync('lib/faq-catalog.json','utf8'));
const expected=catalog.length;
const login=await fetch(base+'/signin-with-chatgpt?return_to=%2Fadmin',{redirect:'manual'});
assert.equal(login.status,302);
const cookie=login.headers.get('set-cookie').split(';')[0];
async function call(path,auth=true,origin=true){return fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(auth?{Cookie:cookie}:{}),...(origin?{Origin:base}:{})},body:'{}'});}
assert.equal((await call('/api/admin/catalog',false)).status,401);
assert.equal((await call('/api/admin/catalog',true,false)).status,403);
const response=await call('/api/admin/catalog');
const result=await response.json();assert.equal(response.status,200,JSON.stringify(result));assert.equal(result.total,expected);console.log(JSON.stringify(result));
const rows=await (await fetch(base+'/api/admin/articles',{headers:{Cookie:cookie}})).json();
assert.equal(rows.articles.filter(a=>catalog.some(c=>c.id===a.id)).length,expected);
for(const entry of catalog){const a=rows.articles.find(a=>a.id===entry.id);assert.equal(a.status,'draft');assert.equal(a.hasPublished,false);}
const meta=await (await fetch(base+'/api/admin/catalog',{headers:{Cookie:cookie}})).json();
assert.equal(meta.total,expected);assert.equal(meta.screenGuidance,106);
assert.equal((await fetch(base+'/api/admin/catalog')).status,401);
const illustrated=catalog.find(x=>x.content.steps.some(s=>s.image?.name==='erp-customer-report-filters.png'));
const illustratedDraft=await (await fetch(base+'/api/admin/articles/'+illustrated.id,{headers:{Cookie:cookie}})).json();
assert(illustratedDraft.content.steps.some(s=>s.image?.name==='erp-customer-report-filters.png'));
for(const asset of JSON.parse(fs.readFileSync('lib/screenshot-assets.json','utf8'))){const r=await fetch(base+'/assets/'+asset.name);assert.equal(r.status,200);const bytes=Buffer.from(await r.arrayBuffer());assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),asset.sha256);}
const first=catalog[0];
const before=await (await fetch(base+'/api/admin/articles/'+first.id,{headers:{Cookie:cookie}})).json();
const again=await (await call('/api/admin/catalog')).json();assert.equal(again.inserted,0);assert.equal(again.skipped,expected);
const after=await (await fetch(base+'/api/admin/articles/'+first.id,{headers:{Cookie:cookie}})).json();assert.deepEqual(after,before);
const publicRows=await (await fetch(base+'/api/articles')).json();assert.equal(publicRows.articles.length,5);
assert.equal((await fetch(base+'/api/articles/'+first.id)).status,404);
console.log('PASS: '+expected+' private drafts loaded; replay preserved content and revisions; anonymous and cross-origin imports denied; public articles remain five.');
fs.mkdirSync('qa',{recursive:true});fs.writeFileSync('qa/catalog-evidence.json',JSON.stringify({date:new Date().toISOString(),result,replay:again,total:rows.articles.length,public:publicRows.articles.length,checks:'all passed'},null,2));
