from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

root=Path(__file__).resolve().parents[1]
out=root.parent/'PluginSoft_Customer_Guide_Project.zip'
root_files={'.gitattributes','.editorconfig','.prettierrc.json','.prettierignore','.gitignore','.npmrc','.env.example','README.md','STATUS.json','CHANGELOG.md','package.json','package-lock.json','tsconfig.json','vite.config.ts','next.config.ts','drizzle.config.ts','cloudflare-env.d.ts','postcss.config.mjs','eslint.config.mjs','components.json','START_GUIDE.cmd','STOP_GUIDE.ps1'}
directories={'app','components','db','drizzle','docs','hooks','lib','public','scripts','tests','vendor','worker'}
paths=[root/name for name in root_files if (root/name).is_file()]
paths.append(root/'.openai/hosting.json')
for folder in directories:
    paths.extend(p for p in (root/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
with ZipFile(out,'w',ZIP_DEFLATED,strict_timestamps=False) as z:
    for p in sorted(paths):z.write(p,'PluginSoft_Customer_Guide/'+p.relative_to(root).as_posix())
with ZipFile(out) as z:
    assert z.testzip() is None
    names=z.namelist()
    for name in names:
        assert all(part not in name.split('/') for part in ['node_modules','.git','.sites-runtime','.wrangler','qa','work'])
        assert '/.dev.vars' not in name and '/.env.local' not in name
    assert 'PluginSoft_Customer_Guide/app/admin/page.tsx' in names
    assert 'PluginSoft_Customer_Guide/drizzle/0000_living_azazel.sql' in names
print(json.dumps({'archive':str(out),'files':len(paths),'bytes':out.stat().st_size,'excludes_credentials_runtime_and_test_data':True}))
