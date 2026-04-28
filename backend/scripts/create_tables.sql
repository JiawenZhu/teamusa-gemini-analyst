-- Drop and recreate all tables with UUID primary keys to match Firebase SQL Connect schema
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS sports CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS athletes CASCADE;
DROP TABLE IF EXISTS nations CASCADE;
DROP TABLE IF EXISTS noc_regions CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE noc_regions (
    noc    TEXT PRIMARY KEY,
    region TEXT,
    notes  TEXT
);

CREATE TABLE athletes (
    id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id INTEGER UNIQUE,   -- original CSV integer ID for seeding lookup
    name      TEXT NOT NULL,
    sex       TEXT,
    height    DOUBLE PRECISION,
    weight    DOUBLE PRECISION
);

CREATE TABLE games (
    id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year   INTEGER NOT NULL,
    season TEXT NOT NULL,
    city   TEXT NOT NULL,
    UNIQUE (year, season)
);

CREATE TABLE sports (
    id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE events (
    id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
    name     TEXT NOT NULL UNIQUE
);
CREATE INDEX events_sportId_idx ON events(sport_id);

CREATE TABLE results (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    noc_noc    TEXT REFERENCES noc_regions(noc) ON DELETE CASCADE,
    games_id   UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    age        INTEGER,
    medal      TEXT,
    UNIQUE (athlete_id, games_id, event_id)
);
CREATE INDEX results_athleteId_idx ON results(athlete_id);
CREATE INDEX results_eventId_idx   ON results(event_id);
CREATE INDEX results_gamesId_idx   ON results(games_id);
CREATE INDEX results_nocNoc_idx    ON results(noc_noc);
