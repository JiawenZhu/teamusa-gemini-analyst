import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

CONN_STR = os.getenv("DATABASE_URL", "postgres://localhost/olympics")

def get_db_connection():
    return psycopg2.connect(CONN_STR, cursor_factory=RealDictCursor)

def clean_row(row):
    """Convert Decimals to float and handle NaN for JSON serializability."""
    if not row: return row
    from decimal import Decimal
    import math
    for k, v in row.items():
        if isinstance(v, Decimal):
            row[k] = float(v)
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            print(f"⚠️  Cleaning {k}: {v} -> None")
            row[k] = None
    return row

def get_medal_stats(noc=None, year=None, medal=None, sport=None, year_from=None, year_to=None):
    """
    Count actual medals won. Always filters medal IS NOT NULL so only Gold/Silver/Bronze rows are counted.
    Use year for a single year, or year_from + year_to for a range (e.g. year_from=2008, year_to=2012).
    """
    # Always restrict to actual medal-winning rows
    query = "SELECT COUNT(*) as medal_count FROM v_results_full WHERE medal IS NOT NULL"
    params = []
    if noc:
        query += " AND noc = %s"
        params.append(noc)
    if year:
        query += " AND year = %s"
        params.append(year)
    if year_from:
        query += " AND year >= %s"
        params.append(year_from)
    if year_to:
        query += " AND year <= %s"
        params.append(year_to)
    if medal:
        query += " AND medal = %s"
        params.append(medal)
    if sport:
        query += " AND sport = %s"
        params.append(sport)

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            return clean_row(cur.fetchone())

def get_athlete_biometrics(noc=None, sport=None, sex=None):
    """Average height/weight of athletes in a specific sport or nation."""
    query = """
        SELECT 
            AVG(height_cm) as avg_height, 
            AVG(weight_kg) as avg_weight, 
            COUNT(*) as count 
        FROM v_results_full 
        WHERE height_cm IS NOT NULL AND weight_kg IS NOT NULL
    """
    params = []
    if noc:
        query += " AND noc = %s"
        params.append(noc)
    if sport:
        query += " AND sport = %s"
        params.append(sport)
    if sex:
        query += " AND sex = %s"
        params.append(sex)
        
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            return clean_row(cur.fetchone())

def get_sport_breakdown(noc=None, year=None):
    """Which sports did a nation win the most medals in?"""
    query = """
        SELECT sport, COUNT(*) as medal_count 
        FROM v_results_full 
        WHERE medal IS NOT NULL
    """
    params = []
    if noc:
        query += " AND noc = %s"
        params.append(noc)
    if year:
        query += " AND year = %s"
        params.append(year)
    
    query += " GROUP BY sport ORDER BY medal_count DESC LIMIT 10"
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            return [clean_row(r) for r in cur.fetchall()]

def get_top_nations(medal=None, sport=None, limit=5):
    """Top nations by medal count."""
    query = "SELECT noc, team_name, COUNT(*) as medal_count FROM v_results_full WHERE medal IS NOT NULL"
    params = []
    if medal:
        query += " AND medal = %s"
        params.append(medal)
    if sport:
        query += " AND sport = %s"
        params.append(sport)
        
    query += " GROUP BY noc, team_name ORDER BY medal_count DESC LIMIT %s"
    params.append(limit)
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            return [clean_row(r) for r in cur.fetchall()]

def get_athlete_age_stats(noc=None, sport=None, year=None):
    """Min, max, and avg age of athletes."""
    query = "SELECT MIN(age) as min_age, MAX(age) as max_age, AVG(age) as avg_age, COUNT(*) as count FROM v_results_full WHERE age IS NOT NULL"
    params = []
    if noc:
        query += " AND noc = %s"
        params.append(noc)
    if sport:
        query += " AND sport = %s"
        params.append(sport)
    if year:
        query += " AND year = %s"
        params.append(year)
        
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            return clean_row(cur.fetchone())

