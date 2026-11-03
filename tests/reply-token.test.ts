import test from 'node:test';
import assert from 'node:assert/strict';
import { createReplyToken, readReplyToken } from '../lib/reply-token.ts';
import { beforeStartMode } from '../lib/before-start.ts';
test('reply grants are opaque and reject changed payloads and wrong keys', async () => {
  const secret = 'local-test-only-key',
    pack = crypto.randomUUID();
  const token = await createReplyToken(secret, pack, 'open-sales-order');
  assert.deepEqual(await readReplyToken(secret, token), {
    packId: pack,
    articleId: 'open-sales-order',
  });
  assert(!atob(token.replace(/-/g, '+').replace(/_/g, '/')).includes(pack));
  assert.equal(await readReplyToken('another-secret', token), null);
  assert.equal(await readReplyToken(secret, (token[0] === 'A' ? 'B' : 'A') + token.slice(1)), null);
  assert.equal(await readReplyToken(secret, 'invalid'), null);
  assert.notEqual(token, await createReplyToken(secret, pack, 'open-sales-order'));
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
