"""
archetypes.py — Archetype taxonomy for TeamUSA Athlete Archetype Agent.

Six archetypes covering both Olympic and Paralympic athlete profiles,
derived from K-means clustering of 120 years of US athlete biometrics.
"""

from dataclasses import dataclass
from typing import List


@dataclass
class Archetype:
    id: str
    label: str
    icon: str
    description: str
    olympic_sports: List[str]
    paralympic_sports: List[str]
    # Rough centroid profile for narrative context
    typical_height_cm: float
    typical_weight_kg: float
    typical_bmi: float


ARCHETYPES: List[Archetype] = [
    Archetype(
        id="powerhouse",
        label="The Powerhouse",
        icon="💪",
        description=(
            "High mass, high-force athletes built for strength and explosive power. "
            "Historically dominant in throwing events, combat sports, and strength disciplines."
        ),
        olympic_sports=["Shot Put", "Discus", "Hammer Throw", "Weightlifting", "Wrestling", "Football"],
        paralympic_sports=["Powerlifting", "Wheelchair Rugby", "Shot Put (F20-F58 classes)"],
        typical_height_cm=182.0,
        typical_weight_kg=100.0,
        typical_bmi=30.2,
    ),
    Archetype(
        id="aerobic_engine",
        label="The Aerobic Engine",
        icon="🏃",
        description=(
            "Lean, efficient endurance athletes with exceptional cardiovascular capacity. "
            "Built for sustained output over long distances and multi-discipline events."
        ),
        olympic_sports=["Marathon", "Cycling", "Triathlon", "Cross-Country Skiing", "Rowing"],
        paralympic_sports=["Para-Triathlon", "Handcycle", "Para-Rowing", "Para-Marathon"],
        typical_height_cm=174.0,
        typical_weight_kg=65.0,
        typical_bmi=21.4,
    ),
    Archetype(
        id="explosive_athlete",
        label="The Explosive Athlete",
        icon="⚡",
        description=(
            "Fast-twitch dominant athletes combining speed, power, and agility. "
            "Excel in short, maximal-effort events across sprinting, jumping, and court sports."
        ),
        olympic_sports=["100m Sprint", "Long Jump", "Gymnastics", "Volleyball", "Basketball"],
        paralympic_sports=["Para-Sprint (T11-T54)", "Sitting Volleyball", "Para-Long Jump"],
        typical_height_cm=178.0,
        typical_weight_kg=76.0,
        typical_bmi=24.0,
    ),
    Archetype(
        id="precision_maestro",
        label="The Precision Maestro",
        icon="🎯",
        description=(
            "Athletes where accuracy, fine motor control, and mental focus matter more than physique. "
            "Body metrics vary widely — technique and concentration are the unifying factors."
        ),
        olympic_sports=["Shooting", "Archery", "Golf", "Equestrian", "Sailing"],
        paralympic_sports=["Boccia", "Para-Archery", "Para-Shooting", "Para-Equestrian"],
        typical_height_cm=175.0,
        typical_weight_kg=73.0,
        typical_bmi=23.8,
    ),
    Archetype(
        id="aquatic_specialist",
        label="The Aquatic Specialist",
        icon="🏊",
        description=(
            "Tall, broad-shouldered athletes built for hydrodynamic efficiency. "
            "Long limbs and flexible joints historically correlate with aquatic excellence."
        ),
        olympic_sports=["Swimming", "Water Polo", "Diving", "Synchronized Swimming"],
        paralympic_sports=["Para-Swimming (S1-S14)", "Para-Diving"],
        typical_height_cm=185.0,
        typical_weight_kg=80.0,
        typical_bmi=23.4,
    ),
    Archetype(
        id="agile_tactician",
        label="The Agile Tactician",
        icon="🧠",
        description=(
            "Versatile, mid-range athletes combining agility, reaction time, and sport IQ. "
            "Excel in team sports and individual disciplines requiring quick decision-making."
        ),
        olympic_sports=["Soccer", "Hockey", "Tennis", "Fencing", "Judo", "Taekwondo"],
        paralympic_sports=["Wheelchair Basketball", "Para-Judo", "Wheelchair Tennis", "Goalball"],
        typical_height_cm=176.0,
        typical_weight_kg=72.0,
        typical_bmi=23.2,
    ),
]

ARCHETYPE_MAP = {a.id: a for a in ARCHETYPES}
