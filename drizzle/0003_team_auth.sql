CREATE UNIQUE INDEX guide_staff_email_unique ON guide_staff(lower(email));
CREATE TABLE guide_credentials (
 user_id TEXT PRIMARY KEY REFERENCES guide_staff(user_id),
 password_hash TEXT NOT NULL, salt TEXT NOT NULL, iterations INTEGER NOT NULL,
 version TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE guide_sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES guide_staff(user_id),
 credential_version TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE INDEX guide_sessions_user_idx ON guide_sessions(user_id);
CREATE TABLE guide_activation_tokens (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES guide_staff(user_id),
 created_by TEXT NOT NULL, expires_at INTEGER NOT NULL, consumed_at INTEGER
);
CREATE INDEX guide_activation_user_idx ON guide_activation_tokens(user_id);
