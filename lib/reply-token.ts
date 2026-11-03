const encoder = new TextEncoder();
const aad = encoder.encode('plugin-guide-single-answer-v1');
async function key(secret: string) {
  if (!secret) throw new Error('Reply signing configuration is unavailable.');
  return crypto.subtle.importKey(
    'raw',
    await crypto.subtle.digest('SHA-256', encoder.encode('reply-encryption:' + secret)),
    'AES-GCM',
    false,
    ['encrypt', 'decrypt'],
  );
}
export async function createReplyToken(secret: string, articleId: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: aad },
      await key(secret),
      encoder.encode(JSON.stringify({ kind: 'answer', articleId })),
    ),
  );
  return btoa(String.fromCharCode(...iv, ...encrypted))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
export async function readReplyToken(secret: string, token: string) {
  try {
    if (!/^[A-Za-z0-9_-]{40,1000}$/.test(token)) return null;
    const bytes = Uint8Array.from(atob(token.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
      c.charCodeAt(0),
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: bytes.slice(0, 12), additionalData: aad },
      await key(secret),
      bytes.slice(12),
    );
    const value = JSON.parse(new TextDecoder().decode(decrypted)) as {
      kind?: unknown;
      packId?: unknown;
      articleId?: unknown;
    };
    if (typeof value.articleId !== 'string' || !/^[a-zA-Z0-9-]{1,100}$/.test(value.articleId))
      return null;
    if (value.kind === 'answer') return { articleId: value.articleId, packId: null };
    if (value.kind !== undefined) return null;
    // Previously issued pack-bound grants retain their narrower revocation contract.
    if (typeof value.packId !== 'string' || !/^[a-f0-9-]{36}$/i.test(value.packId)) return null;
    return { articleId: value.articleId, packId: value.packId };
  } catch {
    return null;
  }
}
