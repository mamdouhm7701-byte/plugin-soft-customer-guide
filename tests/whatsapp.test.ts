import test from 'node:test';
import assert from 'node:assert/strict';
import { whatsappLink } from '../lib/whatsapp.ts';
test('WhatsApp shares exact Arabic text and scoped URL without query injection', () => {
  const message = 'إجابة سؤالك\nhttps://guide.example/help/a?reply=abc&value=1 #شرح';
  const desktop = new URL(whatsappLink(message));
  assert.equal(desktop.origin, 'https://web.whatsapp.com');
  assert.equal(desktop.pathname, '/send');
  assert.deepEqual([...desktop.searchParams.keys()], ['text']);
  assert.equal(desktop.searchParams.get('text'), message);
  assert.equal(new URL(whatsappLink(message, true)).origin, 'https://wa.me');
});
