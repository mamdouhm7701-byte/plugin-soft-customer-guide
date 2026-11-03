"""Build draft-only guidance from the reviewed ERP screen/report inventories.

Usage: python scripts/expand-faq-catalog.py --erp-root C:/path/to/Plugin_ERP
No ERP connection, credential access, test execution or external write occurs.
"""
import argparse
import csv
import hashlib
import json
import uuid
from pathlib import Path

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--erp-root', type=Path, required=True)
erp = parser.parse_args().erp_root.resolve()

def read_csv(name):
    return list(csv.DictReader((erp / name).open(encoding='utf-8-sig')))

def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')

def identity(key):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, 'plugin-soft-faq-v2/' + key))

existing_catalog=json.loads((root/'lib/faq-catalog.json').read_text(encoding='utf-8'))
supplemental=[x for x in existing_catalog if x['key'].startswith(('illustrated-v3-','live-ui-v1-','business-v1-'))]
legacy = [x for x in existing_catalog if not x['key'].startswith(('expanded-','illustrated-v3-','live-ui-v1-','business-v1-'))]
assert len(legacy) == 107, 'Preserve the original editorial batch unchanged.'
screens = read_csv('docs/testing/SCREEN_DEPTH_AUDIT.csv')
hr_screens = read_csv('docs/hr/SCREEN_COVERAGE.csv')
reports = read_csv('docs/testing/REPORT_CONTENT_GAPS.csv')
spec = {}
for line in (root/'lib/screen-answer-spec.txt').read_text(encoding='utf-8-sig').splitlines():
    if line.strip():
        route, module, intro, question, answer, check = line.split('|')
        assert route not in spec
        spec[route] = (module, intro, question, answer, check)
report_spec = dict(line.split('|', 1) for line in (root/'lib/report-answer-spec.txt').read_text(encoding='utf-8').splitlines() if line.strip())
assets = json.loads((root/'lib/screenshot-assets.json').read_text(encoding='utf-8'))
image_map = {}

# Each original was visually inspected. The screenshots contain synthetic QA
# names, not real counterparties. They document UI only, not successful tests.
for route, label, name, filename, focus in [
    ('#/addition-order/new','رسالة المخزن مطلوب في إذن الاستلام','erp-receipt-required-store.png','FAIL_SM_RequiredStore-2026-11-03_00-08-58-7a963718-49d2-4c26-bf14-499791e3fea8.png',dict(x=32.5,y=20,w=22,h=11)),
    ('#/customers-and-suppliers','معايير كشف حساب العملاء','erp-customer-report-filters.png','FAIL_inspectNativeReportDateInputsWithoutSaving-2026-11-02_12-27-07-e4a978eb-fc1e-4a5f-806e-358d81bb266c.png',dict(x=32,y=35,w=59,h=37)),
    ('#/vouchers','أعمدة استعراض قيود اليومية','erp-journal-list.png','FAIL_inspectSavedVoucherRowAndPrintedCells-2026-11-02_19-03-24-ac72d987-6239-4319-a7e9-3ea3ee755c94.png',dict(x=43,y=31,w=80,h=14)),
    ('#/customer-discount','استعراض إشعار خصم عميل وحالة التخصيص','erp-customer-discount-list.png','FAIL_inspectOwnedOtherFinancialListColumns-2026-11-02_16-19-37-59f255ee-d8ce-4de4-bd5c-3dd2668950b9.png',dict(x=43,y=31,w=80,h=14)),
    ('#/supplier-discount','استعراض إشعار خصم مورد وحالة التخصيص','erp-supplier-discount-list.png','FAIL_inspectOwnedOtherFinancialListColumns-2026-11-02_16-19-45-330b28e7-eba2-4ae1-a939-d7348059801e.png',dict(x=43,y=31,w=80,h=14)),
    ('#/agentItinerary','بيانات خط السير وتواريخ الزيارة','erp-route-visit-panel.png','FAIL_expandedVisitShowsExactCustomerStatusTitleAndEnteredDates-2026-11-02_19-43-04-ce08efb8-58ee-4fd4-ba25-eb03121ab92b.png',dict(x=89,y=46,w=20,h=81)),
    ('#/invoice-list','فلاتر وأنواع مستندات المبيعات','erp-sales-list-filters.png','FAIL_savedPlanningDocumentMatchesItsVisibleRowWithoutStockOrCustomerDebt-2026-11-02_16-48-49-29f57ea5-83b3-4277-bfd3-e1ad4f315423.png',dict(x=43,y=36,w=80,h=36)),
]:
    original = erp / 'screenshots' / filename
    target = root / 'public/assets' / name
    data = original.read_bytes()
    date = '2026-11-03' if '2026-11-03_' in filename else '2026-11-02'
    caption = label + ' · لقطة فعلية أرشيفية '+date+' ببيانات QA تجريبية؛ توضح الواجهة فقط ولا تثبت نجاح العملية.'
    digest = hashlib.sha256(data).hexdigest()
    previous = next((a for a in assets if a['name'] == name), None)
    if previous:
        assert previous['sha256'] == digest, 'Released screenshot changed: '+name
    else:
        assets.append(dict(name=name,caption=caption,source='screenshots/'+filename,capturedAt=date,scope='UI_ONLY_FROM_HISTORICAL_FAILURE_ARTIFACT',sha256=digest))
    target.write_bytes(data)
    image_map[route] = (name,caption,focus)
