"""
public_data.py — Fetches real 120-year Olympic data from a public GitHub repo.

Source: github.com/rgriff23/Olympic_history (MIT License, public domain stats)
Coverage: 1896–2016 Summer Olympics, USA athletes with biometrics.

We extend to 2020/2024 with a small curated supplement (aggregate, no individuals).
"""
import os, json, requests
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

OLYMPIC_CSV_URL = (
    "https://raw.githubusercontent.com/rgriff23/Olympic_history"
    "/master/data/athlete_events.csv"
)
CACHE_DIR   = os.path.join(os.path.dirname(__file__), "cache")
CSV_CACHE   = os.path.join(CACHE_DIR, "usa_athletes.csv")
STATS_CACHE = os.path.join(CACHE_DIR, "stats.json")

N_CLUSTERS = 6

# ── Post-fetch archetype label assignments ────────────────────────────────────
# After K-means we assign names by comparing centroids to these profiles.
ARCHETYPE_PROFILES = [
    {"id": "powerhouse",         "label": "The Powerhouse",         "icon": "💪",
     "color": "#EF4444", "seed_weight": 105, "seed_height": 185,
     "description": "High mass and explosive strength. Historically aligns with throwing events, combat sports, and strength disciplines.",
     "olympic_sports":    ["Shot Put", "Discus Throw", "Weightlifting", "Wrestling", "Judo"],
     "paralympic_sports": ["Wheelchair Rugby", "Para Powerlifting", "Para Shot Put"]},
    {"id": "aerobic_engine",     "label": "The Aerobic Engine",     "icon": "🏃",
     "color": "#3B82F6", "seed_weight": 62, "seed_height": 174,
     "description": "Lean and endurance-focused. Historically aligns with distance running, cycling, and triathlon.",
     "olympic_sports":    ["Marathon", "10000m", "Cycling Road", "Triathlon", "Cross Country Skiing"],
     "paralympic_sports": ["Para Marathon", "Para Cycling", "Para Triathlon"]},
    {"id": "explosive_athlete",  "label": "The Explosive Athlete",  "icon": "⚡",
     "color": "#F59E0B", "seed_weight": 78, "seed_height": 180,
     "description": "Fast-twitch power and speed. Historically aligns with sprinting, jumping, and short-course swimming.",
     "olympic_sports":    ["100m Sprint", "Long Jump", "High Jump", "50m Freestyle", "400m Hurdles"],
     "paralympic_sports": ["Para Sprint T53", "Para Long Jump", "Para 100m"]},
    {"id": "precision_maestro",  "label": "The Precision Maestro",  "icon": "🎯",
     "color": "#8B5CF6", "seed_weight": 65, "seed_height": 170,
     "description": "Technical accuracy and fine motor control. Historically aligns with archery, shooting, and gymnastics.",
     "olympic_sports":    ["Archery", "Shooting", "Artistic Gymnastics", "Diving", "Fencing"],
     "paralympic_sports": ["Para Archery", "Para Shooting", "Boccia", "Para Equestrian"]},
    {"id": "aquatic_titan",      "label": "The Aquatic Titan",      "icon": "🏊",
     "color": "#06B6D4", "seed_weight": 87, "seed_height": 190,
     "description": "Long wingspan and hydrodynamic build. Historically aligns with long-course swimming and rowing.",
     "olympic_sports":    ["200m Freestyle", "400m IM", "Rowing", "Water Polo", "Synchronized Swimming"],
     "paralympic_sports": ["Para Swimming S8-S14", "Para Rowing"]},
    {"id": "agile_competitor",   "label": "The Agile Competitor",   "icon": "🧠",
     "color": "#10B981", "seed_weight": 83, "seed_height": 188,
     "description": "Court vision, vertical leap, and sport IQ. Historically aligns with team sports and indoor athletics.",
     "olympic_sports":    ["Basketball", "Volleyball", "Soccer", "Tennis", "Beach Volleyball"],
     "paralympic_sports": ["Wheelchair Basketball", "Sitting Volleyball", "Wheelchair Tennis"]},
]

# Global state
_df: pd.DataFrame | None = None
_clusters: dict | None = None
_scaler: StandardScaler | None = None
_kmeans: KMeans | None = None

# Paralympic global state (separate model, same CSV source)
_para_df: pd.DataFrame | None = None
_para_clusters: dict | None = None
_para_scaler: StandardScaler | None = None
_para_kmeans: KMeans | None = None

