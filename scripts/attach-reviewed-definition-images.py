"""Replay the nine explicitly reviewed definition captures, preserving existing asset provenance."""
from pathlib import Path
import argparse,json,hashlib
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--captures',type=Path,required=True);caps=p.parse_args().captures
catalog=json.loads((root/'lib/faq-catalog.json').read_text(encoding='utf8'));assets=json.loads((root/'lib/screenshot-assets.json').read_text(encoding='utf8'));routes={}
specs=[('car-colors-modal','#/car-colors'),('casting-types-modal','#/castingTypes'),('cement-types-modal','#/cementTypes'),('temperature-modal','#/maxTemperature'),('dealer-class-modal','#/dealersClassification'),('main-dealer-modal','#/mainDealer'),('agents-empty','#/agents'),('projects-empty','#/projects'),('visit-status-empty','#/agent-itineraries-status')]
for key,route in specs:
 name='live-'+key+'.png';proof=json.loads((root/'docs/evidence/live-captures'/(key+'.json')).read_text(encoding='utf8'));data=(caps/name).read_bytes()
 assert hashlib.sha256(data).hexdigest()==proof['sha256'],'Capture differs from reviewed image'
 (root/'public/assets'/name).write_bytes(data)
 assert any(a['name']==name and a['sha256']==proof['sha256'] for a in assets)
 routes[route]=name
for entry in catalog:
 if not entry['key'].startswith('expanded-screen-'):continue
 name=next((routes[r] for r in entry.get('screenKeys',[]) if r in routes),None)
 if not name:continue
 for step in entry['content']['steps']:
  if not step['image']:step.update(image=dict(kind='asset',name=name),caption='صورة فعلية حالية لنفس شاشة التعريف؛ توضح الحقول فقط، ولا تثبت حفظًا أو أثرًا ماليًا.',focus=None)
(root/'lib/faq-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf8')
print('Reviewed definition image references reconciled; no ERP connection or publication.')
