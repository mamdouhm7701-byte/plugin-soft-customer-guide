"""Attach explicitly reviewed current blank-document UI captures without publishing."""
from pathlib import Path
import argparse,json,hashlib
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--captures',type=Path,required=True);captures=p.parse_args().captures
catalog=json.loads((root/'lib/faq-catalog.json').read_text(encoding='utf-8'));assets=json.loads((root/'lib/screenshot-assets.json').read_text(encoding='utf-8'))
names=['purchase-invoice','purchase-order','purchase-return','stock-addition','stock-exchange','manufacturing','quotation','sales-return','sales-order','sales-invoice','contract','reservation','concrete-delivery','concrete-invoice','under-review','concrete-review']
routes={}
for key in names:
 name='live-'+key+'-empty.png';proof=json.loads((captures/(name[:-4]+'.json')).read_text(encoding='utf-8'));data=(captures/name).read_bytes();digest=hashlib.sha256(data).hexdigest()
 assert proof['mode']=='native-viewport-screenshot'
 proof.update(sha256=digest,review='Visually reviewed: correct rendered empty form, no loading overlay, no customer/supplier records, only generic default branch/store/safe labels; no save/mutation.')
 source=Path('docs/evidence/live-captures')/(key+'-document.json');(root/source).write_text(json.dumps(proof,ensure_ascii=False,indent=2),encoding='utf-8')
 caption='صورة فعلية حالية · '+proof['capturedAt'][:10]+' · نموذج فارغ غير محفوظ؛ القيم الافتراضية تراجع حسب فرعك.'
 old=next((a for a in assets if a['name']==name),None)
 if old: assert old['sha256']==digest,'Do not replace an already released capture'
 else: assets.append(dict(name=name,source=source.as_posix(),sha256=digest,capturedAt=proof['capturedAt'],scope='LIVE_EMPTY_DOCUMENT_UI',caption=caption))
 (root/'public/assets'/name).write_bytes(data);routes['#'+proof['route']]=name
business={'SL-PLAN':'sales-order','SL-ORDER':'sales-order','SL-ADVANCE':'sales-order','SL-RETURN':'sales-return','PU-STOCK':'purchase-invoice','PU-DISCOUNT':'purchase-invoice','ST-MOVEMENT':'stock-addition','ST-MANUFACTURE':'manufacturing','TAX-POLICY':'sales-invoice','TAX-ROUND':'sales-invoice'}
bykey={e['key']:e for e in catalog}
for entry in catalog:
 name=next((routes[r] for r in entry.get('screenKeys',[]) if r in routes),None)
 rule=next((key for key in business if entry['key']=='business-v1-'+key.lower()),None)
 if rule:name='live-'+business[rule]+'-empty.png'
 if not name:continue
 asset=next(a for a in assets if a['name']==name)
 for step in entry['content']['steps']:
  if step['image'] is None or rule:
   step['image']=dict(kind='asset',name=name);step['focus']=None;step['caption']=asset['caption']+' الصورة توضح الحقول فقط ولا تثبت تنفيذ المثال.'
 # No verification date or published status is gained by attaching a UI image.
meta=json.loads((root/'lib/catalog-coverage.json').read_text(encoding='utf-8'))
for screen in meta['screensInventory']:
 if screen['route'] in routes:screen['image']=True;screen['liveUiCaptured']=True
meta.update(total=len(catalog),articlesWithImages=sum(any(s['image'] for s in e['content']['steps']) for e in catalog),additionalScreenshots=len(assets),liveReadOnlyScreenshots=sum(a['scope'].startswith('LIVE_') for a in assets),screensWithImages=sum(s.get('image',False) for s in meta['screensInventory']))
for name,data in [('lib/faq-catalog.json',catalog),('lib/screenshot-assets.json',assets),('lib/catalog-coverage.json',meta)]: (root/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:meta[k] for k in ['total','articlesWithImages','additionalScreenshots','liveReadOnlyScreenshots','screensWithImages']}))
