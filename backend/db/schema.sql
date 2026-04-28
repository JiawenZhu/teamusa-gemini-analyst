-- ── nations ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nations (
    noc      CHAR(3)  PRIMARY KEY,
    team_name TEXT    NOT NULL
);

-- ── athletes ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS athletes (
    id        INTEGER PRIMARY KEY,
    name      TEXT    NOT NULL,
    sex       CHAR(1),
    height_cm NUMERIC(5,1),
    weight_kg NUMERIC(5,1)
);

-- ── games ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS games (
    id      SERIAL PRIMARY KEY,
    year    SMALLINT    NOT NULL,
    season  VARCHAR(10) NOT NULL,
    city    TEXT        NOT NULL,
    UNIQUE(year, season)
);

-- ── sports ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sports (
    id   SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- ── events ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
    id       SERIAL  PRIMARY KEY,
    sport_id INTEGER NOT NULL REFERENCES sports(id),
    name     TEXT    UNIQUE NOT NULL
);

-- ── results (fact table) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS results (
    id         SERIAL  PRIMARY KEY,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id),
    noc        CHAR(3) NOT NULL REFERENCES nations(noc),
    games_id   INTEGER NOT NULL REFERENCES games(id),
    event_id   INTEGER NOT NULL REFERENCES events(id),
    age        NUMERIC(4,1),
    medal      VARCHAR(10),
    UNIQUE(athlete_id, games_id, event_id)
);

-- ── indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_results_noc    ON results(noc);
CREATE INDEX IF NOT EXISTS idx_results_medal  ON results(medal) WHERE medal IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_results_games  ON results(games_id);
CREATE INDEX IF NOT EXISTS idx_results_athlete ON results(athlete_id);
CREATE INDEX IF NOT EXISTS idx_games_year     ON games(year);
CREATE INDEX IF NOT EXISTS idx_events_sport   ON events(sport_id);
CREATE INDEX IF NOT EXISTS idx_athletes_sex   ON athletes(sex);
CREATE INDEX IF NOT EXISTS idx_results_age    ON results(age) WHERE age IS NOT NULL;

-- ── convenience view ──────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_results_full AS
SELECT
    r.id,
    a.name, a.sex, a.height_cm, a.weight_kg,
    n.noc, n.team_name,
    g.year, g.season, g.city,
    s.name  AS sport,
    e.name  AS event,
    r.age,
    r.medal
FROM results r
JOIN athletes a ON a.id = r.athlete_id
JOIN nations  n ON n.noc = r.noc
JOIN games    g ON g.id  = r.games_id
JOIN events   e ON e.id  = r.event_id
JOIN sports   s ON s.id  = e.sport_id;
