import { cookies } from 'next/headers';
import { database, GuideError, now, auditStatement, hashValue } from './guide-server';
import {
  randomToken,
  tokenHash,
  passwordHash,
  constantEqual,
  validPassword,
  PASSWORD_ITERATIONS,
} from './passwords';
import type { StaffUser } from './guide-model';

export const SESSION_COOKIE = 'guide_team_session';
const SESSION_SECONDS = 8 * 60 * 60;
export async function changeOwnPassword(
  request: Request,
  currentPassword: string,
  newPassword: string,
) {
  const user = await teamSession();
  if (!user) throw new GuideError(401, 'سجّل الدخول أولًا.');
  await throttle(request, user.email);
  if (!validPassword(newPassword)) throw new GuideError(400, 'كلمة السر من ١٢ إلى ١٢٨ حرفًا.');
  const row = await database()
    .prepare('SELECT * FROM guide_credentials WHERE user_id=?')
    .bind(user.userId)
    .first<Credential>();
  if (
    !row ||
    !constantEqual(await passwordHash(currentPassword, row.salt, row.iterations), row.password_hash)
  )
    throw new GuideError(400, 'كلمة السر الحالية غير صحيحة.');
  const salt = randomToken(),
    hash = await passwordHash(newPassword, salt);
  const results = await database().batch([
    database()
      .prepare(
        'UPDATE guide_credentials SET password_hash=?,salt=?,iterations=?,version=?,updated_at=? WHERE user_id=? AND version=?',
      )
      .bind(hash, salt, PASSWORD_ITERATIONS, randomToken(), now(), user.userId, row.version),
    database().prepare('DELETE FROM guide_sessions WHERE user_id=?').bind(user.userId),
    database().prepare('DELETE FROM guide_activation_tokens WHERE user_id=?').bind(user.userId),
    auditStatement(user.userId, 'auth.password-set', user.userId),
  ]);
  if (!results[0].meta.changes)
    throw new GuideError(409, 'الحساب اتغير أثناء التنفيذ. سجّل الدخول من جديد.');
}
type Credential = {
  password_hash: string;
  salt: string;
  iterations: number;
  version: string;
  user_id: string;
};
export async function teamSession(): Promise<StaffUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const row = await database()
    .prepare(
      `SELECT s.user_id,s.email,s.display_name,s.role,s.active FROM guide_sessions x JOIN guide_staff s ON s.user_id=x.user_id JOIN guide_credentials c ON c.user_id=s.user_id AND c.version=x.credential_version WHERE x.token_hash=? AND x.expires_at>? AND s.active=1`,
    )
    .bind(await tokenHash(token), Math.floor(Date.now() / 1000))
    .first<Record<string, unknown>>();
  return row
    ? {
        userId: String(row.user_id),
        email: String(row.email),
        displayName: String(row.display_name),
        role: row.role as StaffUser['role'],
        active: 1,
      }
    : null;
}
export function sessionCookie(request: Request, token: string, clear = false) {
  const secure = new URL(request.url).protocol === 'https:';
  return `${SESSION_COOKIE}=${clear ? '' : token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : SESSION_SECONDS}${secure ? '; Secure' : ''}`;
}
async function throttle(request: Request, email: string) {
  const db = database(),
    seconds = Math.floor(Date.now() / 1000),
    window = Math.floor(seconds / 900);
  const keys = [
    ['ip', request.headers.get('CF-Connecting-IP') || 'local', 60],
    ['email', email, 12],
  ] as const;
  for (const [kind, value, limit] of keys) {
    const key = 'login:' + kind + ':' + window + ':' + (await hashValue(value));
    const row = await db
      .prepare(
        'INSERT INTO guide_rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count',
      )
      .bind(key, (window + 1) * 900)
      .first<{ count: number }>();
    if (!row || row.count > limit) throw new GuideError(429, 'محاولات كتير. جرّب بعد ربع ساعة.');
  }
}
export async function signIn(request: Request, email: string, password: string) {
  await throttle(request, email);
  const row = await database()
    .prepare(
      'SELECT c.* FROM guide_credentials c JOIN guide_staff s ON s.user_id=c.user_id WHERE lower(s.email)=? AND s.active=1',
    )
    .bind(email)
    .first<Credential>();
  const calculated = await passwordHash(
    password,
    row?.salt ?? 'missing-account-constant-salt',
    row?.iterations ?? PASSWORD_ITERATIONS,
  );
  if (!row || !constantEqual(calculated, row.password_hash))
    throw new GuideError(401, 'البريد أو كلمة السر غير صحيحين، أو الحساب غير متاح.');
  const token = randomToken(),
    seconds = Math.floor(Date.now() / 1000);
  await database().batch([
    database()
      .prepare(
        'INSERT INTO guide_sessions (token_hash,user_id,credential_version,created_at,expires_at) VALUES (?,?,?,?,?)',
      )
      .bind(await tokenHash(token), row.user_id, row.version, seconds, seconds + SESSION_SECONDS),
    database().prepare('DELETE FROM guide_sessions WHERE expires_at<?').bind(seconds),
    auditStatement(row.user_id, 'auth.login', row.user_id),
  ]);
  return token;
}
export async function issueActivation(userId: string, actor: string) {
  const token = randomToken(),
    seconds = Math.floor(Date.now() / 1000);
  await database().batch([
    database().prepare('DELETE FROM guide_activation_tokens WHERE user_id=?').bind(userId),
    database()
      .prepare(
        'INSERT INTO guide_activation_tokens (token_hash,user_id,created_by,expires_at) VALUES (?,?,?,?)',
      )
      .bind(await tokenHash(token), userId, actor, seconds + 86400),
    auditStatement(actor, 'auth.activation', userId),
  ]);
  return '/team/activate#token=' + token;
}
export async function activatePassword(request: Request, token: string, password: string) {
  if (!validPassword(password)) throw new GuideError(400, 'كلمة السر من ١٢ إلى ١٢٨ حرفًا.');
  await throttle(request, 'activation');
  const seconds = Math.floor(Date.now() / 1000),
    hash = await tokenHash(token),
    row = await database()
      .prepare(
        'SELECT t.user_id FROM guide_activation_tokens t JOIN guide_staff s ON s.user_id=t.user_id WHERE t.token_hash=? AND t.consumed_at IS NULL AND t.expires_at>? AND s.active=1',
      )
      .bind(hash, seconds)
      .first<{ user_id: string }>();
  if (!row)
    throw new GuideError(
      400,
      'رابط التفعيل غير صالح أو انتهت مدته. اطلب رابطًا جديدًا من المسؤول.',
    );
  const salt = randomToken(),
    encoded = await passwordHash(password, salt),
    version = randomToken();
  const results = await database().batch([
    database()
      .prepare(
        `INSERT INTO guide_credentials (user_id,password_hash,salt,iterations,version,updated_at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM guide_activation_tokens WHERE token_hash=? AND consumed_at IS NULL AND expires_at>?) ON CONFLICT(user_id) DO UPDATE SET password_hash=excluded.password_hash,salt=excluded.salt,iterations=excluded.iterations,version=excluded.version,updated_at=excluded.updated_at`,
      )
      .bind(row.user_id, encoded, salt, PASSWORD_ITERATIONS, version, now(), hash, seconds),
    database()
      .prepare(
        'UPDATE guide_activation_tokens SET consumed_at=? WHERE token_hash=? AND consumed_at IS NULL AND expires_at>?',
      )
      .bind(seconds, hash, seconds),
    database().prepare('DELETE FROM guide_sessions WHERE user_id=?').bind(row.user_id),
    auditStatement(row.user_id, 'auth.password-set', row.user_id),
  ]);
  if (!results[0].meta.changes)
    throw new GuideError(409, 'الرابط مستخدم بالفعل. اطلب رابطًا جديدًا.');
}
