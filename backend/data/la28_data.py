"""
la28_data.py — LA28 sport data and archetype affinity mappings.
"""

LA28_SPORTS = [
    {"sport": "Athletics (Track & Field)", "olympic": True, "paralympic": True,
     "description": "Running, jumping, and throwing events across all distances."},
    {"sport": "Swimming", "olympic": True, "paralympic": True,
     "description": "Pool and open water events across all strokes and distances."},
    {"sport": "Cycling", "olympic": True, "paralympic": True,
     "description": "Road, track, mountain bike, and BMX disciplines."},
    {"sport": "Gymnastics", "olympic": True, "paralympic": False,
     "description": "Artistic, rhythmic, and trampoline disciplines."},
    {"sport": "Triathlon", "olympic": True, "paralympic": True,
     "description": "Swim-bike-run combined endurance event."},
    {"sport": "Weightlifting", "olympic": True, "paralympic": True,
     "description": "Snatch and clean-and-jerk lifts across weight categories."},
    {"sport": "Wrestling", "olympic": True, "paralympic": False,
     "description": "Freestyle and Greco-Roman disciplines."},
    {"sport": "Soccer", "olympic": True, "paralympic": False,
     "description": "11-a-side outdoor football."},
    {"sport": "Basketball", "olympic": True, "paralympic": True,
     "description": "5-on-5 hardcourt basketball, including wheelchair basketball."},
    {"sport": "Tennis", "olympic": True, "paralympic": True,
     "description": "Singles and doubles on hard court, including wheelchair tennis."},
    {"sport": "Archery", "olympic": True, "paralympic": True,
     "description": "Recurve and compound bow disciplines at 70m."},
    {"sport": "Shooting", "olympic": True, "paralympic": True,
     "description": "Rifle, pistol, and shotgun events."},
    {"sport": "Rowing", "olympic": True, "paralympic": True,
     "description": "Sculling and sweep rowing across distances."},
    {"sport": "Boccia", "olympic": False, "paralympic": True,
     "description": "Paralympic precision ball sport, similar to pétanque."},
    {"sport": "Goalball", "olympic": False, "paralympic": True,
     "description": "Team sport for visually impaired athletes."},
    {"sport": "Para-Powerlifting", "olympic": False, "paralympic": True,
     "description": "Bench press discipline for Paralympic athletes."},
    {"sport": "Surfing", "olympic": True, "paralympic": False,
     "description": "Shortboard surfing in ocean waves."},
    {"sport": "Skateboarding", "olympic": True, "paralympic": False,
     "description": "Street and park disciplines."},
    {"sport": "Breaking", "olympic": True, "paralympic": False,
     "description": "Breakdance battle format — making its LA28 debut."},
    {"sport": "Golf", "olympic": True, "paralympic": False,
     "description": "72-hole stroke play on a full-length course."},
]

# Archetype → top LA28 sport affinities (ordered by historical alignment)
ARCHETYPE_SPORT_AFFINITY: dict[str, list[dict]] = {
    "powerhouse": [
        {"sport": "Weightlifting", "affinity_score": 0.95, "historical_basis": "120 years of US strength athletes share this body profile"},
        {"sport": "Wrestling", "affinity_score": 0.88, "historical_basis": "High-mass athletes historically excel in grappling disciplines"},
        {"sport": "Para-Powerlifting", "affinity_score": 0.85, "historical_basis": "Strength archetypes translate directly to Paralympic powerlifting"},
        {"sport": "Athletics (Track & Field)", "affinity_score": 0.70, "historical_basis": "Throwing events (shot put, discus, hammer) favor powerhouse builds"},
    ],
    "aerobic_engine": [
        {"sport": "Triathlon", "affinity_score": 0.96, "historical_basis": "Lean endurance builds dominate multi-discipline events"},
        {"sport": "Cycling", "affinity_score": 0.93, "historical_basis": "Power-to-weight ratio is the defining factor in cycling"},
        {"sport": "Rowing", "affinity_score": 0.88, "historical_basis": "Aerobic capacity and stroke efficiency correlate with this build"},
        {"sport": "Athletics (Track & Field)", "affinity_score": 0.85, "historical_basis": "Marathon and distance running historically dominated by aerobic builds"},
    ],
    "explosive_athlete": [
        {"sport": "Athletics (Track & Field)", "affinity_score": 0.97, "historical_basis": "Sprint and jump events are the natural home of explosive builds"},
        {"sport": "Gymnastics", "affinity_score": 0.90, "historical_basis": "Fast-twitch power underpins tumbling and vaulting excellence"},
        {"sport": "Basketball", "affinity_score": 0.85, "historical_basis": "Vertical leap and lateral quickness align with this archetype"},
        {"sport": "Surfing", "affinity_score": 0.72, "historical_basis": "Wave reading and explosive pop require this explosive profile"},
    ],
    "precision_maestro": [
        {"sport": "Archery", "affinity_score": 0.97, "historical_basis": "Fine motor control and breath management define archery excellence"},
        {"sport": "Shooting", "affinity_score": 0.95, "historical_basis": "Marksmanship rewards precision and consistency over athleticism"},
        {"sport": "Golf", "affinity_score": 0.88, "historical_basis": "Swing mechanics and course management reward this analytical profile"},
        {"sport": "Boccia", "affinity_score": 0.85, "historical_basis": "Paralympic boccia is the ultimate precision sport"},
    ],
    "aquatic_specialist": [
        {"sport": "Swimming", "affinity_score": 0.98, "historical_basis": "Long limbs and broad shoulders are the defining traits of aquatic dominance"},
        {"sport": "Triathlon", "affinity_score": 0.85, "historical_basis": "Swimming leg advantage compounds in multi-discipline events"},
        {"sport": "Rowing", "affinity_score": 0.80, "historical_basis": "Tall, long-armed athletes generate exceptional stroke length"},
    ],
    "agile_tactician": [
        {"sport": "Soccer", "affinity_score": 0.93, "historical_basis": "Field vision and quick direction changes define this archetype"},
        {"sport": "Tennis", "affinity_score": 0.90, "historical_basis": "Agility and reactive decision-making are core to racket sports"},
        {"sport": "Basketball", "affinity_score": 0.87, "historical_basis": "Court awareness and positioning reward tactical intelligence"},
        {"sport": "Goalball", "affinity_score": 0.82, "historical_basis": "Paralympic goalball rewards spatial awareness and team coordination"},
        {"sport": "Skateboarding", "affinity_score": 0.75, "historical_basis": "Board sports reward the agile, reactive profile"},
    ],
}


def get_la28_sports() -> list[dict]:
    return LA28_SPORTS


def get_archetype_sport_affinity(archetype_id: str) -> list[dict]:
    return ARCHETYPE_SPORT_AFFINITY.get(archetype_id, [])
