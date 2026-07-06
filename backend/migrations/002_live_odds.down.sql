ALTER TABLE live_scores DROP COLUMN IF EXISTS live_odds;
ALTER TABLE predictions DROP COLUMN IF EXISTS odds_snapshot;
DELETE FROM schema_migrations WHERE id = '002';
