import { spawnSync } from 'node:child_process';
import { randomToken, tokenHash, passwordHash, PASSWORD_ITERATIONS } from '../lib/passwords.ts';
export function localSQL(sql) {
  const args = [
    '--import',
    './scripts/sites-env.mjs',
    './node_modules/wrangler/bin/wrangler.js',
    'd1',
    'execute',
    'DB',
    '--local',
    '--config',
    'dist/server/wrangler.json',
    '--persist-to',
    '.wrangler/state',
    '--command',
    sql,
    '--json',
  ];
  const r = spawnSync(process.execPath, args, { encoding: 'utf8' });
  if (r.status !== 0) throw Error('Local fixture SQL failed');
  return JSON.parse(r.stdout)[0].results;
}
export async function localOwnerLogin(base) {
  if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname))
    throw Error('Fixture is loopback-only');
  const userId = crypto.randomUUID(),
    email = `fixture-${userId}@example.test`,
    password = randomToken(),
    salt = randomToken(),
    hash = await passwordHash(password, salt),
    version = randomToken(),
    stamp = new Date().toISOString();
  const cleanup = () => {
    localSQL(`DELETE FROM guide_sessions WHERE user_id='${userId}';
      DELETE FROM guide_activation_tokens WHERE user_id='${userId}';
      DELETE FROM guide_credentials WHERE user_id='${userId}';
      DELETE FROM guide_audit WHERE actor_id='${userId}' OR entity_id='${userId}';
      DELETE FROM guide_staff WHERE user_id='${userId}' AND email='${email}';`);
  };
  localSQL(`INSERT INTO guide_staff (user_id,email,display_name,role,active,created_at,updated_at)
    VALUES ('${userId}','${email}','Local temporary test owner','owner',1,'${stamp}','${stamp}');
    INSERT INTO guide_credentials (user_id,password_hash,salt,iterations,version,updated_at)
    VALUES ('${userId}','${hash}','${salt}',${PASSWORD_ITERATIONS},'${version}','${stamp}');`);
  try {
    const login = await fetch(base + '/api/team/login', {
      method: 'POST',
      headers: { Origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (login.status !== 200) throw Error('Local fixture password sign-in failed: ' + login.status);
    return {
      cookie: login.headers.get('set-cookie').split(';')[0],
      password,
      userId,
      email,
      cleanup,
    };
  } catch (error) {
    cleanup();
    throw error;
  }
}
export async function localActivation(userId) {
  const token = randomToken(),
    hash = await tokenHash(token);
  localSQL(
    `INSERT INTO guide_activation_tokens (token_hash,user_id,created_by,expires_at) VALUES ('${hash}','${userId}','local-auth-check',${Math.floor(Date.now() / 1000) + 86400})`,
  );
  return token;
}
