"""Import reviewed native Selenium screenshots; never logs in or writes ERP data."""
from pathlib import Path
import argparse, hashlib, json, uuid
root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--captures', required=True, type=Path)
source = parser.parse_args().captures.resolve()
specs = [
 ('units','الوحدات','products','الوحدة','الاسم العربي والاسم الإنجليزي فقط؛ الكود ظاهر كحقل غير قابل للكتابة في اللقطة.','هل رسالة الاسم العربي مطلوب في الوحدة معناها إن الوحدة اتحفظت؟','لا؛ الرسالة بتحدد حقلًا ناقصًا في النموذج. ظهورها لا يثبت حفظ الوحدة، ولا يثبت إن لها معامل تحويل أو سعرًا.'),
 ('banks','البنوك','settings','البنك','الاسم والعنوان والموبايل والبريد ورقم الحساب والحساب البنكي وIBAN والملاحظات. راجع كل خانة مع مسؤول الحسابات.','فين IBAN والحساب البنكي في تعريف البنك؟','في نافذة إضافة بنك توجد خانة الحساب البنكي وخانة IBAN، وهما منفصلتان عن قائمة رقم الحساب. طابق بيانات البنك مع مستند رسمي قبل الحفظ.'),
 ('safes','الخزن','settings','الخزنة','الاسم العربي والإنجليزي ورقم الحساب وخيار عام والملاحظات. الربط المحاسبي يحتاج مراجعة المسؤول قبل أي حفظ.','هل اختيار عام في الخزنة بديل عن رقم الحساب؟','النموذج يعرض عام ورقم الحساب كحقلين منفصلين. الصورة لا تثبت أن أحدهما يغني عن الآخر أو تغيّر صلاحيات الفروع؛ راجع إعداد الربط مع المسؤول.'),
 ('areas','المناطق','settings','المنطقة','الاسم العربي والإنجليزي والملاحظات. الصورة توضح بيانات التعريف، ولا تتضمن تعديل منطقة مستخدمة.','ليه الاسم العربي مطلوب وأنا كاتب الاسم الإنجليزي للمنطقة؟','النموذج الحالي يعرض رسالة الاسم العربي مطلوب بصورة مستقلة عن الاسم الإنجليزي. راجع خانة الاسم العربي؛ الصورة لا توثق إرسال نموذج أو حفظه.'),
 ('expense-type','أنواع المصروفات','settings','نوع المصروف','الاسم العربي والإنجليزي ورقم الحساب وخيار عام. تحديد الحساب قرار محاسبي؛ لا تنسخ رقم حساب من مثال تدريبي.','هل تعريف نوع مصروف بيسجّل حركة مصروفات؟','هذه نافذة تعريف نوع المصروف وفيها رقم الحساب وخيار عام. فتحها أو ملء اسم النوع لا يثبت تسجيل حركة أو خصم مبلغ من خزنة.'),
 ('income-type','أنواع الإيرادات','settings','نوع الإيراد','الاسم العربي والإنجليزي ورقم الحساب وخيار عام. راجع الربط المحاسبي قبل الاستخدام.','هل تعريف نوع إيراد معناه تسجيل تحصيل؟','نافذة إضافة إيراد هنا ضمن أنواع الإيرادات وتعرض بيانات تعريف النوع. الصورة لا تتضمن سند قبض أو إثبات تحصيل أو أثرًا على رصيد الخزنة.'),
 ('payment-methods','طرق الدفع','settings','طريقة الدفع','الاسم العربي والإنجليزي واسم البنك وخيار عام وطريقة دفع افتراضية للتكامل والملاحظات. لا تغيّر الافتراضي دون تنسيق التكامل.','ليه طريقة الدفع بتطلب اسم البنك؟','النافذة الحالية تعرض قائمة اسم البنك ورسالة اسم البنك مطلوب. راجع اختيار البنك مع مسؤول الإعداد، ولا تعتبر اختيار طريقة الدفع وحده إثباتًا لتحصيل بنكي.'),
 ('account-groups','مجموعات الحسابات','accounting','مجموعة الحسابات','الاسم العربي والإنجليزي والملاحظات. لا توجد باللقطة أرصدة أو سطور قيد؛ ده نموذج تعريف مجموعة.','هل مجموعة الحسابات نفسها حساب أقدر أسجل عليه قيد؟','النافذة تعرض تعريف مجموعة باسم وملاحظات فقط. لا تفترض من الصورة إمكانية استخدامها كحساب حركة؛ راجع دليل الحسابات والربط المعتمد.'),
 ('warehouses','قائمة المخازن','inventory','المخزن','الاسم العربي والإنجليزي ورقم الحساب والملاحظات. راجع صلاحية المستخدم والربط المحاسبي قبل إنشاء مخزن.','هل إنشاء تعريف مخزن بيضيف رصيد أصناف؟','هذه نافذة إنشاء مخزن وفيها بيانات الاسم ورقم الحساب. لا تحتوي الصورة على كميات أصناف؛ ولا توثق رصيد افتتاحي أو إذن استلام.'),
 ('exchange-destinations','جهات الصرف','settings','جهة الصرف','الاسم العربي والإنجليزي ورقم الحساب. طابق جهة الصرف مع الحساب الصحيح قبل أي استخدام مالي.','هل تعريف جهة صرف بيخصم مبلغ من الخزنة؟','نافذة إضافة جهة هي تعريف للجهة وربطها برقم الحساب. الصورة لا تتضمن مبلغًا أو خزنة أو حركة صرف، ولا تثبت خصم أي رصيد.'),
]
catalog = json.loads((root/'lib/faq-catalog.json').read_text(encoding='utf-8'))
assets = json.loads((root/'lib/screenshot-assets.json').read_text(encoding='utf-8'))
new = []
for key, screen, module, singular, fields, question, answer in specs:
 name = 'live-'+key+'-form.png'
 evidence = json.loads((source/(name[:-4]+'.json')).read_text(encoding='utf-8'))
 assert evidence['mode']=='native-element-screenshot', 'Only reviewed blank modal images are accepted'
 data = (source/name).read_bytes()
 assert data[:8]==b'\x89PNG\r\n\x1a\n'
 digest = hashlib.sha256(data).hexdigest()
 caption = 'صورة فعلية من البرنامج · '+evidence['capturedAt'][:10]+' · نموذج فارغ غير محفوظ.'
 existing_asset = next((a for a in assets if a['name']==name),None)
 if existing_asset:
  assert existing_asset['sha256']==digest and existing_asset['capturedAt']==evidence['capturedAt'], 'Capture changed: use a new reviewed version instead of replacing existing asset provenance'
 proof = {**evidence,'sha256':digest,'review':'Visually reviewed: blank modal, no customer records; navigation/form only; no save or ERP data mutation.'}
 proof_path = Path('docs/evidence/live-captures')/(key+'.json')
 (root/proof_path).parent.mkdir(parents=True,exist_ok=True)
 (root/proof_path).write_text(json.dumps(proof,ensure_ascii=False,indent=2),encoding='utf-8')
 (root/'public/assets'/name).write_bytes(data)
 if not any(a['name']==name for a in assets):
  assets.append(dict(name=name,caption=caption,source=proof_path.as_posix(),capturedAt=evidence['capturedAt'],scope='LIVE_UI_CAPTURE_READ_ONLY',sha256=digest))
 route='#'+evidence['route']
 steps=[
  dict(title='افتح نموذج '+singular,text='من شاشة '+screen+' اضغط جديد. الصورة تعرض نافذة الإضافة الفعلية بعد فتحها؛ تأكد من عنوان النموذج قبل إدخال بيانات.',focus=dict(x=75,y=7,w=48,h=13)),
  dict(title='راجع خانات النموذج',text=fields+' الاسم العربي ظاهر برسالة إلزام في النموذج الفارغ؛ الرسالة ليست دليل حفظ.',focus=dict(x=50,y=37,w=94,h=55)),
  dict(title='راجع قبل التنفيذ',text='راجع البيانات مع المسؤول قبل الضغط على حفظ. التصوير توقف عند النموذج الفارغ؛ لم يتم حفظ سجل أو اختبار الترحيل أو تعديل الأرصدة.',focus=dict(x=21,y=90,w=40,h=18)),
 ]
 for variant,title,summary in [('steps','إزاي أفتح نموذج '+singular+' وأراجع حقوله بالصور الحالية؟','افتح '+screen+' ثم جديد، وراجع '+fields),('business',question,answer)]:
  ident=str(uuid.uuid5(uuid.NAMESPACE_URL,'plugin-soft-live-ui-v1/'+key+'/'+variant))
  content=dict(title=title,summary=summary,module=module,activities=['general'],aliases=[screen,singular,route],kind='خطوات تنفيذ' if variant=='steps' else 'شرح مفهوم',scopeNote='توضيح حقول نموذج فارغ في النسخة الحالية؛ لم يتم تنفيذ حفظ أو حركة مالية أو مخزنية.',prerequisites=['حساب مسموح له بفتح نفس الشاشة في النشاط العام.','مراجعة مسؤول الإعداد قبل تعديل أي ربط محاسبي أو اختيار افتراضي.'],steps=[dict(**s,image=dict(kind='asset',name=name),caption=caption) for s in steps],outcome='تحديد مكان الحقول ومراجعتها قبل التنفيذ. لا توجد نتيجة حفظ أو أثر مالي تم التحقق منه.',warnings=['الصورة لنموذج فارغ؛ القيم المطلوبة والربط التشغيلي تراجع حسب إعداد شركتك.','لا تغيّر الحسابات أو إعدادات التكامل لمعالجة رسالة دون مراجعة المسؤول.'],relatedIds=[],reply=summary+'\nراجع حقول النموذج في الصور، ولو الشاشة عندك مختلفة ابعت اسمها والرسالة بدون بيانات حساسة.',verifiedAt='',verificationNote='LIVE_UI_CAPTURE_READ_ONLY '+evidence['capturedAt']+'. Native blank modal visually reviewed. No save, data mutation or transaction qualification. Editorial publication review pending. Evidence: '+proof_path.as_posix())
  new.append(dict(id=ident,key='live-ui-v1-'+key+'-'+variant,source=proof_path.as_posix(),screenKeys=[route],content=content))
