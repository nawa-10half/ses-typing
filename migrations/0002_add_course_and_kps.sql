ALTER TABLE scores ADD COLUMN course_id TEXT NOT NULL DEFAULT 'beginner';
ALTER TABLE scores ADD COLUMN kps REAL NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_scores_course ON scores(course_id, score DESC);
