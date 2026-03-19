CREATE TABLE IF NOT EXISTS scores (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  player_id   TEXT NOT NULL,
  nickname    TEXT NOT NULL DEFAULT '匿名',
  score       INTEGER NOT NULL,
  accuracy    INTEGER NOT NULL,
  max_combo   INTEGER NOT NULL,
  total_time  INTEGER NOT NULL,
  rank_title  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_player ON scores(player_id, created_at DESC);
