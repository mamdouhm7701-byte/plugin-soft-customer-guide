import fs from 'node:fs';
import vm from 'node:vm';
const context={window:{}};
vm.runInNewContext(fs.readFileSync('work/pilot-dist/content.js','utf8'),context);
const seeds=context.window.GUIDE.articles.map(a=>({id:a.id,content:{title:a.title,summary:a.answer,module:a.module,activities:a.id==='support-request'?['all']:['general'],aliases:a.keywords.split(' '),kind:a.kind==='التعرّف على الشاشة'?'شرح مفهوم':a.kind,scopeNote:'موثّق لشاشات البيع العامة فقط. لا يغطي هذا الشرح إجراءات الحفظ أو الأثر المالي والمخزني.',prerequisites:a.before,steps:a.steps.map(s=>({title:s.title,text:s.text,image:{kind:'asset',name:s.image},caption:s.caption,focus:s.focus})),outcome:a.result,warnings:[a.warning],relatedIds:a.related,reply:a.reply,verifiedAt:'2026-11-02',verificationNote:'تمت مشاهدة شاشتي أمر البيع وفاتورة المبيعات والتقاط الصور مباشرة أثناء تصفح مصرح به بتاريخ ٢ نوفمبر ٢٠٢٦. أُزيل اختيار العميل من نماذج غير محفوظة، ولم يتم حفظ مستندات أو التحقق من قواعد مالية.'}}));
fs.writeFileSync('lib/seed-articles.json',JSON.stringify(seeds,null,2)+'\n');
console.log(`Imported ${seeds.length} bounded, screenshot-backed articles.`);
