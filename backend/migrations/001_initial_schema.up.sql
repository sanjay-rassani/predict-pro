-- Initial schema for Predict Pro (Section 1)

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (role IN ('free', 'premium')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  external_api_id INTEGER NOT NULL UNIQUE,
  home_team VARCHAR(255) NOT NULL,
  away_team VARCHAR(255) NOT NULL,
  league VARCHAR(255) NOT NULL,
  league_id INTEGER,
  market VARCHAR(100),
  match_datetime TIMESTAMPTZ NOT NULL,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  home_position INTEGER,
  away_position INTEGER,
  standings_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matches_datetime ON matches (match_datetime);
CREATE INDEX idx_matches_league ON matches (league);
CREATE INDEX idx_matches_published ON matches (published);

CREATE TABLE predictions (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (
    type IN ('1X2', 'DoubleChance', 'UnderOver', 'Surprise', 'Comeback')
  ),
  predicted_value VARCHAR(100) NOT NULL,
  odds NUMERIC(10, 2),
  confidence_score NUMERIC(5, 2),
  notes TEXT,
  is_automated_signal BOOLEAN NOT NULL DEFAULT FALSE,
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
    approval_status IN ('pending', 'approved', 'rejected')
  ),
  result_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
    result_status IN ('pending', 'win', 'loss')
  ),
  publish_status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (
    publish_status IN ('draft', 'published', 'archived')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_predictions_match_id ON predictions (match_id);
CREATE INDEX idx_predictions_type ON predictions (type);
CREATE INDEX idx_predictions_publish_status ON predictions (publish_status);
CREATE INDEX idx_predictions_approval_status ON predictions (approval_status);

CREATE TABLE live_scores (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL UNIQUE REFERENCES matches (id) ON DELETE CASCADE,
  home_score INTEGER NOT NULL DEFAULT 0,
  away_score INTEGER NOT NULL DEFAULT 0,
  current_minute INTEGER,
  halftime_home_score INTEGER,
  halftime_away_score INTEGER,
  match_status VARCHAR(50),
  home_team_logo_url TEXT,
  away_team_logo_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE news_articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  category VARCHAR(20) NOT NULL DEFAULT 'general' CHECK (
    category IN ('injury', 'transfer', 'lineup', 'general')
  ),
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_news_published ON news_articles (published);
CREATE INDEX idx_news_category ON news_articles (category);
