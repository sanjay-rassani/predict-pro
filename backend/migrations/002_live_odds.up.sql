-- Section 2: live odds + odds snapshot on publish

ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS odds_snapshot NUMERIC(10, 2);

UPDATE predictions
SET odds_snapshot = odds
WHERE odds_snapshot IS NULL AND odds IS NOT NULL;

ALTER TABLE live_scores
  ADD COLUMN IF NOT EXISTS live_odds JSONB;