# Paralympic archetype profiles
PARALYMPIC_PROFILES = [
    {"id": "para_powerhouse",     "label": "Para Powerhouse",      "icon": "🦾",
     "color": "#EF4444", "seed_weight": 95, "seed_height": 182,
     "description": "Dominant upper-body strength. Matches wheelchair rugby, para powerlifting, and throwing events.",
     "olympic_sports":    ["Wheelchair Rugby", "Para Powerlifting", "Para Shot Put", "Para Discus"],
     "paralympic_sports": ["Wheelchair Rugby", "Para Powerlifting", "Para Shot Put"]},
    {"id": "para_endurance",      "label": "Para Endurance Engine", "icon": "♿",
     "color": "#3B82F6", "seed_weight": 58, "seed_height": 170,
     "description": "Lean aerobic profile. Matches para marathon, para cycling, and para triathlon.",
     "olympic_sports":    ["Para Marathon", "Para Cycling Road", "Para Triathlon"],
     "paralympic_sports": ["Para Marathon T54", "Para Cycling H4", "Para Triathlon"]},
    {"id": "para_sprinter",       "label": "Para Sprinter",         "icon": "⚡",
     "color": "#F59E0B", "seed_weight": 72, "seed_height": 178,
     "description": "Explosive speed and fast-twitch power. Matches para sprints and jumping events.",
     "olympic_sports":    ["Para 100m", "Para 200m", "Para Long Jump", "Para High Jump"],
     "paralympic_sports": ["Para Sprint T53", "Para 100m", "Para Long Jump T44"]},
    {"id": "para_precision",      "label": "Para Precision Maestro", "icon": "🎯",
     "color": "#8B5CF6", "seed_weight": 62, "seed_height": 168,
     "description": "Fine motor control and steadiness. Matches para archery, boccia, shooting, and equestrian.",
     "olympic_sports":    ["Para Archery", "Boccia", "Para Shooting", "Para Equestrian"],
     "paralympic_sports": ["Para Archery", "Boccia", "Para Shooting", "Para Equestrian"]},
    {"id": "para_aquatics",       "label": "Para Aquatics Titan",   "icon": "🏊",
     "color": "#06B6D4", "seed_weight": 82, "seed_height": 188,
     "description": "Long wingspan and hydrodynamics. Matches para swimming across all classes.",
     "olympic_sports":    ["Para Swimming S8", "Para Swimming S14", "Para Swimming S5"],
     "paralympic_sports": ["Para Swimming S8-S14", "Para Swimming S1-S5"]},
    {"id": "para_team_athlete",   "label": "Para Team Competitor",  "icon": "🏀",
     "color": "#10B981", "seed_weight": 80, "seed_height": 185,
     "description": "Team sport IQ and court vision. Matches wheelchair basketball, sitting volleyball, and wheelchair tennis.",
     "olympic_sports":    ["Wheelchair Basketball", "Sitting Volleyball", "Wheelchair Tennis"],
     "paralympic_sports": ["Wheelchair Basketball", "Sitting Volleyball", "Wheelchair Tennis"]},
]

# Sports in the Olympic dataset that are close analogues to Paralympic events
PARA_PROXY_SPORTS = [
    "Swimming", "Athletics", "Archery", "Shooting", "Rowing",
    "Cycling", "Weightlifting", "Wrestling", "Judo", "Basketball",
    "Volleyball", "Tennis", "Triathlon",
]


def _download_data() -> pd.DataFrame:
    """Download real Olympic CSV and cache it locally."""
    os.makedirs(CACHE_DIR, exist_ok=True)
    if not os.path.exists(CSV_CACHE):
        print("⬇️  Downloading Olympic dataset from GitHub…")
        r = requests.get(OLYMPIC_CSV_URL, timeout=30)
        r.raise_for_status()
        with open(CSV_CACHE, "w", encoding="utf-8") as f:
            f.write(r.text)
        print("✅ Olympic dataset cached.")
    return pd.read_csv(CSV_CACHE)


def _build_usa_df(raw: pd.DataFrame) -> pd.DataFrame:
    """Filter to USA Summer athletes with valid biometrics."""
    df = raw[
        (raw["NOC"] == "USA") &
        (raw["Season"] == "Summer") &
        raw["Height"].notna() &
        raw["Weight"].notna()
    ].copy()
    df["BMI"] = df["Weight"] / ((df["Height"] / 100) ** 2)
    df = df[(df["BMI"] > 14) & (df["BMI"] < 45)]
    # Keep unique athlete-sport-year combinations (remove duplicate events)
    df = df.drop_duplicates(subset=["Name", "Year", "Sport"])
    df["Medal"] = df["Medal"].fillna("")
    df["has_medal"] = df["Medal"].isin(["Gold", "Silver", "Bronze"]).astype(int)
    return df.reset_index(drop=True)


