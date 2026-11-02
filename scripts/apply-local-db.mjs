import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const record='.sites-runtime/guide-local-migrations.json';
fs.mkdirSync('.sites-runtime',{recursive:true});
const applied=fs.existsSync(record)?JSON.parse(fs.readFileSync(record,'utf8')):{};
for(const file of fs.readdirSync('drizzle').filter(x=>x.endsWith('.sql')).sort()){
 const hash=crypto.createHash('sha256').update(fs.readFileSync('drizzle/'+file)).digest('hex');
 if(applied[file]){if(applied[file]!==hash)throw Error('Previously applied local migration changed: '+file);continue;}
 const r=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--file','drizzle/'+file],{stdio:'inherit'});
 if(r.status!==0)process.exit(r.status||1);
 applied[file]=hash;fs.writeFileSync(record,JSON.stringify(applied,null,2)+'\n');
}
console.log('Local preview migrations are current. No hosted database was touched.');
