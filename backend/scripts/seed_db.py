import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
import os
import requests
from dotenv import load_dotenv

load_dotenv()

CSV_URL  = "https://raw.githubusercontent.com/rgriff23/Olympic_history/master/data/athlete_events.csv"
CONN_STR = os.getenv("DATABASE_URL", "postgresql://localhost/olympics")
CACHE_DIR = os.path.join(os.path.dirname(__file__), "../data/cache")
CSV_PATH  = os.path.join(CACHE_DIR, "athlete_events.csv")

def download_csv():
    os.makedirs(CACHE_DIR, exist_ok=True)
    if not os.path.exists(CSV_PATH):
        print(f"⬇️  Downloading {CSV_URL}...")
        r = requests.get(CSV_URL, timeout=60)
        r.raise_for_status()
        with open(CSV_PATH, "w", encoding="utf-8") as f:
            f.write(r.text)
        print("✅ Downloaded.")
    return pd.read_csv(CSV_PATH)

def seed():
    df = download_csv()
    print(f"📊 Loaded {len(df):,} rows. Starting normalization...")

    with psycopg2.connect(CONN_STR) as conn:
        with conn.cursor() as cur:

            # ── 1. noc_regions ──────────────────────────────────────────────
            print("🌱 Seeding noc_regions...")
            nations_df = df[["NOC", "Team"]].drop_duplicates("NOC")
            execute_batch(
                cur,
                "INSERT INTO noc_regions (noc, region) VALUES (%s, %s) ON CONFLICT (noc) DO NOTHING",
                nations_df.values.tolist()
            )

            # ── 2. athletes (with legacy_id for lookup) ─────────────────────
            print("🌱 Seeding athletes...")
            athletes_df = df[["ID", "Name", "Sex", "Height", "Weight"]].drop_duplicates("ID").copy()

            def safe_float(v):
                """Convert pandas NaN / numpy NaN floats to None for SQL."""
                try:
                    return None if (v is None or pd.isna(v)) else float(v)
                except (TypeError, ValueError):
                    return None

            athletes_rows = [
                (
                    int(r.ID),
                    r.Name,
                    r.Sex if pd.notna(r.Sex) else None,
                    safe_float(r.Height),
                    safe_float(r.Weight),
                )
                for _, r in athletes_df.iterrows()
            ]
            execute_batch(
                cur,
                """INSERT INTO athletes (legacy_id, name, sex, height, weight)
                   VALUES (%s, %s, %s, %s, %s)
                   ON CONFLICT (legacy_id) DO NOTHING""",
                athletes_rows
            )

            # ── 3. games ────────────────────────────────────────────────────
            print("🌱 Seeding games...")
            games_df = df[["Year", "Season", "City"]].drop_duplicates(["Year", "Season"])
            execute_batch(
                cur,
                "INSERT INTO games (year, season, city) VALUES (%s, %s, %s) ON CONFLICT (year, season) DO NOTHING",
                games_df.values.tolist()
            )

            # ── 4. sports ───────────────────────────────────────────────────
            print("🌱 Seeding sports...")
            sports = [[s] for s in df["Sport"].unique()]
            execute_batch(
                cur,
                "INSERT INTO sports (name) VALUES (%s) ON CONFLICT (name) DO NOTHING",
                sports
            )

            # ── 5. events ───────────────────────────────────────────────────
            print("🌱 Seeding events...")
            cur.execute("SELECT id, name FROM sports")
            sport_map = {name: sid for sid, name in cur.fetchall()}

            events_raw = df[["Sport", "Event"]].drop_duplicates("Event")
            execute_batch(
                cur,
                "INSERT INTO events (sport_id, name) VALUES (%s, %s) ON CONFLICT (name) DO NOTHING",
                [(sport_map[row.Sport], row.Event) for _, row in events_raw.iterrows()]
            )

            # ── 6. results ──────────────────────────────────────────────────
            print("🌱 Seeding results (this might take a minute)...")
            cur.execute("SELECT id, year, season FROM games")
            games_map = {(yr, se): gid for gid, yr, se in cur.fetchall()}

            cur.execute("SELECT id, name FROM events")
            events_map = {name: eid for eid, name in cur.fetchall()}

            cur.execute("SELECT id, legacy_id FROM athletes")
            athlete_map = {legacy: aid for aid, legacy in cur.fetchall()}

            results = []
            for _, row in df.iterrows():
                a_id = athlete_map.get(int(row.ID))
                g_id = games_map.get((row.Year, row.Season))
                e_id = events_map.get(row.Event)
                if not a_id or not g_id or not e_id:
                    continue
                results.append((
                    a_id,
                    row.NOC,
                    g_id,
                    e_id,
                    None if pd.isna(row.Age) else int(row.Age),
                    None if pd.isna(row.Medal) else row.Medal,
                ))

            execute_batch(
                cur,
                """INSERT INTO results (athlete_id, noc_noc, games_id, event_id, age, medal)
                   VALUES (%s, %s, %s, %s, %s, %s)
                   ON CONFLICT (athlete_id, games_id, event_id) DO NOTHING""",
                results,
                page_size=5000
            )

        conn.commit()
    print("✅ Database seeding complete.")

if __name__ == "__main__":
    seed()