def get_gender_breakdown(noc=None, year=None):
    """Count of Male vs Female athletes."""
    query = "SELECT sex, COUNT(*) as count FROM v_results_full WHERE 1=1"
    params = []
    if noc:
        query += " AND noc = %s"
        params.append(noc)
    if year:
        query += " AND year = %s"
        params.append(year)
        
    query += " GROUP BY sex"
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            return [clean_row(r) for r in cur.fetchall()]

def get_games_summary(year=None, season=None):
    """Summary of a specific games (total athletes, nations, events)."""
    query = """
        SELECT 
            COUNT(DISTINCT name) as total_athletes,
            COUNT(DISTINCT noc) as total_nations,
            COUNT(DISTINCT event) as total_events,
            city
        FROM v_results_full 
        WHERE year = %s
    """
    params = [year]
    if season:
        query += " AND season = %s"
        params.append(season)
    
    query += " GROUP BY city"
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            return clean_row(cur.fetchone())

def get_sport_history(sport):
    """First and last year a sport appeared, and total medals awarded."""
    query = """
        SELECT 
            MIN(year) as first_year, 
            MAX(year) as last_year, 
            COUNT(DISTINCT event) as total_events,
            COUNT(medal) as total_medals
        FROM v_results_full 
        WHERE sport = %s
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, [sport])
            return clean_row(cur.fetchone())

def get_bmi_by_sport(noc=None, year=None):
    """Average BMI (Weight / Height^2) grouped by sport."""
    query = """
        SELECT 
            sport, 
            AVG(weight_kg / ((height_cm / 100) * (height_cm / 100))) as avg_bmi,
            COUNT(*) as count
        FROM v_results_full 
        WHERE height_cm IS NOT NULL AND weight_kg IS NOT NULL
    """
    params = []
    if noc:
        query += " AND noc = %s"
        params.append(noc)
    if year:
        query += " AND year = %s"
        params.append(year)
        
    query += " GROUP BY sport ORDER BY avg_bmi DESC"
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            return [clean_row(r) for r in cur.fetchall()]

# Write/destructive SQL operations that are never permitted
_SQL_WRITE_BLOCKLIST = {
    "DROP", "DELETE", "UPDATE", "INSERT", "CREATE", "ALTER", "TRUNCATE",
    "GRANT", "REVOKE", "COPY", "VACUUM",
    "PG_SLEEP", "PG_READ_FILE", "PG_WRITE_FILE",
}

def execute_dynamic_query(sql: str, params=None):
    """
    Execute a dynamic SELECT query generated by the AI.
    Read-only protection:
      1. Must start with SELECT (no writes)
      2. Write-keyword blocklist (DROP, DELETE, UPDATE, etc.)
      3. Postgres statement_timeout = 5s (kills runaway queries)
    The agent may query any table or view in the database.
    """
    print(f"🔧 Tool Call -> execute_dynamic_query: SQL='{sql}', params={params}")
    normalized = sql.strip().upper()

    # 1. Must be a SELECT
    if not normalized.startswith("SELECT"):
        print(f"❌ Rejected: Not a SELECT query")
        return {"error": "Only SELECT queries are permitted."}

    # 2. Block any destructive/write keywords
    query_words = set(normalized.split())
    hits = query_words & _SQL_WRITE_BLOCKLIST
    if hits:
        print(f"❌ Rejected: Write keyword detected: {hits}")
        return {"error": f"Write operation not permitted: {', '.join(hits)}"}

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            try:
                # 3. Hard 5-second timeout — kills any runaway query server-side
                cur.execute("SET LOCAL statement_timeout = '5s'")
                if params:
                    cur.execute(sql, params)
                else:
                    cur.execute(sql)
                results = [clean_row(r) for r in cur.fetchall()]
                print(f"✅ Query Success: {len(results)} rows returned")
                return results
            except Exception as e:
                print(f"❌ Query Error: {str(e)}")
                return {"error": str(e)}
