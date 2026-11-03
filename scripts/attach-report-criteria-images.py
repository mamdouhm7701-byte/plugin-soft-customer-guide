"""Import visually reviewed native report criteria screenshots; never execute reports."""
from pathlib import Path
import json,hashlib,argparse
root=Path(__file__).resolve().parents[1];p=argparse.ArgumentParser();p.add_argument('--captures',required=True,type=Path);caps=p.parse_args().captures
catalog=json.loads((root/'lib/faq-catalog.json').read_text(encoding='utf8'));assets=json.loads((root/'lib/screenshot-assets.json').read_text(encoding='utf8'));results=json.loads((caps/'report-results.json').read_text(encoding='utf8'));reviewed=[]
for evidence in results:
 if evidence['status']!='captured':continue
 # All captured images in this exact run were individually viewed. Failures excluded.
 name=evidence['name']+'.png';data=(caps/name).read_bytes();digest=hashlib.sha256(data).hexdigest();source=Path('docs/evidence/report-criteria')/(evidence['name']+'.json');(root/source).parent.mkdir(parents=True,exist_ok=True)
 proof={**evidence,'sha256':digest,'mode':'native-viewport-screenshot','review':'Individually visually reviewed: selected report heading matches, criteria only, no customer records/report output. 2026-11-03.'}
 (root/source).write_text(json.dumps(proof,ensure_ascii=False,indent=2),encoding='utf8');(root/'public/assets'/name).write_bytes(data)
 old=next((a for a in assets if a['name']==name),None)
 if old:assert old['sha256']==digest,'Changed capture needs a new asset version'
 else:assets.append(dict(name=name,source=source.as_posix(),sha256=digest,capturedAt=evidence['capturedAt'],scope='LIVE_REPORT_CRITERIA_ONLY',caption='صورة فعلية لنموذج معايير '+evidence['label']+'؛ لا تتضمن نتائج التقرير.'))
 key='expanded-report-'+evidence['route']+'-'+evidence['label'];entry=next(e for e in catalog if e['key']==key)
 labels=[x for x in evidence['labels'] if x and x not in ['القالب','نهاري','محدد','ليلي','نصف ليلي','إيمائات التنقل','تخطيط القائمة','رأسي','أفقي','لون شريط الأعدادات','نوع شريط الأعدادات','يطفوا','ثابت','ساكن','مخفي','نوع تذييل الصفحة']]
 for i,step in enumerate(entry['content']['steps']):
  if not step['image']:
   step.update(image=dict(kind='asset',name=name),caption='صورة فعلية حالية لمعايير '+evidence['label']+'؛ توضح الفلاتر فقط ولا تثبت صحة الأرصدة أو النتائج.',focus=None)
 entry['content']['steps'][0]['text']=entry['content']['steps'][0]['text'].split('\nالحقول الظاهرة في النموذج الحالي:')[0]+'\nالحقول الظاهرة في النموذج الحالي: '+'، '.join(labels)+'. الصورة عند القيم الافتراضية؛ اختار فترة الحالة ونطاقها بدل نسخ التواريخ من المثال.'
 entry['content']['verificationNote']=entry['content']['verificationNote'].split(' Current read-only criteria capture ')[0]+' Current read-only criteria capture '+evidence['capturedAt']+'; not report execution. Evidence '+source.as_posix()
 reviewed.append(dict(articleId=entry['id'],key=key,asset=name,report=evidence['label'],source=source.as_posix()))
meta=json.loads((root/'lib/catalog-coverage.json').read_text(encoding='utf8'));meta.update(articlesWithImages=sum(any(s['image'] for s in e['content']['steps']) for e in catalog),fullyIllustratedArticles=sum(all(s['image'] for s in e['content']['steps']) for e in catalog),additionalScreenshots=len(assets),liveReadOnlyScreenshots=sum(a['scope'].startswith('LIVE_') for a in assets),reportCriteriaImages=len(reviewed))
for name,data in [('lib/faq-catalog.json',catalog),('lib/screenshot-assets.json',assets),('lib/catalog-coverage.json',meta),('docs/evidence/report-criteria/index.json',{'reviewed':reviewed,'failed':[e for e in results if e['status']!='captured'],'scope':'criteria only; not report results or transaction qualification'})]:
 (root/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({k:meta[k] for k in ['articlesWithImages','fullyIllustratedArticles','additionalScreenshots','reportCriteriaImages']}))
