from fastapi import APIRouter, Query
from db import queries

router = APIRouter(prefix="/api/tools")

@router.get("/medal-stats")
def medal_stats(noc: str = None, year: int = None, medal: str = None, sport: str = None):
    return queries.get_medal_stats(noc, year, medal, sport)

@router.get("/athlete-biometrics")
def athlete_biometrics(noc: str = None, sport: str = None, sex: str = None):
    return queries.get_athlete_biometrics(noc, sport, sex)

@router.get("/sport-breakdown")
def sport_breakdown(noc: str = None, year: int = None):
    return queries.get_sport_breakdown(noc, year)

@router.get("/top-nations")
def top_nations(medal: str = None, sport: str = None, limit: int = 5):
    return queries.get_top_nations(medal, sport, limit)

@router.get("/athlete-age-stats")
def athlete_age_stats(noc: str = None, sport: str = None, year: int = None):
    return queries.get_athlete_age_stats(noc, sport, year)

@router.get("/gender-breakdown")
def gender_breakdown(noc: str = None, year: int = None):
    return queries.get_gender_breakdown(noc, year)

@router.get("/games-summary")
def games_summary(year: int, season: str = None):
    return queries.get_games_summary(year, season)

@router.get("/sport-history")
def sport_history(sport: str):
    return queries.get_sport_history(sport)

@router.get("/bmi-by-sport")
def bmi_by_sport(noc: str = None, year: int = None):
    return queries.get_bmi_by_sport(noc, year)
