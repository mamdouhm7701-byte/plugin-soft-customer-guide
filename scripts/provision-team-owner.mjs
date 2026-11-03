// Trusted local-only owner provisioning/recovery. Never runs against hosted D1.
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {randomToken,tokenHash} from '../lib/passwords.ts';
const email=process.argv[2]?.trim().toLowerCase();
if(!email||!/^\S+@\S+\.\S+$/.test(email))throw Error('Usage: node --experimental-strip-types scripts/provision-team-owner.mjs owner@example.com');
const args=['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state'];
function query(sql){const r=spawnSync(process.execPath,[...args,'--command',sql,'--json'],{encoding:'utf8'});if(r.status!==0)throw Error('Local owner provisioning failed');return JSON.parse(r.stdout)[0].results;}
const safe=s=>"'"+s.replaceAll("'","''")+"'";
const owners=query("SELECT user_id,email FROM guide_staff WHERE role='owner'");
if(owners.length>1)throw Error('Multiple owners require manual review');
if(owners[0]&&owners[0].email.toLowerCase()!==email)throw Error('An owner already exists with another email. Preserve it; use that owner email or reviewed recovery.');
const id=owners[0]?.user_id||crypto.randomUUID(),token=randomToken(),hash=await tokenHash(token),stamp=new Date().toISOString(),expires=Math.floor(Date.now()/1000)+86400;
query(`INSERT OR IGNORE INTO guide_staff (user_id,email,display_name,role,active,created_at,updated_at) VALUES (${safe(id)},${safe(email)},'مسؤول الفريق','owner',1,${safe(stamp)},${safe(stamp)})`);
query(`DELETE FROM guide_activation_tokens WHERE user_id=${safe(id)}`);
query(`DELETE FROM guide_sessions WHERE user_id=${safe(id)}`);
query(`INSERT INTO guide_activation_tokens (token_hash,user_id,created_by,expires_at) VALUES (${safe(hash)},${safe(id)},'trusted-local-provisioning',${expires})`);
fs.mkdirSync('.sites-runtime',{recursive:true});
fs.writeFileSync('.sites-runtime/owner-activation.html',`<!doctype html><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>Local owner activation</title><h1>تفعيل المسؤول المحلي</h1><p>افتح المعاينة على منفذها الصحيح، ثم استخدم الرابط التالي. صالح ٢٤ ساعة ولمرة واحدة. الملف خاص ولا يرفع إلى Git.</p><a href="http://127.0.0.1:5174/team/activate#token=${token}">تعيين كلمة السر</a>`);
console.log('Local owner activation ready in .sites-runtime/owner-activation.html; token omitted from logs.');
