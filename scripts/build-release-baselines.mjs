// Hash only the pre-review shipped drafts. Never permit republishing user edits/restores.
import fs from 'node:fs';
import { articleSchema } from '../lib/guide-model.ts';
import { tokenHash } from '../lib/passwords.ts';
const path = process.argv[2];
if (!path) throw Error('Pass the pre-review catalog snapshot.');
const old = JSON.parse(fs.readFileSync(path, 'utf8'));
const release = new Set(
  JSON.parse(fs.readFileSync('lib/released-articles.json', 'utf8')).map((e) => e.id),
);
const hashes = {};
for (const entry of old)
  if (release.has(entry.id))
    hashes[entry.id] = await tokenHash(JSON.stringify(articleSchema.parse(entry.content)));
fs.writeFileSync('lib/release-baselines.json', JSON.stringify(hashes, null, 2) + '\n');
console.log('Pinned pre-review draft baselines:', Object.keys(hashes).length);
