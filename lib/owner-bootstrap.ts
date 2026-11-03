import { env } from 'cloudflare:workers';
import { database, now } from './guide-server';

// Operator-configured first enrollment only. No identity or token comes from a visitor.
export async function provisionConfiguredOwner() {
  const email = env.GUIDE_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const hash = env.GUIDE_BOOTSTRAP_TOKEN_HASH;
  const expires = Number(env.GUIDE_BOOTSTRAP_EXPIRES);
  if (
    !email ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    !hash ||
    !/^[a-f0-9]{64}$/.test(hash) ||
    !Number.isSafeInteger(expires) ||
    expires <= Math.floor(Date.now() / 1000)
  )
    return;
  const db = database(),
    stamp = now(),
    id = 'configured-initial-owner';
  await db.batch([
    db
      .prepare(
        `INSERT OR IGNORE INTO guide_staff (user_id,email,display_name,role,active,created_at,updated_at)
      SELECT ?,?,'مسؤول الفريق','owner',1,?,? WHERE NOT EXISTS(SELECT 1 FROM guide_staff WHERE role='owner')`,
      )
      .bind(id, email, stamp, stamp),
    db
      .prepare(
        `INSERT OR IGNORE INTO guide_activation_tokens (token_hash,user_id,created_by,expires_at)
      SELECT ?,user_id,'trusted-host-configuration',? FROM guide_staff
      WHERE user_id=? AND lower(email)=? AND NOT EXISTS(SELECT 1 FROM guide_credentials WHERE user_id=?)
      AND NOT EXISTS(SELECT 1 FROM guide_activation_tokens WHERE user_id=?)`,
      )
      .bind(hash, expires, id, email, id, id),
  ]);
}