for e in new: e['content']['relatedIds']=[a['id'] for a in new if a['id']!=e['id'] and a['screenKeys']==e['screenKeys']]
known={x['id'] for x in catalog}
catalog.extend(x for x in new if x['id'] not in known)
meta=json.loads((root/'lib/catalog-coverage.json').read_text(encoding='utf-8'))
meta.update(total=len(catalog),articlesWithImages=sum(any(s['image'] for s in a['content']['steps']) for a in catalog),additionalScreenshots=len(assets),liveCapturePerformed=True,newBrowserCapture=True,liveReadOnlyScreenshots=len(specs),liveIllustratedArticles=len(new))
for screen in meta['screensInventory']:
 linked=[e['id'] for e in new if screen['route'] in e['screenKeys']]
 if linked:
  screen['image']=True
  screen['liveUiCaptured']=True
  screen['supplementalArticleIds']=list(dict.fromkeys(screen.get('supplementalArticleIds',[])+linked))
meta['screensWithImages']=sum(s.get('image',False) for s in meta['screensInventory'])
for path,data in [('lib/faq-catalog.json',catalog),('lib/screenshot-assets.json',assets),('lib/catalog-coverage.json',meta)]:
 (root/path).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'catalog':len(catalog),'liveIllustratedDrafts':len(new),'inserted':sum(x['id'] not in known for x in new),'liveReadOnlyScreenshots':len(specs),'published':0}))