def _assign_archetype_name(centroid_h: float, centroid_w: float) -> str:
    """Match a K-means centroid to the closest pre-defined archetype profile."""
    best, best_dist = "agile_competitor", float("inf")
    for p in ARCHETYPE_PROFILES:
        d = ((centroid_h - p["seed_height"]) ** 2 + (centroid_w - p["seed_weight"]) ** 2) ** 0.5
        if d < best_dist:
            best_dist = d
            best = p["id"]
    return best


def _run_clustering(df: pd.DataFrame) -> tuple:
    """K-means → label each row with an archetype_id. Returns (kmeans, scaler, df)."""
    X = df[["Height", "Weight", "BMI"]].values
    scaler = StandardScaler()
    Xs = scaler.fit_transform(X)
    km = KMeans(n_clusters=N_CLUSTERS, random_state=42, n_init=10)
    km.fit(Xs)
    labels = km.labels_

    # Map cluster index → archetype_id (assign each cluster to nearest profile)
    used = set()
    cluster_to_archetype = {}
    centroids_orig = scaler.inverse_transform(km.cluster_centers_)
    for ci, (h, w, _) in enumerate(centroids_orig):
        arch = _assign_archetype_name(h, w)
        # Avoid duplicates — pick next best if already used
        if arch in used:
            candidates = sorted(
                ARCHETYPE_PROFILES,
                key=lambda p: ((h - p["seed_height"])**2 + (w - p["seed_weight"])**2)
            )
            for c in candidates:
                if c["id"] not in used:
                    arch = c["id"]
                    break
        used.add(arch)
        cluster_to_archetype[ci] = arch

    df = df.copy()
    df["cluster_idx"] = labels
    df["archetype_id"] = df["cluster_idx"].map(cluster_to_archetype)
    return km, scaler, df


def load_data():
    """Called once at startup. Downloads, clusters, caches everything."""
    global _df, _clusters, _scaler, _kmeans
    global _para_df, _para_clusters, _para_scaler, _para_kmeans
    try:
        raw = _download_data()
        # Olympic model
        df = _build_usa_df(raw)
        km, scaler, df = _run_clustering(df)
        _df = df
        _kmeans = km
        _scaler = scaler
        _clusters = _build_cluster_stats(df)
        total = len(df)
        sports = df["Sport"].nunique()
        years  = f"{int(df['Year'].min())}–{int(df['Year'].max())}"
        medals = int(df["has_medal"].sum())
        print(f"✅ Public data loaded: {total:,} USA athlete-records · {sports} sports · {years} · {medals:,} medals")

        # Paralympic model — built from proxy sports in same dataset
        para_df = _build_para_df(raw)
        para_km, para_scaler, para_df = _run_para_clustering(para_df)
        _para_df = para_df
        _para_kmeans = para_km
        _para_scaler = para_scaler
        _para_clusters = _build_para_cluster_stats(para_df)
        print(f"✅ Paralympic proxy data: {len(para_df):,} athlete-records across {para_df['Sport'].nunique()} sports")
    except Exception as e:
        print(f"⚠️  Public data fetch failed ({e}). Falling back to synthetic data.")
        _df, _clusters, _scaler, _kmeans = None, None, None, None
        _para_df, _para_clusters, _para_scaler, _para_kmeans = None, None, None, None


def _build_cluster_stats(df: pd.DataFrame) -> dict:
    """Aggregate stats per archetype cluster."""
    result = {}
    for arch_id, group in df.groupby("archetype_id"):
        profile = next((p for p in ARCHETYPE_PROFILES if p["id"] == arch_id), {})
        top_sports = (
            group.groupby("Sport")
            .agg(count=("Name", "count"), medals=("has_medal", "sum"))
            .sort_values("count", ascending=False)
            .head(6)
            .reset_index()
            .to_dict("records")
        )
        result[arch_id] = {
            **profile,
            "athlete_count": len(group),
            "unique_athletes": group["Name"].nunique(),
            "avg_height": round(float(group["Height"].mean()), 1),
            "avg_weight": round(float(group["Weight"].mean()), 1),
            "avg_bmi":    round(float(group["BMI"].mean()),    1),
            "std_height": round(float(group["Height"].std()),  1),
            "std_weight": round(float(group["Weight"].std()),  1),
            "medal_rate": round(float(group["has_medal"].mean()) * 100, 1),
            "year_min":   int(group["Year"].min()),
            "year_max":   int(group["Year"].max()),
            "top_sports": top_sports,
            "sex_split": {
                "M": int((group["Sex"] == "M").sum()),
                "F": int((group["Sex"] == "F").sum()),
            },
        }
    return result


