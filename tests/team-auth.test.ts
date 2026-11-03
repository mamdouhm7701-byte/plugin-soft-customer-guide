import test from 'node:test';
import assert from 'node:assert/strict';
import {
  randomToken,
  tokenHash,
  passwordHash,
  constantEqual,
  validPassword,
} from '../lib/passwords.ts';
test('passwords are salted, verified with fixed-length comparison, and never stored in clear', async () => {
  const salt = randomToken(),
    hash = await passwordHash('A long private password', salt);
  assert.notEqual(hash, 'A long private password');
  assert(constantEqual(hash, await passwordHash('A long private password', salt)));
  assert(!constantEqual(hash, await passwordHash('wrong', salt)));
  assert.notEqual(hash, await passwordHash('A long private password', randomToken()));
  assert(validPassword('A long private password'));
  assert(!validPassword('short'));
  assert(!validPassword(' '.repeat(12)));
});
test('session and activation identifiers have independent random values and hashed storage', async () => {
  const a = randomToken(),
    b = randomToken();
  assert.match(a, /^[a-f0-9]{64}$/);
  assert.notEqual(a, b);
  assert.notEqual(await tokenHash(a), a);
  assert(!constantEqual('abc', 'abcd'));
});
