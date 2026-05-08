"""
public_api.py — Public Olympic Data API (Aggregate Only)

All endpoints return ONLY aggregate, anonymized statistics.
No individual athlete names, IDs, or personal biometrics are exposed.
This is intentional: the app's Responsible AI policy prohibits individual profiling.
"""
from fastapi import APIRouter, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from db.queries import get_db_connection

router = APIRouter(prefix="/api/v1/public", tags=["Public Olympic Data — Aggregate Only"])


class PaginationMeta(BaseModel):
    total_count: int
    page: int
    limit: int
    has_more: bool


class PaginatedResponse(BaseModel):
    data: List[Dict[str, Any]]
    meta: PaginationMeta


def _paginate(query: str, count_query: str, params: list, page: int, limit: int) -> dict:
    offset = (page - 1) * limit
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(count_query, params)
            total = cur.fetchone()["count"]
            cur.execute(f"{query} LIMIT %s OFFSET %s", params + [limit, offset])
            data = [dict(r) for r in cur.fetchall()]
    return {
        "data": data,
        "meta": {"total_count": total, "page": page, "limit": limit, "has_more": offset + limit < total},
    }


# ── Aggregate-only endpoints ─────────────────────────────────────────────────

@router.get(
    "/athletes",
    response_model=PaginatedResponse,
    description=(
        "Aggregate biometric statistics grouped by sport and sex for Team USA. "
        "Returns avg height, avg weight, and athlete count. "
        "No individual athlete names or IDs are returned. Strictly US-scoped."
    ),
)
def get_public_athletes(
    noc: Optional[str] = Query(None, description="3-letter NOC code (e.g., USA)"),
    sport: Optional[str] = Query(None, description="Filter by sport name"),
    sex: Optional[str] = Query(None, description="Filter by sex (M or F)"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
):
    """Returns aggregate biometric stats — NO individual names or IDs."""
    where = "WHERE height_cm IS NOT NULL AND weight_kg IS NOT NULL AND noc = 'USA'"
    params: list = []

    if noc:
        where += " AND noc = %s"
        params.append(noc.upper())
    if sport:
        where += " AND sport ILIKE %s"
        params.append(f"%{sport}%")
    if sex:
        where += " AND sex = %s"
        params.append(sex.upper())

    data_sql = f"""
        SELECT sport, noc, sex,
               ROUND(AVG(height_cm)::numeric, 1) AS avg_height_cm,
               ROUND(AVG(weight_kg)::numeric, 1) AS avg_weight_kg,
               COUNT(DISTINCT id)               AS athlete_count
        FROM v_results_full
        {where}
        GROUP BY sport, noc, sex
        ORDER BY sport ASC, noc ASC
        LIMIT %s OFFSET %s
    """
    count_sql = f"""
        SELECT COUNT(*) AS count FROM (
            SELECT sport, noc, sex
            FROM v_results_full
            {where}
            GROUP BY sport, noc, sex
        ) sub
    """
    offset = (page - 1) * limit

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(count_sql, params)
            total = cur.fetchone()["count"]
            cur.execute(data_sql, params + [limit, offset])
            data = [dict(r) for r in cur.fetchall()]

    return {
        "data": data,
        "meta": {"total_count": total, "page": page, "limit": limit, "has_more": offset + limit < total},
    }


@router.get(
    "/results",
    response_model=PaginatedResponse,
    description=(
        "Aggregate medal summaries grouped by sport, year, and event for Team USA. "
        "Returns medal counts only — no individual athlete names or biometrics. Strictly US-scoped."
    ),
)
def get_public_results(
    noc: Optional[str] = Query(None, description="3-letter NOC code (e.g., USA)"),
    year: Optional[int] = Query(None, description="Specific Olympic year"),
    medal: Optional[str] = Query(None, description="Gold, Silver, or Bronze"),
    sport: Optional[str] = Query(None, description="Filter by sport name"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
):
    """Returns aggregate medal counts for Team USA — NO individual athlete rows."""
    where = "WHERE noc = 'USA'"
    params: list = []

    if noc:
        where += " AND noc = %s"
        params.append(noc.upper())
    if year:
        where += " AND year = %s"
        params.append(year)
    if medal:
        where += " AND medal = %s"
        params.append(medal.capitalize())
    if sport:
        where += " AND sport ILIKE %s"
        params.append(f"%{sport}%")

    data_sql = f"""
        SELECT sport, event, noc, year, season, city,
               SUM(CASE WHEN medal = 'Gold'   THEN 1 ELSE 0 END) AS gold,
               SUM(CASE WHEN medal = 'Silver' THEN 1 ELSE 0 END) AS silver,
               SUM(CASE WHEN medal = 'Bronze' THEN 1 ELSE 0 END) AS bronze,
               COUNT(CASE WHEN medal IS NOT NULL THEN 1 END)      AS total_medals
        FROM v_results_full
        {where}
        GROUP BY sport, event, noc, year, season, city
        ORDER BY year DESC, sport ASC
        LIMIT %s OFFSET %s
    """
    count_sql = f"""
        SELECT COUNT(*) AS count FROM (
            SELECT sport, event, noc, year, season, city
            FROM v_results_full
            {where}
            GROUP BY sport, event, noc, year, season, city
        ) sub
    """
    offset = (page - 1) * limit

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(count_sql, params)
            total = cur.fetchone()["count"]
            cur.execute(data_sql, params + [limit, offset])
            data = [dict(r) for r in cur.fetchall()]

    return {
        "data": data,
        "meta": {"total_count": total, "page": page, "limit": limit, "has_more": offset + limit < total},
    }


@router.get("/games", description="Team USA participation history with aggregate athlete counts. No individual data.")
def get_public_games():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT year, season, city,
                       COUNT(DISTINCT id)  AS total_athletes,
                       COUNT(DISTINCT noc) AS total_nations,
                       COUNT(CASE WHEN medal IS NOT NULL THEN 1 END) AS total_medals
                FROM v_results_full
                WHERE noc = 'USA'
                GROUP BY year, season, city
                ORDER BY year DESC
            """)
            return {"data": [dict(r) for r in cur.fetchall()]}


@router.get("/team-usa", description="Team USA aggregate medal totals. No individual data.")
def get_public_nations():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT noc, team_name,
                       COUNT(DISTINCT id) AS total_athletes,
                       SUM(CASE WHEN medal = 'Gold'   THEN 1 ELSE 0 END) AS gold_medals,
                       SUM(CASE WHEN medal = 'Silver' THEN 1 ELSE 0 END) AS silver_medals,
                       SUM(CASE WHEN medal = 'Bronze' THEN 1 ELSE 0 END) AS bronze_medals,
                       COUNT(CASE WHEN medal IS NOT NULL THEN 1 END)      AS total_medals
                FROM v_results_full
                WHERE noc = 'USA'
                GROUP BY noc, team_name
            """)
            return {"data": [dict(r) for r in cur.fetchall()]}


@router.get("/sports", description="Team USA sports history with first/last appearance and event counts. No individual data.")
def get_public_sports():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT sport,
                       MIN(year)          AS first_appearance,
                       MAX(year)          AS latest_appearance,
                       COUNT(DISTINCT event) AS total_events,
                       COUNT(DISTINCT noc)   AS total_nations
                FROM v_results_full
                WHERE noc = 'USA'
                GROUP BY sport
                ORDER BY sport ASC
            """)
            return {"data": [dict(r) for r in cur.fetchall()]}
