import { localOwnerLogin } from './local-auth-fixture.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const base = process.env.GUIDE_TEST_URL || 'http://127.0.0.1:5174';
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname))
  throw Error('This mutating test is local-only.');
const origin = new URL(base).origin;
const evidence = [];
let cookie = '',
  customerCookie = '',
  ownerFixture;
async function request(
  path,
  { method = 'GET', body, authenticated = true, headers = {}, expected = 200 } = {},
) {
  const response = await fetch(base + path, {
    method,
    redirect: 'manual',
    headers: {
      ...(authenticated && cookie
        ? { Cookie: cookie }
        : customerCookie
          ? { Cookie: customerCookie }
          : {}),
      ...(body !== undefined
        ? {
            Origin: origin,
            ...(!(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
          }
        : {}),
      ...headers,
    },
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });
  const type = response.headers.get('content-type') || '';
  const data = type.includes('application/json') ? await response.json() : await response.text();
  assert.equal(
    response.status,
    expected,
    `${method} ${path}: ${JSON.stringify(data).slice(0, 350)}`,
  );
  return { response, data };
}
async function check(name, fn) {
  await fn();
  evidence.push({ name, status: 'passed' });
  console.log('PASS ' + name);
}
let article, pack, media;
const content = JSON.parse(fs.readFileSync('lib/seed-articles.json', 'utf8'))[0].content;
const stamp = crypto.randomUUID().slice(0, 8);
content.title = 'تحقق محلي - دورة النشر ' + stamp;
content.verificationNote = 'LOCAL-TEST-INTERNAL-NOTE-' + stamp;
try {
  await check('anonymous admin requests and forged identity are rejected', async () => {
    await request('/api/admin/session', { authenticated: false, expected: 401 });
    await request('/api/admin/session', {
      authenticated: false,
      headers: {
        'oai-authenticated-user-id': 'forged',
        'oai-authenticated-user-email': 'seedy@sites.test',
      },
      expected: 401,
    });
  });
  ownerFixture = await localOwnerLogin(base);
  cookie = ownerFixture.cookie;
  await check(
    'local owner is authenticated and published content contains no review notes',
    async () => {
      const session = await request('/api/admin/session');
      assert.equal(session.data.user.role, 'owner');
      await request('/api/articles/open-sales-order', { authenticated: false, expected: 404 });
      const a = await request('/api/articles/open-sales-order');
      assert.equal(a.data.content.verificationNote, '');
    },
  );
  await check('same-origin enforcement rejects cross-site writes', async () => {
    await request('/api/admin/articles', {
      method: 'POST',
      headers: { Origin: 'https://untrusted.test' },
      body: { content },
      expected: 403,
    });
    await request('/api/admin/articles', { method: 'POST', body: null, expected: 400 });
  });
  await check('new draft is private and incomplete evidence cannot be published', async () => {
    article = (
      await request('/api/admin/articles', {
        method: 'POST',
        body: { content: { ...content, verifiedAt: '' } },
        expected: 201,
      })
    ).data;
    await request('/api/articles/' + article.id, { authenticated: false, expected: 404 });
    await request('/api/admin/articles/' + article.id + '/transition', {
      method: 'POST',
      body: { revision: article.revision, action: 'publish' },
      expected: 409,
    });
    await request('/api/admin/articles/' + article.id + '/transition', {
      method: 'POST',
      body: { revision: article.revision, action: 'submit' },
      expected: 400,
    });
    article = (
      await request('/api/admin/articles/' + article.id, {
        method: 'PUT',
        body: { revision: article.revision, content },
      })
    ).data;
  });
  await check('media upload is private until used in a published article', async () => {
    const bad = new FormData();
    bad.set(
      'file',
      new Blob(['<svg xmlns="http://www.w3.org/2000/svg">not a supported image</svg>'], {
        type: 'image/svg+xml',
      }),
      'test.svg',
    );
    bad.set('alt', 'unsupported local test');
    await request('/api/admin/media', { method: 'POST', body: bad, expected: 415 });
    const form = new FormData();
    form.set(
      'file',
      new Blob([fs.readFileSync('public/assets/erp-invoice.jpg')], { type: 'image/jpeg' }),
      'local-screenshot.jpg',
    );
    form.set('alt', 'صورة فعلية لاختبار محلي بدون بيانات عملاء');
    media = (await request('/api/admin/media', { method: 'POST', body: form, expected: 201 })).data;
    await request('/api/media/' + media.id, { authenticated: false, expected: 404 });
    await request('/api/media/' + media.id);
    content.steps[0].image = { kind: 'media', id: media.id };
    article = (
      await request('/api/admin/articles/' + article.id, {
        method: 'PUT',
        body: { revision: article.revision, content },
      })
    ).data;
  });
  await check('review/publish enables article and media but redacts internal notes', async () => {
    article = (
      await request('/api/admin/articles/' + article.id + '/transition', {
        method: 'POST',
        body: { revision: article.revision, action: 'submit' },
      })
    ).data;
    article = (
      await request('/api/admin/articles/' + article.id + '/transition', {
        method: 'POST',
        body: { revision: article.revision, action: 'publish' },
      })
    ).data;
    pack = (
      await request('/api/admin/packs', {
        method: 'POST',
        body: {
          title: 'Local lifecycle customer scope ' + stamp,
          activity: 'general',
          modules: ['sales'],
          articleIds: [article.id],
          welcome: '',
        },
        expected: 201,
      })
    ).data;
    const access = await request('/api/customer/access?guide=' + pack.id, {
      authenticated: false,
      expected: 303,
    });
    customerCookie = access.response.headers.get('set-cookie').split(';')[0];
    const published = (await request('/api/articles/' + article.id, { authenticated: false })).data;
    assert.equal(published.content.title, content.title);
    assert.equal(published.content.verificationNote, '');
    await request('/api/media/' + media.id, { authenticated: false });
  });
  await check(
    'stale/concurrent edits are refused while published snapshot stays unchanged',
    async () => {
      const expected = article.revision;
      const results = await Promise.all([
        fetch(base + '/api/admin/articles/' + article.id, {
          method: 'PUT',
          headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            revision: expected,
            content: { ...content, title: 'مسودة غير منشورة ' + stamp },
          }),
        }),
        fetch(base + '/api/admin/articles/' + article.id, {
          method: 'PUT',
          headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            revision: expected,
            content: { ...content, title: 'تعديل متزامن ' + stamp },
          }),
        }),
      ]);
      assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
      article = (await request('/api/admin/articles/' + article.id)).data;
      const published = (await request('/api/articles/' + article.id, { authenticated: false }))
        .data;
      assert.equal(published.content.title, content.title);
    },
  );
  await check(
    'guide packs accept suitable published content and reject activity mismatch',
    async () => {
      await request('/api/admin/packs', {
        method: 'POST',
        body: {
          title: 'دليل محلي للمطاعم',
          activity: 'restaurant',
          modules: ['sales'],
          articleIds: [article.id],
          welcome: '',
        },
        expected: 400,
      });
      const revocablePack = (
        await request('/api/admin/packs', {
          method: 'POST',
          body: {
            title: 'دليل تسليم تحقق محلي ' + stamp,
            activity: 'general',
            modules: ['sales'],
            articleIds: [article.id],
            welcome: 'رسالة ترحيب تجريبية بدون أي بيانات عميل',
          },
          expected: 201,
        })
      ).data;
      const previousCookie = customerCookie;
      const entry = await request('/api/customer/access?guide=' + revocablePack.id, {
        authenticated: false,
        expected: 303,
      });
      customerCookie = entry.response.headers.get('set-cookie').split(';')[0];
      const page = await request('/guides/' + revocablePack.id, { authenticated: false });
      assert(page.data.includes(content.title));
      const print = await request('/guides/' + revocablePack.id + '/print', {
        authenticated: false,
      });
      assert(print.data.includes(content.title));
      await request('/api/admin/packs/' + revocablePack.id, {
        method: 'PUT',
        body: { revision: revocablePack.revision, action: 'archive' },
      });
      await request('/guides/' + revocablePack.id, { authenticated: false, expected: 404 });
      customerCookie = previousCookie;
    },
  );
  await check('customer feedback persists and duplicate daily votes are refused', async () => {
    const first = await request('/api/feedback', {
      method: 'POST',
      authenticated: false,
      body: { articleId: article.id, vote: 'no', comment: 'ملاحظة تحقق محلي ' + stamp },
    });
    const visitor = first.response.headers.get('set-cookie').split(';')[0];
    await request('/api/feedback', {
      method: 'POST',
      authenticated: false,
      headers: { Cookie: customerCookie + '; ' + visitor },
      body: { articleId: article.id, vote: 'yes' },
      expected: 409,
    });
    const f = (await request('/api/admin/feedback')).data.feedback.find(
      (v) => v.comment === 'ملاحظة تحقق محلي ' + stamp,
    );
    assert(f);
    await request('/api/admin/feedback/' + f.id, { method: 'POST', body: { resolved: true } });
  });
  await check('question queue tracks repeat frequency and validates linked activity', async () => {
    const q = (
      await request('/api/admin/questions', {
        method: 'POST',
        body: {
          question: 'سؤال تحقق محلي لتجربة التكرار ' + stamp,
          activity: 'general',
          module: 'sales',
          source: 'support',
        },
        expected: 201,
      })
    ).data;
    await request('/api/admin/questions', { method: 'PUT', body: { id: q.id, action: 'repeat' } });
    await request('/api/admin/questions', {
      method: 'PUT',
      body: { id: q.id, action: 'link', articleId: article.id },
    });
    const result = (await request('/api/admin/questions')).data.questions.find(
      (v) => v.id === q.id,
    );
    assert.equal(result.frequency, 2);
    assert.equal(result.status, 'linked');
  });
  await check(
    'archive hides article and private media; history can restore a draft only',
    async () => {
      article = (
        await request('/api/admin/articles/' + article.id + '/transition', {
          method: 'POST',
          body: { revision: article.revision, action: 'archive' },
        })
      ).data;
      await request('/api/articles/' + article.id, { authenticated: false, expected: 404 });
      await request('/api/media/' + media.id, { authenticated: false, expected: 404 });
      const history = (await request('/api/admin/articles/' + article.id + '/history')).data
        .revisions;
      const previous = history.find((r) => r.action === 'publish');
      assert(previous);
      article = (
        await request('/api/admin/articles/' + article.id + '/transition', {
          method: 'POST',
          body: { revision: article.revision, action: 'restore', historyId: previous.id },
        })
      ).data;
      assert.equal(article.status, 'draft');
      await request('/api/articles/' + article.id, { authenticated: false, expected: 404 });
    },
  );
} finally {
  if (article) {
    try {
      const current = (await request('/api/admin/articles/' + article.id)).data;
      if (!current.archived)
        await request('/api/admin/articles/' + article.id + '/transition', {
          method: 'POST',
          body: { revision: current.revision, action: 'archive' },
        });
    } catch (e) {
      console.error('Local article cleanup needs review:', e.message);
    }
  }
  if (pack) {
    try {
      const p = (await request('/api/admin/packs')).data.packs.find((p) => p.id === pack.id);
      if (p && !p.archived)
        await request('/api/admin/packs/' + p.id, {
          method: 'PUT',
          body: { revision: p.revision, action: 'archive' },
        });
    } catch (e) {
      console.error('Local pack cleanup needs review:', e.message);
    }
  }
  ownerFixture?.cleanup();
  fs.mkdirSync('qa', { recursive: true });
  fs.writeFileSync(
    'qa/local-integration-evidence.json',
    JSON.stringify(
      {
        executedAt: new Date().toISOString(),
        environment: origin,
        scope: 'Task-owned local guide app only; no ERP session or hosted data writes',
        checks: evidence,
        localTestArticle: article?.id,
        localTestMedia: media?.id,
        localTestPack: pack?.id,
      },
      null,
      2,
    ),
  );
}
console.log(JSON.stringify({ passed: evidence.length, environment: origin }));
