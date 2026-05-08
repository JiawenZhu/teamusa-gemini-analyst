from fastapi import APIRouter, Query
from db import queries

router = APIRouter(prefix="/api/tools")

@router.get("/medal-stats")
def medal_stats(year: int = None, medal: str = None, sport: str = None):
    return queries.get_medal_stats(noc="USA", year=year, medal=medal, sport=sport)

@router.get("/athlete-biometrics")
def athlete_biometrics(sport: str = None, sex: str = None):
    return queries.get_athlete_biometrics(noc="USA", sport=sport, sex=sex)

@router.get("/sport-breakdown")
def sport_breakdown(year: int = None):
    return queries.get_sport_breakdown(noc="USA", year=year)

@router.get("/team-usa-stats")
def team_usa_stats(medal: str = None, sport: str = None, limit: int = 5):
    return queries.get_team_usa_stats(medal, sport, limit)

@router.get("/athlete-age-stats")
def athlete_age_stats(sport: str = None, year: int = None):
    return queries.get_athlete_age_stats(noc="USA", sport=sport, year=year)

@router.get("/gender-breakdown")
def gender_breakdown(year: int = None):
    return queries.get_gender_breakdown(noc="USA", year=year)

@router.get("/games-summary")
def games_summary(year: int, season: str = None):
    return queries.get_games_summary(year, season)

@router.get("/sport-history")
def sport_history(sport: str):
    return queries.get_sport_history(sport)

@router.get("/bmi-by-sport")
def bmi_by_sport(year: int = None):
    return queries.get_bmi_by_sport(noc="USA", year=year)