image_map['#/invoice/new'] = ('erp-invoice.jpg','صورة فعلية لشاشة فاتورة بيع عامة غير محفوظة بتاريخ 2026-11-02؛ لا تثبت أثر الحفظ.',None)
image_map['#/sales-order/new'] = ('erp-sales-order.jpg','صورة فعلية لأمر بيع عام غير محفوظ بتاريخ 2026-11-02؛ لا تثبت أثر الحفظ.',None)

def activities_for(route):
    if not route.startswith('#'): return ['hr']
    if route == '#/car-colors': return ['cars']
    if route == '#/cars': return ['concrete']
    if route in ['#/contracts/new']: return ['construction']
    if route in ['#/tables','#/restaurant-menu','#/restaurant-orders','#/restaurant-dashboard']: return ['restaurant']
    if any(x in route for x in ['concrete','castingTypes','cementTypes','maxTemperature','reservations','drivers']): return ['concrete']
    if route in ['#/invoice/new','#/quotation/new','#/sales-order/new']: return ['general']
    if route == '#/projects': return ['construction','concrete']
    return ['general','restaurant','construction','concrete','cars']

new_entries = []
matrix = []

def make_entry(key,title,summary,module,activities,source,steps,outcome,route='',kind='شرح مفهوم'):
    content = dict(title=title,summary=summary,module=module,activities=activities,
        aliases=[title.replace('إزاي','ازاي'),route] if route else [title],kind=kind,
        scopeNote='مسودة للفريق مبنية على حصر الشاشات ومعرفة المشروع. الإتاحة والحقول والأثر لازم تتراجع على إصدار العميل وصلاحياته. الصور المرفقة، إن وجدت، توضح الجزء الظاهر فقط.',
        prerequisites=['تحديد النشاط والفرع والفترة والحساب المطلوب قبل المقارنة.','استخدام صلاحية معتمدة؛ لا تنفذ حفظًا أو حذفًا أو ترحيلًا لمجرد تجربة الشرح.'],
        steps=[dict(title=t,text=text,image=None,caption='',focus=None) for t,text in steps],
        outcome=outcome,warnings=['الإجابة تحتاج تحققًا من الإصدار الحالي قبل النشر للعميل.','مراجعة حالة الحفظ والارتباطات أولًا قبل إعادة تنفيذ أي حركة مالية أو مخزنية.'],
        relatedIds=[],reply=summary+'\n'+steps[-1][1],verifiedAt='',
        verificationNote='DOC/SRC static guidance, not LIVE. Sources: '+source+'. UI route inventory is not business qualification. Historical screenshots are from failed/probe test artifacts, not evidence that an operation passed. Current ERP HEAD dec1f1fc7f303b915d393c4c4c90af28c26b80f4 plus pre-existing local changes. No live session used; 2026-11-03.')
    entry=dict(id=identity(key),key=key,source=source,screenKeys=[route] if route else [],content=content)
    new_entries.append(entry)
    return entry

