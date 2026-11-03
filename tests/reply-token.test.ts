import test from 'node:test';
import assert from 'node:assert/strict';
import { createReplyToken, readReplyToken } from '../lib/reply-token.ts';
import { beforeStartMode } from '../lib/before-start.ts';
test('reply grants are opaque and reject changed payloads and wrong keys', async () => {
  const secret = 'local-test-only-key',
    pack = crypto.randomUUID();
  const token = await createReplyToken(secret, 'open-sales-order');
  assert.deepEqual(await readReplyToken(secret, token), {
    packId: null,
    articleId: 'open-sales-order',
  });
  assert(!atob(token.replace(/-/g, '+').replace(/_/g, '/')).includes(pack));
  assert.equal(await readReplyToken('another-secret', token), null);
  assert.equal(await readReplyToken(secret, (token[0] === 'A' ? 'B' : 'A') + token.slice(1)), null);
  assert.equal(await readReplyToken(secret, 'invalid'), null);
  assert.notEqual(token, await createReplyToken(secret, 'open-sales-order'));
});
test('before-start only occupies a section when marked important', () => {
  assert.equal(beforeStartMode({ prerequisites: [], prerequisitesMode: 'important' }), 'hidden');
  assert.equal(beforeStartMode({ prerequisites: ['   '] }), 'hidden');
  assert.equal(beforeStartMode({ prerequisites: ['General context'] }), 'details');
  assert.equal(
    beforeStartMode({ prerequisites: ['Required prerequisite'], prerequisitesMode: 'important' }),
    'important',
  );
  assert.equal(
    beforeStartMode({ prerequisites: ['Internal context'], prerequisitesMode: 'hidden' }),
    'hidden',
  );
});

test('previously issued guide-bound tokens keep their original scope', async () => {
  const secret = 'legacy-test-key',
    packId = crypto.randomUUID(),
    encoder = new TextEncoder(),
    iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey(
    'raw',
    await crypto.subtle.digest('SHA-256', encoder.encode('reply-encryption:' + secret)),
    'AES-GCM',
    false,
    ['encrypt'],
  );
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: encoder.encode('plugin-guide-single-answer-v1') },
      key,
      encoder.encode(JSON.stringify({ packId, articleId: 'open-sales-order' })),
    ),
  );
  const token = btoa(String.fromCharCode(...iv, ...encrypted))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  assert.deepEqual(await readReplyToken(secret, token), { packId, articleId: 'open-sales-order' });
});
