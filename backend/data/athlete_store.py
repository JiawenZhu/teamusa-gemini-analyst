"""
athlete_store.py — Loads and indexes the athlete dataset for fast lookups.

The dataset is loaded once at startup into a pandas DataFrame.
K-means cluster assignments are loaded from a precomputed pickle.
All tool functions called by Gemini agents live here.
"""

import os
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

DATA_DIR = Path(__file__).parent
DATASET_PATH = DATA_DIR / "athletes.csv"
CENTROIDS_PATH = DATA_DIR / "centroids.pkl"

# ── Singleton state loaded once at startup ────────────────────────────────────

_df: pd.DataFrame | None = None
_scaler: StandardScaler | None = None
_kmeans: KMeans | None = None
_cluster_to_archetype: dict[int, str] = {}


def load_data() -> None:
    """Load and preprocess the athlete dataset and clustering model at startup."""
    global _df, _scaler, _kmeans, _cluster_to_archetype

    if not DATASET_PATH.exists():
        print(f"⚠️  Dataset not found at {DATASET_PATH}. Using synthetic fallback data.")
        _df = _generate_synthetic_dataset()
    else:
        _df = pd.read_csv(DATASET_PATH)

    # Normalize column names
    _df.columns = [c.strip().lower().replace(" ", "_") for c in _df.columns]

    # Ensure required columns exist
    for col in ["height_cm", "weight_kg", "sport", "type", "year"]:
        if col not in _df.columns:
            _df[col] = _df.get(col, np.nan)

    # Drop rows with missing biometrics
    _df = _df.dropna(subset=["height_cm", "weight_kg"]).copy()
    _df["bmi"] = _df["weight_kg"] / (((_df["height_cm"] / 100) ** 2))

    # Load or compute clustering
    if CENTROIDS_PATH.exists():
        with open(CENTROIDS_PATH, "rb") as f:
            saved = pickle.load(f)
            _scaler = saved["scaler"]
            _kmeans = saved["kmeans"]
            _cluster_to_archetype = saved["cluster_to_archetype"]
    else:
        print("ℹ️  No precomputed centroids found. Running K-means clustering...")
        _scaler, _kmeans, _cluster_to_archetype = _compute_clusters(_df)
        _save_centroids(_scaler, _kmeans, _cluster_to_archetype)

    # Add cluster assignments to the dataframe
    features = _df[["height_cm", "weight_kg", "bmi"]].values
    scaled = _scaler.transform(features)
    _df["cluster_id"] = _kmeans.predict(scaled)
    _df["archetype"] = _df["cluster_id"].map(_cluster_to_archetype)

    print(f"✅ Dataset loaded: {len(_df)} athletes, {_df['cluster_id'].nunique()} clusters")


def _compute_clusters(
    df: pd.DataFrame, n_clusters: int = 6
) -> tuple[StandardScaler, KMeans, dict[int, str]]:
    features = df[["height_cm", "weight_kg", "bmi"]].values
    scaler = StandardScaler()
    scaled = scaler.fit_transform(features)
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    kmeans.fit(scaled)

    # Map cluster IDs to archetype IDs by centroid profile
    from data.archetypes import ARCHETYPES
    centroids_original = scaler.inverse_transform(kmeans.cluster_centers_)
    archetype_profiles = [
        (a.id, a.typical_height_cm, a.typical_weight_kg, a.typical_bmi) for a in ARCHETYPES
    ]

    cluster_to_archetype = {}
    for cluster_id, centroid in enumerate(centroids_original):
        h, w, bmi = centroid[0], centroid[1], centroid[2]
        best_match = min(
            archetype_profiles,
            key=lambda a: (h - a[1]) ** 2 + (w - a[2]) ** 2 + (bmi - a[3]) ** 2,
        )
        cluster_to_archetype[cluster_id] = best_match[0]

    return scaler, kmeans, cluster_to_archetype


def _save_centroids(scaler, kmeans, mapping) -> None:
    CENTROIDS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CENTROIDS_PATH, "wb") as f:
        pickle.dump({"scaler": scaler, "kmeans": kmeans, "cluster_to_archetype": mapping}, f)
    print(f"✅ Centroids saved to {CENTROIDS_PATH}")


def _generate_synthetic_dataset() -> pd.DataFrame:
    """Generate synthetic US athlete data for development when real CSV is unavailable."""
    import random
    random.seed(42)
    np.random.seed(42)

    sports_olympic = [
        ("Marathon", 172, 60, "olympic"), ("Sprinting", 178, 76, "olympic"),
        ("Swimming", 185, 80, "olympic"), ("Weightlifting", 175, 105, "olympic"),
        ("Gymnastics", 162, 57, "olympic"), ("Basketball", 198, 95, "olympic"),
        ("Wrestling", 176, 86, "olympic"), ("Archery", 174, 72, "olympic"),
        ("Cycling", 178, 70, "olympic"), ("Soccer", 176, 74, "olympic"),
    ]
    sports_paralympic = [
        ("Para-Marathon", 170, 58, "paralympic"), ("Para-Swimming", 182, 78, "paralympic"),
        ("Wheelchair Rugby", 180, 90, "paralympic"), ("Boccia", 170, 68, "paralympic"),
        ("Para-Archery", 172, 70, "paralympic"), ("Wheelchair Basketball", 185, 82, "paralympic"),
        ("Para-Sprint", 174, 72, "paralympic"), ("Handcycle", 176, 75, "paralympic"),
    ]

    rows = []
    for sport, base_h, base_w, stype in sports_olympic + sports_paralympic:
        for year in range(1980, 2025, 4):
            n = random.randint(8, 25)
            for _ in range(n):
                h = base_h + np.random.normal(0, 5)
                w = base_w + np.random.normal(0, 8)
                rows.append({
                    "sport": sport, "type": stype, "year": year,
                    "height_cm": round(h, 1), "weight_kg": round(w, 1),
                    "country": "USA",
                })

    return pd.DataFrame(rows)


