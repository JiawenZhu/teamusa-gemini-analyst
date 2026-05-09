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

def get_team_usa_stats(medal=None, sport=None, limit=5):
    """Team USA aggregate stats by medal and sport. Strictly US-scoped."""
    query = "SELECT noc, team_name, COUNT(*) as medal_count FROM v_results_full WHERE medal IS NOT NULL AND noc = 'USA'"
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
            'Los Angeles' as host_city
        FROM v_results_full 
        WHERE year = %s AND noc = 'USA'
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
        WHERE sport = %s AND noc = 'USA'
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

import re as _re

def _rewrite_having_aliases(sql: str) -> str:
    """
    PostgreSQL does not allow referencing SELECT-level column aliases in HAVING.
    e.g.  SELECT AVG(height_cm) AS avg_h ... HAVING avg_h IS NOT NULL  → ERROR

    Fix: when HAVING references an alias name that appears in the SELECT list,
    wrap the whole query in a subquery so the outer HAVING can see the alias.

    SELECT * FROM (<original_sql>) AS _sub
    WHERE <having_conditions using aliases>
    This is only applied when a potential alias reference is detected.
    Safe to call on any SQL — if the pattern is not matched the original is returned.
    """
    upper = sql.upper()
    # Only act when there is a HAVING clause
    having_match = _re.search(r'\bHAVING\b', upper)
    if not having_match:
        return sql

    # Extract alias names defined in the SELECT clause (AS <name>)
    alias_names = {m.group(1).lower() for m in _re.finditer(r'\bAS\s+(\w+)', sql, _re.IGNORECASE)}
    if not alias_names:
        return sql

    # Extract the actual HAVING clause (until ORDER BY, LIMIT, etc.)
    having_text = sql[having_match.start():]
    boundary_match = _re.search(r'\b(ORDER\s+BY|LIMIT)\b', having_text, _re.IGNORECASE)
    
    if boundary_match:
        actual_having = having_text[:boundary_match.start()]
        trailing_text = having_text[boundary_match.start():]
    else:
        actual_having = having_text
        trailing_text = ""
        
    # Check if the actual HAVING part references any alias
    actual_having_lower = actual_having.lower()
    uses_alias = any(_re.search(r'\b' + _re.escape(alias) + r'\b', actual_having_lower)
                     for alias in alias_names)
    
    if not uses_alias:
        return sql

    # Rewrite: wrap in subquery, convert HAVING → WHERE on outer query
    inner_sql = sql[:having_match.start()].rstrip().rstrip(',')
    outer_where = _re.sub(r'^\s*HAVING\s+', 'WHERE ', actual_having, flags=_re.IGNORECASE)
    
    rewritten = f"SELECT * FROM ({inner_sql}) AS _sub {outer_where} {trailing_text}"
    print(f"⚙️  SQL rewritten (HAVING alias fix): {rewritten[:160]}...")
    return rewritten


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

    # 3. Block non-USA NOCs and other teams (Data Sovereignty)
    # Check for NOC codes (3 letters in single quotes) that are not 'USA'
    noc_hits = _re.findall(r"NOC\s*=\s*'([^']+)'", sql, _re.IGNORECASE)
    for noc in noc_hits:
        if noc.upper() != 'USA':
            print(f"❌ Rejected: Non-USA NOC detected: {noc}")
            return {"error": f"I can only provide data for Team USA (NOC='USA'). You requested data for {noc}."}
    
    # Check for team names that aren't 'United States'
    team_hits = _re.findall(r"TEAM_NAME\s*=\s*'([^']+)'", sql, _re.IGNORECASE)
    for team in team_hits:
        if 'UNITED STATES' not in team.upper() and 'USA' not in team.upper():
            print(f"❌ Rejected: Non-USA Team detected: {team}")
            return {"error": f"I can only provide data for Team USA. You requested data for {team}."}

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            try:
                # 3. Hard 5-second timeout — kills any runaway query server-side
                cur.execute("SET LOCAL statement_timeout = '5s'")
                # 4. Rewrite HAVING alias references (PostgreSQL forbids them)
                sql = _rewrite_having_aliases(sql)
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
