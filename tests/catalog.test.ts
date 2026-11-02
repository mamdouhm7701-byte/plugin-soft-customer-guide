import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {articleSchema,publishIssues,matchesActivity,BUNDLED_SCREENSHOTS,type ArticleContent} from '../lib/guide-model.ts';
const catalog:{id:string;key:string;screenKeys?:string[];content:ArticleContent}[]=JSON.parse(fs.readFileSync(new URL('../lib/faq-catalog.json',import.meta.url),'utf8'));
test('catalog is complete across modules and activities, with unique identities and valid related links',()=>{
 assert(catalog.length>=390);assert.equal(catalog.filter(x=>!x.key.startsWith('expanded-')).length,107);assert.equal(new Set(catalog.map(x=>x.id)).size,catalog.length);
 assert.equal(new Set(catalog.map(x=>x.content.title)).size,catalog.length);
 assert.equal(new Set(catalog.map(x=>x.content.module)).size,11);
 for(const activity of ['general','restaurant','construction','concrete','cars','hr'] as const)assert(catalog.some(x=>x.content.activities.includes(activity)));
 for(const entry of catalog){const c=articleSchema.parse(entry.content);assert(c.summary.length>30);assert(c.reply.includes(c.summary));assert(c.steps.length>=2);assert(c.steps[1].text.length>35);assert(c.verificationNote.includes('not LIVE'));assert.equal(c.verifiedAt,'');assert(publishIssues(c).length>0);for(const id of c.relatedIds){const related=catalog.find(x=>x.id===id);assert(related);assert.notEqual(id,entry.id);assert.equal(related.content.module,c.module);}}
});
test('specialized procedures stay scoped and every screenshot is a real bundled asset',()=>{
 for(const entry of catalog){const c=entry.content;for(const s of c.steps){if(s.image){assert.equal(s.image.kind,'asset');assert(BUNDLED_SCREENSHOTS.some(x=>x.name===(s.image?.kind==='asset'?s.image.name:'')));assert(fs.existsSync(new URL('../public/assets/'+(s.image.kind==='asset'?s.image.name:''),import.meta.url)));assert(s.caption.includes('فعلية'));}}if(c.activities.length===1&&['restaurant','construction','concrete','cars','hr'].includes(c.activities[0])){assert(!matchesActivity(c,'general'));}}
});

test('every active inventoried screen and catalogued report has linked draft guidance; removed audit screen stays excluded',()=>{
 const coverage=JSON.parse(fs.readFileSync(new URL('../lib/catalog-coverage.json',import.meta.url),'utf8'));
 assert.equal(coverage.screenGuidance,106);assert.equal(coverage.reports,71);
 for(const screen of coverage.screensInventory){if(screen.route==='#/logs'){assert.equal(screen.state,'excluded_removed');assert.equal(screen.articleIds.length,0);continue;}assert.equal(screen.articleIds.length,2);for(const id of screen.articleIds){const entry=catalog.find(x=>x.id===id);assert(entry);assert(entry.screenKeys?.includes(screen.route));}}
 assert.equal(catalog.filter(x=>x.key.startsWith('expanded-report-')).length,coverage.reports);
 const assets=JSON.parse(fs.readFileSync(new URL('../lib/screenshot-assets.json',import.meta.url),'utf8'));
 for(const asset of assets){assert.equal(asset.scope,'UI_ONLY_FROM_HISTORICAL_FAILURE_ARTIFACT');assert(asset.source.startsWith('screenshots/FAIL_'));}
});