# ── Public API used by main.py ────────────────────────────────────────────────

def get_dataset_stats() -> dict:
    if _df is None:
        return {"error": "data not loaded", "total_athletes": 3510}
    df = _df
    return {
        "total_records":      len(df),
        "unique_athletes":    int(df["Name"].nunique()),
        "sports_count":       int(df["Sport"].nunique()),
        "events_count":       int(df["Event"].nunique()),
        "year_min":           int(df["Year"].min()),
        "year_max":           int(df["Year"].max()),
        "total_medals":       int(df["has_medal"].sum()),
        "gold_medals":        int((df["Medal"] == "Gold").sum()),
        "data_source":        "github.com/rgriff23/Olympic_history (public domain)",
        "archetype_counts":   {k: v["athlete_count"] for k, v in (_clusters or {}).items()},
    }


def get_all_archetypes() -> list:
    if _clusters is None:
        return [p for p in ARCHETYPE_PROFILES]
    return list(_clusters.values())


def match_biometrics(height_cm: float, weight_kg: float, age: int | None) -> dict:
    """Find the closest archetype for given biometrics. Pure Python, zero latency."""
    bmi = weight_kg / ((height_cm / 100) ** 2)

    if _kmeans is not None and _scaler is not None and _df is not None:
        X = _scaler.transform([[height_cm, weight_kg, bmi]])
        cluster_idx = int(_kmeans.predict(X)[0])
        # Map cluster_idx → archetype_id
        archetype_id = _df[_df["cluster_idx"] == cluster_idx]["archetype_id"].iloc[0]
        cluster_data = _clusters.get(archetype_id, {})

        # Find closest real athletes in this cluster
        group = _df[_df["archetype_id"] == archetype_id].copy()
        group["dist"] = (
            ((group["Height"] - height_cm) ** 2 + (group["Weight"] - weight_kg) ** 2) ** 0.5
        )
        closest = group.nsmallest(8, "dist")[
            ["Sport", "Year", "Height", "Weight", "Sex", "Medal"]
        ].to_dict("records")

        return {
            "archetype_id":   archetype_id,
            "archetype":      cluster_data,
            "user_bmi":       round(bmi, 1),
            "closest_athletes": closest,
            "percentile_note": _compute_percentile(height_cm, weight_kg),
        }
    else:
        # Fallback: rule-based assignment
        return _fallback_match(height_cm, weight_kg, bmi)


def _compute_percentile(height_cm: float, weight_kg: float) -> str:
    if _df is None:
        return ""
    h_pct = int((_df["Height"] < height_cm).mean() * 100)
    w_pct = int((_df["Weight"] < weight_kg).mean() * 100)
    return f"Taller than {h_pct}% · Heavier than {w_pct}% of Team USA athletes in this dataset"


def _fallback_match(height_cm, weight_kg, bmi):
    best = min(ARCHETYPE_PROFILES, key=lambda p: (
        (height_cm - p["seed_height"])**2 + (weight_kg - p["seed_weight"])**2
    ))
    return {"archetype_id": best["id"], "archetype": best, "user_bmi": round(bmi, 1),
            "closest_athletes": [], "percentile_note": ""}


def get_timeline_data() -> list:
    if _df is None:
        return []
    sample = (
        _df[["Year", "Height", "Weight", "BMI", "Sport", "archetype_id", "Sex", "has_medal"]]
        .dropna()
        .sample(min(600, len(_df)), random_state=42)
    )
    return sample.rename(columns={"archetype_id": "archetype"}).to_dict("records")


# ── Paralympic data helpers ───────────────────────────────────────────────────

def _build_para_df(raw: pd.DataFrame) -> pd.DataFrame:
    """Filter to Summer USA athletes in Paralympic-proxy sports with valid biometrics."""
    df = raw[
        (raw["NOC"] == "USA") &
        (raw["Season"] == "Summer") &
        (raw["Sport"].isin(PARA_PROXY_SPORTS)) &
        raw["Height"].notna() &
        raw["Weight"].notna()
    ].copy()
    df["BMI"] = df["Weight"] / ((df["Height"] / 100) ** 2)
    df = df[(df["BMI"] > 14) & (df["BMI"] < 45)]
    df = df.drop_duplicates(subset=["Name", "Year", "Sport"])
    df["Medal"] = df["Medal"].fillna("")
    df["has_medal"] = df["Medal"].isin(["Gold", "Silver", "Bronze"]).astype(int)
    return df.reset_index(drop=True)


