"""Replay hash-pinned, visually reviewed blank forms. No ERP connection or publication."""
import argparse
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--captures', type=Path, required=True)
captures = parser.parse_args().captures
read = lambda p: json.loads(p.read_text(encoding='utf8'))
catalog = read(root / 'lib/faq-catalog.json')
assets = read(root / 'lib/screenshot-assets.json')
manifest = read(root / 'docs/evidence/reviewed-forms.json')
for form in manifest['forms']:
    name = form['name']
    data = (captures / name).read_bytes()
    assert hashlib.sha256(data).hexdigest() == form['sha256'], 'Capture changed since review'
    proof = read(root / form['source'])
    assert proof['sha256'] == form['sha256']
    assert proof['route'] == form['captureRoute']
    old = next((a for a in assets if a['name'] == name), None)
    if old:
        assert old['sha256'] == form['sha256'], 'Released asset changed'
    else:
        assets.append(dict(name=name, source=form['source'], sha256=form['sha256'],
            capturedAt=proof['capturedAt'], scope='LIVE_EMPTY_DOCUMENT_UI' if proof['mode']=='native-viewport-screenshot' else 'LIVE_UI_CAPTURE_READ_ONLY',
            caption='صورة فعلية حالية لنموذج '+form['label']+'؛ نموذج فارغ غير محفوظ.'))
    (root / 'public/assets' / name).write_bytes(data)
    for entry in catalog:
        if not entry['key'].startswith('expanded-screen-') or form['screenRoute'] not in entry.get('screenKeys', []):
            continue
        for step in entry['content']['steps']:
            if step['image'] is None:
                step.update(image=dict(kind='asset',name=name), focus=None,
                    caption='صورة فعلية لنموذج '+form['label']+' الفارغ؛ مرجع للحقول الظاهرة فقط، ولا تثبت تنفيذ الخطوة أو أثر الحفظ.')
        marker = '\nالحقول المرصودة في النموذج الحالي:'
        step = entry['content']['steps'][0]
        step['text'] = step['text'].split(marker)[0]+marker+' '+ '، '.join(form['fields'])+'. القيم الظاهرة افتراضية؛ لا تنسخها لحركة العميل.'
        marker = ' Current reviewed empty form '
        entry['content']['verificationNote'] = entry['content']['verificationNote'].split(marker)[0]+marker+proof['capturedAt']+'; UI only, no transaction execution; '+form['source']
for path, value in [('lib/faq-catalog.json', catalog), ('lib/screenshot-assets.json', assets)]:
    (root / path).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
print(json.dumps(dict(reviewedForms=len(manifest['forms']), assets=len(assets), publication=0)))
