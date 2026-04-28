from fastapi import APIRouter, Query, HTTPException, Path
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from db.queries import get_db_connection

router = APIRouter(prefix="/api/v1/public", tags=["Public Olympic Data"])

# ── Models ─────────────────────────────────────────────────────────────

class PaginationMeta(BaseModel):
    total_count: int
    page: int
    limit: int
    has_more: bool

class PaginatedResponse(BaseModel):
    data: List[Dict[str, Any]]
    meta: PaginationMeta

# ── Helper for Pagination & Queries ────────────────────────────────────

def execute_paginated_query(base_query: str, count_query: str, params: list, page: int, limit: int):
    offset = (page - 1) * limit
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # 1. Get total count
            cur.execute(count_query, params)
            total_count = cur.fetchone()['count']
            
            # 2. Get data
            paginated_sql = f"{base_query} LIMIT %s OFFSET %s"
            cur.execute(paginated_sql, params + [limit, offset])
            data = [dict(r) for r in cur.fetchall()]
            
            return {
                "data": data,
                "meta": {
                    "total_count": total_count,
                    "page": page,
                    "limit": limit,
                    "has_more": offset + limit < total_count
                }
            }

# ── Endpoints ──────────────────────────────────────────────────────────

@router.get("/athletes", response_model=PaginatedResponse, description="Search and list athletes.")
def get_public_athletes(
    search: Optional[str] = Query(None, description="Search by athlete name"),
    sex: Optional[str] = Query(None, description="Filter by sex (M or F)"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    base_query = "SELECT id, name, sex, height_cm as height, weight_kg as weight FROM v_results_full WHERE 1=1"
    count_query = "SELECT COUNT(DISTINCT id) as count FROM v_results_full WHERE 1=1"
    
    params = []
    
    if search:
        search_term = f"%{search}%"
        base_query += " AND name ILIKE %s"
        count_query += " AND name ILIKE %s"
        params.append(search_term)
        
    if sex:
        base_query += " AND sex = %s"
        count_query += " AND sex = %s"
        params.append(sex)
        
    # Group by id to get unique athletes since the view contains multiple rows per athlete
    base_query += " GROUP BY id, name, sex, height_cm, weight_kg ORDER BY name ASC"
    
    return execute_paginated_query(base_query, count_query, params, page, limit)


@router.get("/athletes/{athlete_id}", description="Get a specific athlete by their UUID.")
def get_public_athlete_by_id(athlete_id: str = Path(..., description="UUID of the athlete")):
    query = """
        SELECT id, name, sex, height_cm as height, weight_kg as weight, noc, team_name
        FROM v_results_full 
        WHERE id = %s
        LIMIT 1
    """
    results_query = """
        SELECT year, season, city, sport, event, medal, age 
        FROM v_results_full 
        WHERE id = %s
        ORDER BY year ASC
    """
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, [athlete_id])
            athlete = cur.fetchone()
            
            if not athlete:
                raise HTTPException(status_code=404, detail="Athlete not found")
                
            cur.execute(results_query, [athlete_id])
            medals_and_results = [dict(r) for r in cur.fetchall()]
            
            return {
                "athlete": dict(athlete),
                "results": medals_and_results
            }


@router.get("/results", response_model=PaginatedResponse, description="Search Olympic event results.")
def get_public_results(
    noc: Optional[str] = Query(None, description="3-letter NOC code (e.g., USA)"),
    year: Optional[int] = Query(None, description="Specific Olympic year"),
    medal: Optional[str] = Query(None, description="Filter by Gold, Silver, Bronze"),
    sport: Optional[str] = Query(None, description="Filter by sport name"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    base_query = """
        SELECT a.name, a.sex, r.noc, r.team_name, r.year, r.season, r.city, r.sport, r.event, r.medal
        FROM v_results_full r
        JOIN athletes a ON a.id = r.id
        WHERE 1=1
    """
    count_query = "SELECT COUNT(*) as count FROM v_results_full WHERE 1=1"
    
    params = []
    
    if noc:
        condition = " AND noc = %s"
        base_query += condition
        count_query += condition
        params.append(noc.upper())
        
    if year:
        condition = " AND year = %s"
        base_query += condition
        count_query += condition
        params.append(year)
        
    if medal:
        condition = " AND medal = %s"
        base_query += condition
        count_query += condition
        params.append(medal.capitalize())
        
    if sport:
        condition = " AND sport ILIKE %s"
        base_query += condition
        count_query += condition
        params.append(f"%{sport}%")
        
    base_query += " ORDER BY year DESC, sport ASC, event ASC"
    
    return execute_paginated_query(base_query, count_query, params, page, limit)


@router.get("/games", description="Get a list of all Olympic games available in the dataset.")
def get_public_games():
    query = """
        SELECT year, season, city, COUNT(DISTINCT id) as total_athletes, COUNT(DISTINCT noc) as total_nations
        FROM v_results_full
        GROUP BY year, season, city
        ORDER BY year DESC
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            return {"data": [dict(r) for r in cur.fetchall()]}

@router.get("/nations", description="Get a list of all nations (NOCs) and their overall medal counts.")
def get_public_nations():
    query = """
        SELECT noc, team_name, 
               COUNT(DISTINCT id) as total_athletes,
               SUM(CASE WHEN medal = 'Gold' THEN 1 ELSE 0 END) as gold_medals,
               SUM(CASE WHEN medal = 'Silver' THEN 1 ELSE 0 END) as silver_medals,
               SUM(CASE WHEN medal = 'Bronze' THEN 1 ELSE 0 END) as bronze_medals,
               COUNT(medal) as total_medals
        FROM v_results_full
        GROUP BY noc, team_name
        ORDER BY total_medals DESC
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            return {"data": [dict(r) for r in cur.fetchall()]}

@router.get("/sports", description="Get a list of all Olympic sports and their occurrences.")
def get_public_sports():
    query = """
        SELECT sport, 
               MIN(year) as first_appearance, 
               MAX(year) as latest_appearance,
               COUNT(DISTINCT event) as total_events
        FROM v_results_full
        GROUP BY sport
        ORDER BY sport ASC
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            return {"data": [dict(r) for r in cur.fetchall()]}
