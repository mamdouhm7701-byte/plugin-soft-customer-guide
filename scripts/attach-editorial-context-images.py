"""Curated exact-subject references for the original FAQ and matching screen guides.

Images illustrate only their visible UI, never the financial outcome of a concept.
Existing editorial images win. No connection, publication or verification-date change.
"""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
catalog=json.loads((root/'lib/faq-catalog.json').read_text(encoding='utf8'))
assets=json.loads((root/'lib/screenshot-assets.json').read_text(encoding='utf8'))
registered={a['name']:a for a in assets}
specs=[
('settings-general-01','live-customer-receipt-empty.png','اسم الفرع الحالي ظاهر أعلى الشاشة؛ النموذج لا يعرض قائمة تغيير الفرع.'),
('settings-general-02 settings-general-03','live-user-empty.png','نموذج المستخدم يعرض الفروع ونسخ الصلاحيات؛ لا يثبت إتاحة شاشة أو اعتماد صلاحية.'),
('settings-general-04','live-branch-empty.png','مثال لتعريف الفرع ضمن تجهيزات التشغيل؛ بقية التعريفات والأرصدة تُراجع مستقلة.'),
('settings-general-05','live-payment-methods-form.png','حقول تعريف طريقة الدفع؛ راجع الربط الفعلي ولا تعتبر الاسم وحده دليلًا.'),
('settings-general-06','live-item-empty.png','مثال فعلي لعلامات الحقول المطلوبة في نموذج صنف فارغ؛ لم تُحفظ بيانات.'),
('products-general-03','live-price-list-empty.png','نموذج قائمة الأسعار قبل إضافة أصناف؛ لا يعرض سعرًا محفوظًا أو أثرًا رجعيًا.'),
('products-general-05 products-general-07','live-item-empty.png','مرجع حقول هوية الصنف والوحدة والباركود؛ ليس نتيجة بحث أو دليلًا على غياب صنف.'),
('products-general-06','live-manufacturing-empty.png','موضع الأصناف في إذن التصنيع؛ المكونات وكمياتها تراجع حسب وصفة الصنف.'),
('dealers-general-01','live-supplier-empty.png','نموذج تعريف المورد للمقارنة بهوية الطرف؛ هذا ليس نموذج عميل.'),
('dealers-general-02 dealers-general-06','erp-customer-definition-fields.png','حقول تعريف العميل في لقطة أرشيفية؛ ليست تجربة تعديل حالي.'),
('sales-general-01 sales-general-02 sales-general-08','live-sales-order-empty.png','نموذج أمر البيع قبل الحفظ؛ الأثر الحسابي موضح بالنص ولا تثبته الصورة.'),
('sales-general-04 sales-general-05','live-sales-return-empty.png','نموذج مرتجع البيع الفارغ؛ راجع المصدر والكميات قبل التنفيذ.'),
('sales-general-06 sales-general-09','live-sales-invoice-empty.png','حقول فاتورة عامة فارغة؛ لا تتضمن تنفيذ المثال الضريبي أو حسابات محفوظة.'),
('sales-general-07','live-discount-type-empty.png','حقول تعريف نوع الخصم ونسبته؛ الحدود الفعلية وصلاحية المستخدم تحتاج مراجعة مستقلة.'),
('sales-general-11','live-under-review-empty.png','نموذج مستند تحت الإجراء قبل الحفظ؛ لا يثبت تنفيذ تعديل على مستند محفوظ.'),
('purchases-general-01 purchases-general-04','live-purchase-order-empty.png','نموذج أمر شراء فارغ؛ الأثر المخزني موضح بالنص ولا تثبته الصورة.'),
('purchases-general-02 purchases-general-07','live-purchase-invoice-empty.png','حقول فاتورة الشراء قبل الحفظ؛ لا تثبت قبول الخصم أو نتيجة حسابية.'),
('purchases-general-03','live-purchase-return-empty.png','مرجع نموذج مرتجع المشتريات؛ لا توجد فاتورة مصدر مختارة أو عملية محفوظة.'),
('purchases-general-05','live-supplier-payment-empty.png','مرجع سند صرف المورد؛ تخصيص دفعة فعلية لفاتورة غير ظاهر في هذه الصورة.'),
('inventory-general-01','live-stock-addition-empty.png','نموذج إذن استلام كمثال لحركة مخزنية؛ التالف والصرف لهما نموذجان مستقلان.'),
('inventory-general-02','live-storage-transfer-empty.png','حقلا المصدر والوجهة وصفوف الأصناف؛ لم ينفذ تحويل أو قياس أرصدة.'),
('inventory-general-04','live-inventory-empty.png','نموذج الجرد وتحذير توقيت الإغلاق وعمودا الدفتري والفعلي؛ لم يُفتح محضر محفوظ.'),
('inventory-general-05','live-shortage-adjustment-empty.png','مرجع نموذج العجز الفارغ؛ الفائض إجراء مستقل، ولا تثبت الصورة اعتماد تسوية.'),
('inventory-general-06','live-manufacturing-empty.png','نموذج إذن التصنيع قبل الحفظ؛ لا يثبت استهلاك مكونات أو زيادة منتج تام.'),
('finance-general-01 finance-general-02 finance-general-03','live-customer-receipt-empty.png','نموذج سند القبض ومبلغ وطريقة دفع فارغان؛ لا يعرض تخصيصًا منفذًا أو متبقي فاتورة.'),
('finance-general-04','live-expense-movement-empty.png','نموذج المصروف وأنواعه ودليل الحسابات؛ الإيراد نموذج مستقل ولا توجد حركة محفوظة.'),
('finance-general-05','erp-customer-discount-list.png','استعراض خصم عميل أرشيفي؛ الخصم ليس دليلًا على تحصيل نقدي.'),
('finance-general-06','live-financial-transfer-empty.png','نموذج التحويل وحقلا من (دائن) وإلى (مدين)؛ لا توجد تسوية منفذة.'),
('sales-restaurant-01 sales-restaurant-03 sales-restaurant-04','erp-restaurant-payment-panel.png','جزء الدفع من كاشير المطعم في لقطة أرشيفية؛ لا يثبت نتيجة المثال الحسابي.'),
('sales-restaurant-02','live-table-empty.png','تعريف رقم الطاولة وعدد الأفراد؛ لا يعرض طلبًا مرتبطًا أو فاتورة محفوظة.'),
('sales-construction-01 sales-construction-03 sales-construction-04 sales-construction-05','live-contract-empty.png','نموذج العقد الفارغ كمرجع للحقول؛ لا يثبت اعتماد شروط أو فوترة مرحلة.'),
('inventory-concrete-01','live-vehicle-empty.png','تعريف سيارة تشغيل الخرسانة وسائقها وتواريخها؛ هذه ليست شاشة شاسيهات بيع معرض.'),
('inventory-concrete-02','live-reservation-empty.png','نموذج حجز خرسانة فارغ؛ لا يثبت حجزًا أو أثرًا ماليًا.'),
('inventory-concrete-03','live-concrete-delivery-empty.png','نموذج تسليم الخرسانة؛ الفاتورة والتحصيل والمطابقة مستندات مستقلة.'),
('inventory-concrete-05','live-concrete-review-empty.png','نموذج تحت الإجراء للخرسانة؛ لا يثبت نجاح تعديل مستند محفوظ.'),
('sales-cars-01 sales-cars-02 sales-cars-03','erp-car-invoice-chassis.png','موضع الشاسيه في لقطة فاتورة معرض أرشيفية؛ لا يثبت بيعًا أو مرتجعًا حاليًا.'),
('sales-cars-04','live-car-colors-modal.png','تعريف لون السيارة الفارغ؛ لا يعرض تغيير لون سيارة لها حركات.'),
('hr-hr-02','erp-hr-employee-personal-form.png','حقول موظف في لقطة أرشيفية؛ الإتاحة الحالية لم تتأكد في حساب التصوير.'),
('hr-hr-04 hr-hr-05 hr-hr-06','erp-hr-adjustment-list.png','استعراض استحقاقات واستقطاعات أرشيفي؛ لا يثبت تطبيق المثال الحسابي أو ربط بند.'),
('hr-hr-07 hr-hr-10','erp-hr-salary-calculation-form.png','نموذج احتساب راتب أرشيفي؛ قواعد المثال بالنص وليست نتيجة محتسبة في الصورة.'),
('hr-hr-08 hr-hr-12','erp-hr-vacation-list.png','استعراض إجازات أرشيفي؛ لا يثبت خصم راتب أو اعتماد رصيد.'),
('hr-hr-09','erp-hr-advance-list.png','استعراض سلف أرشيفي؛ راجع جدول الحالة، فالصورة ليست تنفيذًا للمثال.'),
('hr-hr-11','erp-hr-payroll-report-form.png','مرجع معايير تقرير الرواتب الأرشيفي؛ لا يعرض نتائج الفترة الحالية.'),
]
screen_images={
 '#/customers':'erp-customer-definition-fields.png', '#/drivers':'erp-concrete-driver-validation.png',
 '/employees':'erp-hr-employee-personal-form.png','/calculateSalary':'erp-hr-salary-calculation-form.png',
 '/employeeAdvancePayment':'erp-hr-advance-list.png','/benefitsAndDeductions':'erp-hr-adjustment-list.png',
 '/vacationRequest':'erp-hr-vacation-list.png','/employees-reports':'erp-hr-payroll-report-form.png',
}
bykey={e['key']:e for e in catalog};changed=set()
def attach(entry,index,name,caption):
 assert name in registered
 step=entry['content']['steps'][index]
 if step['image']:return
 a=registered[name]
 step.update(image=dict(kind='asset',name=name),focus=None,caption=a['caption']+' '+caption)
 changed.add(entry['id'])
for keys,name,caption in specs:
 for key in keys.split():attach(bykey[key],0,name,caption)
for e in catalog:
 if not e['key'].startswith('expanded-screen-'):continue
 for route in e.get('screenKeys',[]):
  if route in screen_images:
   attach(e,1,screen_images[route],'مرجع أرشيفي لنفس الشاشة والجزء الظاهر؛ لا يثبت تنفيذ المراجعة أو الأثر المالي الحالي.')
(root/'lib/faq-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps(dict(changedArticles=len(changed),publication=0,verificationDatesChanged=0)))
