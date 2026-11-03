"""Derive editorial coverage from shipped records, never from a hand-maintained total."""
import json
from pathlib import Path
root = Path(__file__).resolve().parents[1]
read = lambda p: json.loads((root / p).read_text(encoding='utf8'))
catalog, assets, coverage = [read(p) for p in ['lib/faq-catalog.json','lib/screenshot-assets.json','lib/catalog-coverage.json']]
articles = [dict(id=e['id'],key=e['key'],title=e['content']['title'],module=e['content']['module'],routes=e.get('screenKeys',[]),
    missingImageSteps=[i+1 for i,s in enumerate(e['content']['steps']) if not s['image']],source=e['source'],
    hasVerificationDate=bool(e['content']['verifiedAt']),sourceReviewed=e['content']['verificationNote'].startswith('SOURCE_REVIEW')) for e in catalog]
any_image = sum(any(s['image'] for s in e['content']['steps']) for e in catalog)
all_images = sum(all(s['image'] for s in e['content']['steps']) for e in catalog)
for screen in coverage['screensInventory']:
    entries = [e for e in catalog if screen['route'] in e.get('screenKeys',[])]
    screen['image'] = any(s['image'] for e in entries for s in e['content']['steps'])
    names = {s['image']['name'] for e in entries for s in e['content']['steps'] if s.get('image') and s['image']['kind']=='asset'}
    screen['liveUiCaptured'] = any(a['name'] in names and a['scope'].startswith('LIVE_') for a in assets)
coverage.update(total=len(catalog), articlesWithImages=any_image, fullyIllustratedArticles=all_images,
    additionalScreenshots=len(assets), liveReadOnlyScreenshots=sum(a['scope'].startswith('LIVE_') for a in assets),
    screensWithImages=sum(s['image'] for s in coverage['screensInventory']))
audit = dict(date='2026-11-03',total=len(catalog),withAnyImages=any_image,allStepsIllustrated=all_images,articles=articles)
for path,value in [('lib/catalog-coverage.json',coverage),('docs/content-completion-audit.json',audit)]:
    (root/path).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:v for k,v in audit.items() if k!='articles'}))
