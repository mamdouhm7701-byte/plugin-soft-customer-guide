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
export async function createReplyToken(secret: string, packId: string, articleId: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: aad },
      await key(secret),
      encoder.encode(JSON.stringify({ packId, articleId })),
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
      packId?: unknown;
      articleId?: unknown;
    };
    if (
      typeof value.packId !== 'string' ||
      !/^[a-f0-9-]{36}$/i.test(value.packId) ||
      typeof value.articleId !== 'string' ||
      !/^[a-zA-Z0-9-]{1,100}$/.test(value.articleId)
    )
      return null;
    return { packId: value.packId, articleId: value.articleId };
  } catch {
    return null;
  }
}
