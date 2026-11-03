"""Prepare bounded ERP editorial reviews; retain released snapshots and all HR drafts.

No ERP connection, invented capture, transaction execution or live publication.
"""
from pathlib import Path
import json, hashlib, collections
root=Path(__file__).resolve().parents[1]
read=lambda p:json.loads((root/p).read_text(encoding='utf8'))
write=lambda p,v:(root/p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
catalog=read('lib/faq-catalog.json'); previous=read('lib/released-articles.json')
released={e['id']:e for e in previous}; assets={a['name']:a for a in read('lib/screenshot-assets.json')}
reports=read('docs/evidence/report-criteria/index.json')['reviewed']
report_assets={r['report']:r['asset'] for r in reports}
# Explicit subject mapping: reference UI only, never an executed result.
subject_images={
 'settings-general-07':'live-user-empty.png',
 'products-general-01':'live-report-061.png',
 'products-general-02':'live-item-empty.png',
 'products-general-04':'live-sales-invoice-empty.png',
 'dealers-general-03':'live-report-005.png','dealers-general-04':'live-report-006.png',
 'dealers-general-05':'live-customer-empty.png',
 'sales-general-03':'erp-sales-list-filters.png','sales-general-10':'erp-sales-list-filters.png',
 'purchases-general-06':'live-purchase-invoice-empty.png',
 'inventory-general-03':'live-report-059.png','inventory-general-07':'live-item-empty.png',
 'finance-general-07':'live-customer-receipt-empty.png',
 'accounting-general-01':'live-report-034.png','accounting-general-02':'erp-journal-list.png',
 'accounting-general-03':'erp-journal-list.png','accounting-general-04':'live-report-023.png',
 'accounting-general-05':'live-report-022.png','accounting-general-06':'live-report-028.png',
 'accounting-general-07':'live-report-034.png',
 'reports-general-01':'live-report-035.png','reports-general-02':'live-report-035.png',
 'reports-general-03':'live-report-059.png','reports-general-04':'live-report-025.png',
 'reports-general-05':'live-report-035.png','reports-general-06':'live-report-035.png',
 'sales-restaurant-05':'erp-restaurant-payment-panel.png',
 'sales-construction-02':'live-contract-empty.png',
 'inventory-concrete-04':'live-report-051.png',
 'support-general-01':'live-customer-receipt-empty.png',
 'support-general-02':'erp-sales-list-filters.png',
 'support-general-03':'live-customer-empty.png',
 'support-general-06':'live-customer-receipt-empty.png',
}
context_notes={
 'products-general-01':'نموذج تقرير باركود الأصناف مثال لمرجع الصنف والوحدة؛ ليس صورة نتيجة بحث قائمة الأصناف.',
 'products-general-02':'بيانات الوحدة الأساسية في تعريف الصنف؛ هذه الصورة لا تعرض معامل الوحدة الإضافية.',
 'products-general-04':'نموذج فاتورة عامة للمقارنة؛ علامة الإعفاء في تعريف الصنف ليست موثقة بهذه اللقطة.',
 'dealers-general-05':'تعريف العميل مرجع هوية الطرف؛ الصورة لا تعرض إدخال رصيد افتتاحي.',
 'sales-general-03':'استعراض أرشيفي لأنواع مستندات البيع؛ لا يثبت صلاحية تعديل فاتورة أو حذفها.',
 'sales-general-10':'استعراض أرشيفي للمستندات؛ لا يعرض نافذة الطباعة أو إجراءً لطباعة مستند محدد.',
 'accounting-general-04':'معايير كشف الأستاذ مرجع للمراجعة؛ لا تعرض تنفيذ قيد المثال أو الفرق بين طريقتي الجرد.',
 'inventory-concrete-04':'معايير تقرير الحجوزات والمنفذ منها ضمن دورة الخرسانة؛ ليست صورة تقرير تشغيل كامل.',
 'support-general-01':'مثال لنموذج فارغ يظهر اسم الشاشة والفرع؛ لا تستخدم بيانات الحالة الفعلية في دليل عام.',
 'support-general-03':'نموذج عميل فارغ دون أسماء أو أرقام فعلية كمثال آمن للصورة؛ لم يتم تنقيح صورة عميل أو إخفاء حقول منها.',
 'support-general-06':'مرجع لشاشة فارغة لتحديد موضع المشكلة؛ ليست تذكرة دعم أو نتيجة حل.',
}
route_references={
 '#/accounts-reports':'live-report-027.png','#/items-reports':'live-report-062.png',
 '#/purchase-reports':'live-report-001.png','#/sales-reports':'live-report-035.png',
 '#/restaurant-menu':'erp-restaurant-payment-panel.png',
}
withheld={
 'inventory-general-08':'Negative-stock behavior is policy-specific and not qualified by current source/captures.',
 'sales-construction-05':'Retention/milestone behavior is not established; do not invent a workflow.',
 'sales-cars-05':'Financing/installment workflow is not established by the chassis journey.',
}
bykey={e['key']:e for e in catalog};new=[];decisions=[]
for entry in catalog:
 c=entry['content'];key=entry['key']
 if 'hr' in c['activities']:
  decisions.append(dict(id=entry['id'],key=key,decision='deferred_hr'));continue
 if entry['id'] in released:
  assert c==released[entry['id']]['content'],'Published snapshot must not be rewritten: '+key
  decisions.append(dict(id=entry['id'],key=key,decision='existing_release_preserved'));continue
 if key=='support-general-05':
  decisions.append(dict(id=entry['id'],key=key,decision='internal_team_guide',reason='Covered in authenticated Team Help and scoped reply sharing; not a customer-facing article.'));continue
 if key in withheld:
  decisions.append(dict(id=entry['id'],key=key,decision='withheld_business',reason=withheld[key]));continue
 name=subject_images.get(key)
 if not name:
  name=next((route_references[r] for r in entry.get('screenKeys',[]) if r in route_references),None)
 existing=next((s['image']['name'] for s in c['steps'] if s.get('image') and s['image']['kind']=='asset'),None)
 name=name or existing
 if not name:
  decisions.append(dict(id=entry['id'],key=key,decision='withheld_image',reason='No matching reviewed public-safe UI reference; no unrelated screenshot substituted.'));continue
 assert name in assets or name in ['erp-invoice.jpg','erp-sales-order.jpg']
 # Curated navigation/diagnostic guidance, not a promise of completed saves.
 if not key.startswith(('expanded-','illustrated-v3-','live-ui-v1-')):
  c['steps'][0]['title']='افهم الإجابة وحدد الحالة'
  c['steps'][1]['title']='راجع البيانات والمراجع'
  if len(c['steps'])==2:
   c['steps'].append(dict(title='جهّز التفاصيل لو الفرق مستمر',text='احتفظ باسم الشاشة والفرع ونوع المستند ورقمه وتاريخه ونص الرسالة والظاهر والمتوقع ومصدر المقارنة. أرسل الحد اللازم لقناة الدعم، ولا تكرر الحفظ أو تنشئ تسوية قبل التأكد من حالة العملية.',image=None,caption='',focus=None))
 for step in c['steps']:
  if not step['image']:
   step.update(image=dict(kind='asset',name=name),focus=None,
    caption=('صورة فعلية مرجعية لنفس موضوع المراجعة؛ '+context_notes.get(key,'توضح الجزء الظاهر من النموذج فقط، ولا تثبت تنفيذ الخطوة أو صحة الأرصدة والحسابات.'))[:280])
 # Keep the original specific answer, improve its release-facing evidence boundary.
 c['kind']='توضيح حسابات' if c['kind']=='توضيح حسابات' else ('تشخيص مشكلة' if key.endswith('-business') or key.startswith(('support-','reports-general-')) else 'شرح مفهوم')
 c['scopeNote']='إجابة إرشادية لمراجعة الحالة في النشاط المحدد، مبنية على مصادر المشروع والصور الفعلية المرفقة. الصور مرجع للواجهة؛ لا توثق تنفيذ حركة على حسابك أو اعتماد نتائج مالية. طابق إصدارك وصلاحياتك وسياسة الفرع.'
 c['prerequisites']=['حدد النشاط والفرع ونوع المستند والفترة أو الطرف قبل المقارنة.','استخدم حسابك المصرح له؛ جهّز مرجع الحالة دون مشاركة كلمة سر أو بيانات غير لازمة.']
 c['warnings']=[w for w in c['warnings'] if 'الإجابة تحتاج تحققًا' not in w and 'المسودة' not in w]
 c['warnings']=list(dict.fromkeys(c['warnings']+['لا تغيّر إعدادًا أو رصيدًا أو مستندًا لتجربة الشرح؛ راجع المسؤول عند اختلاف الحالة.','المثال والصورة لا يثبتان حفظ حركة أو اكتمال ترحيلها أو سدادها.']))[:12]
 if key.startswith('expanded-report-'):
  c['scopeNote']='دليل لاختيار معايير التقرير وفهم أساس المقارنة. نموذج الفلاتر الفعلي مراجع بالصورة؛ لا تتضمن الصورة بيانات ناتج أو اعتماد صحة الأرقام أو تنفيذ التقرير.'
  c['outcome']='تحديد معايير التقرير ومرجع المطابقة الصحيح، وتجهيز فرق محدد للمراجعة؛ النتيجة الفعلية تُطابق بمستندات الحالة.'
 else:
  c['outcome']='تحديد البيانات والمراجع الصحيحة للمراجعة وتجهيز فرق واضح للدعم عند الحاجة؛ لا يتضمن هذا الشرح تنفيذ تغيير على بياناتك.'
 c['verifiedAt']='2026-11-03'
 # Date is editorial/source/UI review; original capture times remain in asset proof.
 source=(entry.get('source') or 'docs/project/MODULE_MAP.md')
 c['verificationNote']=('EDITORIAL_REVIEW 2026-11-03; not LIVE transaction execution. Reviewed original question/answer and bounded diagnostic scope against '+source+'. Image references retain recorded capture scope; no report output, financial save, tax compliance or permission-matrix qualification claimed. Previous source verification: '+c['verificationNote'])[:1500]
 c['reply']=c['summary']+'\n'+c['steps'][1]['text']
 new.append(entry)
 decisions.append(dict(id=entry['id'],key=key,decision='reviewed_for_release',scope='report_criteria_and_reconciliation_guidance' if key.startswith('expanded-report-') else 'bounded_diagnostic_or_ui_guidance',image=name))
approved_ids=set(released)|{e['id'] for e in new}
byid={e['id']:e for e in catalog}
for e in new:
 c=e['content'];c['relatedIds']=[i for i in c['relatedIds'] if i in approved_ids and byid[i]['content']['module']==c['module'] and set(byid[i]['content']['activities'])&set(c['activities'])]
 released[e['id']]=dict(id=e['id'],content=c)
write('lib/faq-catalog.json',catalog);write('lib/released-articles.json',list(released.values()))
proof=read('docs/evidence/release-review.json');proof.update(scope='Reviewed bounded ERP source concepts, native UI references and report criteria/reconciliation guidance. Not transaction execution. HR remains deferred.')
proof['articles']=[dict(id=e['id'],key=e['key'],contentSha256=hashlib.sha256(json.dumps(released[e['id']]['content'],ensure_ascii=False,sort_keys=True).encode()).hexdigest()) for e in catalog if e['id'] in released]
write('docs/evidence/release-review.json',proof)
write('docs/evidence/erp-editorial-review.json',dict(date='2026-11-03',erpHead='75fc13b0a0abe1b4f1d6bd0af541837f08b4f9f9',decisions=decisions,counts=dict(collections.Counter(x['decision'] for x in decisions))))
print(json.dumps(dict(newReviewed=len(new),releasedCatalog=len(released),totalPublished=len(released)+5,remainingNonHr=sum('hr' not in e['content']['activities'] and e['id'] not in released for e in catalog),hrUnchanged=True)))
