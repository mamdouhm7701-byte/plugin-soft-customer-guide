import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const url = 'http://127.0.0.1:5174';
async function running() {
  try {
    const r = await fetch(url + '/api/health', { signal: AbortSignal.timeout(1500) });
    return (await r.json()).application === 'plugin-soft-customer-guide';
  } catch {
    return false;
  }
}
if (await running()) {
  console.log('Guide is already running: ' + url);
  console.log('Team: ' + url + '/admin');
  process.exit(0);
}
if (!fs.existsSync('node_modules/vinext')) {
  console.error('Install dependencies first: npm run install:ci');
  process.exit(1);
}
fs.mkdirSync('.sites-runtime', { recursive: true });
if (!fs.existsSync('.dev.vars'))
  fs.writeFileSync(
    '.dev.vars',
    'GUIDE_RATE_SECRET="' + crypto.randomBytes(32).toString('hex') + '"\n',
    { flag: 'wx' },
  );
function run(args) {
  const r = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
}
if (!fs.existsSync('dist/server/wrangler.json')) run(['scripts/run-framework.mjs', 'build']);
run(['scripts/apply-local-db.mjs']);
const stdout = fs.openSync('.sites-runtime/local-preview.log', 'a'),
  stderr = fs.openSync('.sites-runtime/local-preview-error.log', 'a');
const child = spawn(
  process.execPath,
  [
    path.join(root, 'scripts/run-framework.mjs'),
    'dev',
    '--hostname',
    '127.0.0.1',
    '--port',
    '5174',
  ],
  { cwd: root, windowsHide: true, detached: true, stdio: ['ignore', stdout, stderr] },
);
fs.closeSync(stdout);
fs.closeSync(stderr);
child.unref();
fs.writeFileSync(
  '.sites-runtime/local-preview-process.json',
  JSON.stringify({ pid: child.pid, root, startedAt: new Date().toISOString(), url }, null, 2),
);
for (let i = 0; i < 45; i++) {
  if (await running()) {
    console.log('Guide: ' + url);
    console.log('Team: ' + url + '/admin');
    console.log(
      'Team sign-in: email/password. Fresh setup: provision the owner using scripts/provision-team-owner.mjs.',
    );
    process.exit(0);
  }
  await new Promise((resolve) => setTimeout(resolve, 750));
}
console.error('Preview did not become ready. Review .sites-runtime/local-preview-error.log.');
process.exit(1);