for screen in screens+hr_screens:
    route = screen['route']
    name = screen.get('screen',screen.get('name',''))
    if route=='#/logs':
        matrix.append(dict(route=route,name=name,state='excluded_removed',reason='Owner-confirmed removal: docs/testing/AUDIT_LOG_REMOVAL_2026_10_25_AR.md',articleIds=[]))
        continue
    assert route in spec, 'Missing authored screen guidance: '+route
    module,intro,q,answer,check = spec[route]
    source=('docs/testing/SCREEN_DEPTH_AUDIT.csv; docs/project/MODULE_MAP.md; docs/project/BUSINESS_RULES.md' if route.startswith('#') else 'docs/hr/SCREEN_COVERAGE.csv; docs/hr/BUSINESS_RULES_AR.md; docs/hr/CASE_CATALOG_AR.csv')
    activities=activities_for(route)
    overview=make_entry('expanded-screen-'+route+'-overview','إيه استخدام شاشة «'+name+'» وإيه اللي أراجعه فيها؟',intro,module,activities,source,
        [('حدد الغرض والنطاق',intro),('افتح الشاشة المناسبة للمراجعة','من مساحة '+('الموارد البشرية' if activities==['hr'] else 'ERP')+' اختار «'+name+'» لو متاحة لحسابك، وطابق عنوانها والفرع. أسماء القوائم وترتيبها تتأكد من إصدارك؛ الوصول المباشر لا يتجاوز الصلاحيات.'),('طابق بيانات الحالة',check)],
        'تحديد نطاق شاشة '+name+' والبيانات المطلوب مطابقتها قبل إجراء أي تغيير؛ فتح الشاشة لا يثبت صحة أرقامها أو نجاح عملياتها.',route)
    business=make_entry('expanded-screen-'+route+'-business',q,answer,module,activities,source,
        [('افهم الفرق',answer),('جهّز مرجع المراجعة',check),('وثّق لو الفرق مستمر','سجّل اسم الشاشة «'+name+'» والفرع والفترة ورقم السجل أو المستند المعني، والظاهر والمتوقع ومصدره. أخفِ البيانات غير اللازمة ثم أرسل التفاصيل بقناة الدعم المعتمدة.')],
        'تحديد تفسير الحالة أو البيانات الناقصة لمراجعتها، دون تغيير '+name+' أو إنشاء مستند بديل لمجرد تجاوز الفرق.',route,kind='تشخيص مشكلة' if any(x in q for x in ['ليه','لو','مختلف','مش']) else 'شرح مفهوم')
    if route in image_map:
        asset,caption,focus=image_map[route]
        for entry,index in [(overview,1),(business,1)]:
            # Attach only to context review, never as proof of financial outcome.
            step=entry['content']['steps'][index]
            step.update(image=dict(kind='asset',name=asset),caption=caption,focus=focus)
    matrix.append(dict(route=route,name=name,module=module,activities=activities,state='draft_guidance',articleIds=[overview['id'],business['id']],image=route in image_map,businessVerified=False))

