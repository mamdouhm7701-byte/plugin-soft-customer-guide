ALTER TABLE guide_feedback ADD COLUMN step_number INTEGER NOT NULL DEFAULT 0;
ALTER TABLE guide_feedback ADD COLUMN article_revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE guide_feedback ADD COLUMN step_title TEXT NOT NULL DEFAULT '';
DROP INDEX IF EXISTS guide_feedback_daily_unique;
CREATE UNIQUE INDEX guide_feedback_daily_unique ON guide_feedback(article_id,visitor_hash,vote_day,step_number,article_revision);
