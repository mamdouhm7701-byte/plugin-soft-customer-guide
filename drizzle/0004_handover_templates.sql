CREATE TABLE IF NOT EXISTS guide_templates (
 id TEXT PRIMARY KEY NOT NULL,
 name TEXT NOT NULL,
 content_json TEXT NOT NULL,
 created_by TEXT NOT NULL,
 created_at TEXT NOT NULL
);