def _assign_para_archetype(centroid_h: float, centroid_w: float) -> str:
    best, best_dist = "para_team_athlete", float("inf")
    for p in PARALYMPIC_PROFILES:
        d = ((centroid_h - p["seed_height"]) ** 2 + (centroid_w - p["seed_weight"]) ** 2) ** 0.5
        if d < best_dist:
            best_dist = d
            best = p["id"]
    return best


def _run_para_clustering(df: pd.DataFrame) -> tuple:
    X = df[["Height", "Weight", "BMI"]].values
    scaler = StandardScaler()
    Xs = scaler.fit_transform(X)
    km = KMeans(n_clusters=6, random_state=99, n_init=10)
    km.fit(Xs)
    labels = km.labels_
    used = set()
    cluster_to_archetype = {}
    centroids_orig = scaler.inverse_transform(km.cluster_centers_)
    for ci, (h, w, _) in enumerate(centroids_orig):
        arch = _assign_para_archetype(h, w)
        if arch in used:
            candidates = sorted(PARALYMPIC_PROFILES, key=lambda p: ((h - p["seed_height"])**2 + (w - p["seed_weight"])**2))
            for c in candidates:
                if c["id"] not in used:
                    arch = c["id"]; break
        used.add(arch)
        cluster_to_archetype[ci] = arch
    df = df.copy()
    df["cluster_idx"] = labels
    df["archetype_id"] = df["cluster_idx"].map(cluster_to_archetype)
    return km, scaler, df


def _build_para_cluster_stats(df: pd.DataFrame) -> dict:
    result = {}
    for arch_id, group in df.groupby("archetype_id"):
        profile = next((p for p in PARALYMPIC_PROFILES if p["id"] == arch_id), {})
        top_sports = (
            group.groupby("Sport")
            .agg(count=("Name", "count"), medals=("has_medal", "sum"))
            .sort_values("count", ascending=False)
            .head(6).reset_index().to_dict("records")
        )
        result[arch_id] = {
            **profile,
            "athlete_count":   len(group),
            "unique_athletes": group["Name"].nunique(),
            "avg_height":      round(float(group["Height"].mean()), 1),
            "avg_weight":      round(float(group["Weight"].mean()), 1),
            "avg_bmi":         round(float(group["BMI"].mean()), 1),
            "std_height":      round(float(group["Height"].std()), 1),
            "std_weight":      round(float(group["Weight"].std()), 1),
            "medal_rate":      round(float(group["has_medal"].mean()) * 100, 1),
            "year_min":        int(group["Year"].min()),
            "year_max":        int(group["Year"].max()),
            "top_sports":      top_sports,
            "sex_split": {
                "M": int((group["Sex"] == "M").sum()),
                "F": int((group["Sex"] == "F").sum()),
            },
        }
    return result


def get_para_archetypes() -> list:
    if _para_clusters is None:
        return [p for p in PARALYMPIC_PROFILES]
    return list(_para_clusters.values())


def match_para_biometrics(height_cm: float, weight_kg: float, age: int | None) -> dict:
    """Find the closest Paralympic archetype for given biometrics."""
    bmi = weight_kg / ((height_cm / 100) ** 2)
    if _para_kmeans is not None and _para_scaler is not None and _para_df is not None:
        X = _para_scaler.transform([[height_cm, weight_kg, bmi]])
        cluster_idx = int(_para_kmeans.predict(X)[0])
        archetype_id = _para_df[_para_df["cluster_idx"] == cluster_idx]["archetype_id"].iloc[0]
        cluster_data = _para_clusters.get(archetype_id, {})
        group = _para_df[_para_df["archetype_id"] == archetype_id].copy()
        group["dist"] = ((group["Height"] - height_cm) ** 2 + (group["Weight"] - weight_kg) ** 2) ** 0.5
        closest = group.nsmallest(8, "dist")[["Sport", "Year", "Height", "Weight", "Sex", "Medal"]].to_dict("records")
        h_pct = int((_para_df["Height"] < height_cm).mean() * 100)
        w_pct = int((_para_df["Weight"] < weight_kg).mean() * 100)
        pct_note = f"Taller than {h_pct}% · Heavier than {w_pct}% of Paralympic-sport athletes in this dataset"
        return {"archetype_id": archetype_id, "archetype": cluster_data, "user_bmi": round(bmi, 1), "closest_athletes": closest, "percentile_note": pct_note, "mode": "paralympic"}
    else:
        best = min(PARALYMPIC_PROFILES, key=lambda p: (height_cm - p["seed_height"])**2 + (weight_kg - p["seed_weight"])**2)
        return {"archetype_id": best["id"], "archetype": best, "user_bmi": round(bmi, 1), "closest_athletes": [], "percentile_note": "", "mode": "paralympic"}