for report in reports:
    name,cat=report['report'],report['catalogue']
    assert name in report_spec, 'Missing authored report guidance: '+name
    filters=[]
    for value in report['observed_filter_labels'].split(';'):
        value=value.strip()
        if value and not any(c.isdigit() for c in value) and value not in filters: filters.append(value)
    activity=['restaurant'] if 'مطاعم' in name or 'الطاولات' in name else ['cars'] if 'السيارات' in name else ['concrete'] if 'الحجوزات' in name else ['general','restaurant','construction','concrete','cars']
    source='docs/testing/REPORT_CONTENT_GAPS.csv; docs/project/MODULE_MAP.md; docs/project/BUSINESS_RULES.md'
    answer=report_spec[name]
    filter_text='المعايير المرصودة في الحصر: '+ '، '.join(filters)+'. راجع القيم المختارة في نسختك قبل عرض النتائج.' if filters else 'الحصر لا يوثق معايير هذا التقرير بشكل كافٍ؛ راجع نموذج التقرير الفعلي مع الفريق ولا تفترض حقولًا غير ظاهرة.'
    entry=make_entry('expanded-report-'+cat+'-'+name,'إزاي أراجع «'+name+'» وأفهم نتيجته؟',answer,'reports',activity,source,
        [('اختار التقرير والنطاق','افتح «'+name+'» من كتالوج التقارير المناسب لو متاح لحسابك. '+filter_text),('طابق النتيجة بالمصدر',answer),('راجع التفاصيل قبل الإجمالي','ابدأ بمستند أو طرف معلوم داخل نفس الفترة، وطابق الكود والتاريخ والأعمدة والمجموع. لو النتيجة فاضية راجع الفلاتر؛ الفراغ لا يثبت إن القيمة صفر. احتفظ بمعايير العرض لو هتطلب دعم.')],
        'مطابقة عينة من «'+name+'» بمعاييرها ومراجعها، أو تجهيز فرق محدد للدعم؛ لا يوجد اعتماد محاسبي أو تحقق حي في هذه المسودة.','#/'+cat)
    if name=='تقرير كشف حساب العملاء':
        asset,caption,focus=image_map['#/customers-and-suppliers']
        entry['content']['steps'][0].update(image=dict(kind='asset',name=asset),caption=caption,focus=focus)

# Generation is append-only: existing authored content, images and references win.
existing_by_id={e['id']:e for e in existing_catalog}
new_entries=[existing_by_id.get(e['id'],e) for e in new_entries]
all_entries=legacy+new_entries+supplemental
for entry in new_entries:
    if entry['id'] in existing_by_id: continue
    c=entry['content']
    exact=[x['id'] for x in new_entries if x['id']!=entry['id'] and x['screenKeys']==entry['screenKeys'] and x['content']['activities']==c['activities']]
    similar=[x['id'] for x in all_entries if x['id']!=entry['id'] and x['content']['module']==c['module'] and x['content']['activities']==c['activities']]
    c['relatedIds']=list(dict.fromkeys(exact+similar))[:4]
assert len(set(x['id'] for x in all_entries))==len(all_entries)
assert len(set(x['content']['title'] for x in all_entries))==len(all_entries)
write_json(root/'lib/faq-catalog.json',all_entries)
write_json(root/'lib/screenshot-assets.json',assets)
prior_coverage=json.loads((root/'lib/catalog-coverage.json').read_text(encoding='utf8'))
meta=dict(version='faq-v2',date='2026-11-03',total=len(all_entries),legacy=107,added=len(new_entries),screens=len(matrix),screenGuidance=sum(x['state']=='draft_guidance' for x in matrix),excluded=sum(x['state']=='excluded_removed' for x in matrix),reports=len(reports),screensWithImages=sum(x.get('image',False) for x in matrix),articlesWithImages=sum(any(s['image'] for s in x['content']['steps']) for x in all_entries),additionalScreenshots=len(assets),verifiedBusinessProcedures=0,liveCapturePerformed=False,publication='DEFERRED',screensInventory=matrix)
meta={**prior_coverage,**meta}
for screen in matrix:
    linked=[e['id'] for e in supplemental if screen['route'] in e['screenKeys']]
    if linked:
        screen['image']=True
        screen['supplementalArticleIds']=linked
for screen in matrix:
    linked = [e for e in all_entries if screen['route'] in e.get('screenKeys',[])]
    screen['image'] = any(s.get('image') for e in linked for s in e['content']['steps'])
meta.update(screensWithImages=sum(x.get('image',False) for x in matrix),liveCapturePerformed=any(a.get('scope','').startswith('LIVE_') for a in assets),liveReadOnlyScreenshots=sum(a.get('scope','').startswith('LIVE_') for a in assets),liveIllustratedArticles=sum(e['key'].startswith('live-ui-v1-') for e in supplemental),supplementalIllustratedArticles=sum(e['key'].startswith('illustrated-v3-') for e in supplemental))
write_json(root/'lib/catalog-coverage.json',meta)
print(json.dumps({k:v for k,v in meta.items() if k!='screensInventory'}))