# ── Tool functions called by Gemini agents ────────────────────────────────────

def get_athlete_cluster(
    height_cm: float, weight_kg: float, age: int | None = None
) -> dict:
    """
    Find the nearest K-means cluster for the given biometrics.
    Returns the archetype label and top matched Olympic athletes.
    Called by Agent 1 (Data Gatherer).
    """
    if _df is None or _scaler is None or _kmeans is None:
        raise RuntimeError("Dataset not loaded. Call load_data() at startup.")

    bmi = weight_kg / ((height_cm / 100) ** 2)
    features = np.array([[height_cm, weight_kg, bmi]])
    scaled = _scaler.transform(features)
    cluster_id = int(_kmeans.predict(scaled)[0])
    archetype_id = _cluster_to_archetype.get(cluster_id, "agile_tactician")

    centroid = _scaler.inverse_transform(_kmeans.cluster_centers_[[cluster_id]])[0]
    distance = float(np.linalg.norm(scaled[0] - _kmeans.cluster_centers_[cluster_id]))

    # Find top 5 Olympic athletes in this cluster
    cluster_athletes = _df[(_df["cluster_id"] == cluster_id) & (_df["type"] == "olympic")].copy()
    cluster_athletes["distance"] = np.sqrt(
        (cluster_athletes["height_cm"] - height_cm) ** 2
        + (cluster_athletes["weight_kg"] - weight_kg) ** 2
    )
    top_athletes = cluster_athletes.nsmallest(5, "distance")[
        ["sport", "year", "height_cm", "weight_kg", "type"]
    ].to_dict("records")

    return {
        "cluster_id": cluster_id,
        "archetype_id": archetype_id,
        "centroid_height_cm": round(float(centroid[0]), 1),
        "centroid_weight_kg": round(float(centroid[1]), 1),
        "centroid_bmi": round(float(centroid[2]), 1),
        "distance_from_centroid": round(distance, 3),
        "matched_olympic_athletes": top_athletes,
        "user_bmi": round(float(bmi), 1),
    }


def get_paralympic_matches(height_cm: float, weight_kg: float) -> dict:
    """
    Find the top matched Paralympic athletes by biometric similarity.
    Called by Agent 1 (Data Gatherer) — ensures Olympic/Paralympic parity.
    """
    if _df is None:
        raise RuntimeError("Dataset not loaded.")

    para_df = _df[_df["type"] == "paralympic"].copy()
    para_df["distance"] = np.sqrt(
        (para_df["height_cm"] - height_cm) ** 2
        + (para_df["weight_kg"] - weight_kg) ** 2
    )
    top = para_df.nsmallest(3, "distance")[
        ["sport", "year", "height_cm", "weight_kg", "type"]
    ].to_dict("records")

    return {"matched_paralympic_athletes": top}


def verify_athlete_stat(sport: str, year: int, stat_name: str, claimed_value: str) -> dict:
    """
    Verify a factual claim about athletes in a sport/year against the real dataset.
    Called by Agent 2 (Validator). Returns whether the claim is accurate and the
    actual value from the dataset if different.
    """
    if _df is None:
        raise RuntimeError("Dataset not loaded.")

    subset = _df[(_df["sport"] == sport) & (_df["year"] == year)]
    if subset.empty:
        return {
            "is_accurate": None,  # Cannot verify — no data for this combination
            "actual_value": None,
            "note": f"No data found for {sport} in {year}",
        }

    if stat_name == "average_height_cm":
        actual = round(float(subset["height_cm"].mean()), 1)
        try:
            claimed = float(claimed_value)
            is_accurate = abs(claimed - actual) < 5.0  # 5cm tolerance
        except (ValueError, TypeError):
            is_accurate = False
        return {"is_accurate": is_accurate, "actual_value": str(actual), "stat_name": stat_name}

    if stat_name == "average_weight_kg":
        actual = round(float(subset["weight_kg"].mean()), 1)
        try:
            claimed = float(claimed_value)
            is_accurate = abs(claimed - actual) < 5.0  # 5kg tolerance
        except (ValueError, TypeError):
            is_accurate = False
        return {"is_accurate": is_accurate, "actual_value": str(actual), "stat_name": stat_name}

    if stat_name == "athlete_count":
        actual = str(len(subset))
        is_accurate = claimed_value.strip() == actual
        return {"is_accurate": is_accurate, "actual_value": actual, "stat_name": stat_name}

    return {"is_accurate": None, "actual_value": None, "note": f"Unknown stat_name: {stat_name}"}


def get_timeline_data() -> list[dict]:
    """
    Return all athletes in a format suitable for the 120-year scatter plot.
    Called directly by the frontend API route.
    """
    if _df is None:
        return []
    cols = ["sport", "year", "height_cm", "weight_kg", "bmi", "type", "archetype"]
    return _df[cols].dropna().to_dict("records")
