DROP VIEW IF EXISTS v_results_full;

CREATE VIEW v_results_full AS
SELECT
    r.id,
    a.name,
    a.sex,
    a.height        AS height_cm,
    a.weight        AS weight_kg,
    nr.noc,
    nr.region       AS team_name,
    g.year,
    g.season,
    g.city,
    s.name          AS sport,
    e.name          AS event,
    r.age,
    r.medal
FROM results r
JOIN athletes   a  ON a.id      = r.athlete_id
JOIN noc_regions nr ON nr.noc   = r.noc_noc
JOIN games      g  ON g.id      = r.games_id
JOIN events     e  ON e.id      = r.event_id
JOIN sports     s  ON s.id      = e.sport_id;
