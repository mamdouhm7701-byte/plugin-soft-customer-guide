import test from 'node:test';
import assert from 'node:assert/strict';
import { api, ClientError } from '../components/admin/api.ts';

test('admin API preserves Headers inputs and disables stale response caching', async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  globalThis.fetch = async (_url, options) => {
    const headers = new Headers(options?.headers);
    assert.equal(headers.get('X-Request-Id'), 'local-check');
    assert.equal(headers.get('Content-Type'), 'application/json');
    assert.equal(options?.cache, 'no-store');
    return Response.json({ ok: true });
  };
  assert.deepEqual(
    await api('articles', {
      method: 'POST',
      headers: new Headers({ 'X-Request-Id': 'local-check' }),
      body: '{}',
    }),
    { ok: true },
  );
});
test('non-JSON upstream failures produce a useful error instead of a JSON syntax exception', async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  globalThis.fetch = async () => new Response('<html>Unavailable</html>', { status: 502 });
  await assert.rejects(
    api('articles'),
    (e) => e instanceof ClientError && e.status === 502 && e.message.includes('الاتصال'),
  );
});
test('validation details and request cancellation remain available to callers', async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  globalThis.fetch = async () =>
    Response.json({ error: 'راجع البيانات', details: ['missing image'] }, { status: 400 });
  await assert.rejects(
    api('articles'),
    (e) => e instanceof ClientError && e.status === 400 && Array.isArray(e.details),
  );
  const controller = new AbortController();
  controller.abort();
  globalThis.fetch = async (_url, options) => {
    assert.equal(options?.signal, controller.signal);
    throw new DOMException('Aborted', 'AbortError');
  };
  await assert.rejects(api('articles', { signal: controller.signal }), { name: 'AbortError' });
});
