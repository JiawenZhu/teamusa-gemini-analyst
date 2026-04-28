"""
pipeline.py — 4-Agent Gemini Orchestration Pipeline (Speed-Optimized)

Architecture for instant UX:
  - Archetype match: pure Python K-means (0ms, no Gemini)
  - Agent 2 (Validator): Flash, background, emits badge update when done
  - Agent 3 (Narrator): Flash, starts streaming immediately
  - Agent 4 (LA28): Flash, runs in PARALLEL with Agent 3

Target latency:
  - Archetype card visible: <1s
  - Narrative streaming starts: 2-4s
  - LA28 panel: 3-6s (parallel with narrative)
  - Validator badge update: 5-10s (background)
"""

import json
import os
import asyncio
from typing import AsyncIterator

from google import genai
from google.genai import types

from data.athlete_store import (
    get_athlete_cluster,
    get_paralympic_matches,
    verify_athlete_stat,
)
from data.la28_data import get_la28_sports, get_archetype_sport_affinity
from data.archetypes import ARCHETYPE_MAP


# ── Gemini client ─────────────────────────────────────────────────────────────

def _make_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY", "")
    return genai.Client(api_key=api_key)


# All agents use Flash — Pro+thinking adds 40-60s of latency for no visible benefit
FLASH_MODEL = "gemini-3-flash-preview"


# ── Step 1: Instant cluster lookup (pure Python, zero Gemini calls) ───────────

def instant_cluster(height_cm: float, weight_kg: float, age: int | None) -> dict:
    """
    K-means lookup — runs in <5ms with no network calls.
    Returns archetype + matched athletes immediately so the UI card can render.
    """
    cluster_data  = get_athlete_cluster(height_cm, weight_kg, age)
    paralympic_data = get_paralympic_matches(height_cm, weight_kg)
    return {"cluster_data": cluster_data, "paralympic_data": paralympic_data}


# ── Agent 2 — Validator (Flash, runs in background) ──────────────────────────

AGENT2_TOOLS = [
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="verify_athlete_stat",
                description=(
                    "Verify a factual claim about athletes in a sport/year against the real dataset. "
                    "Returns whether the claim is accurate and the actual value if different."
                ),
                parameters=types.Schema(
                    type="OBJECT",
                    properties={
                        "sport":         types.Schema(type="STRING"),
                        "year":          types.Schema(type="INTEGER"),
                        "stat_name":     types.Schema(type="STRING",
                                          description="One of: average_height_cm, average_weight_kg, athlete_count"),
                        "claimed_value": types.Schema(type="STRING"),
                    },
                    required=["sport", "year", "stat_name", "claimed_value"],
                ),
            ),
        ]
    )
]

AGENT2_SYSTEM = """You are Agent 2 (Validator) in a multi-agent Team USA analytics system.
Review the athlete data and validate any numerical claims using verify_athlete_stat.
Only call the tool for claims with specific numbers (heights, weights, counts).
Return JSON: { "corrections": [{"field", "original", "corrected"}], "corrections_made": int }"""


async def run_agent2(cluster_data: dict) -> dict:
    """Agent 2: validate athlete facts — runs in background after meta is emitted."""
    client = _make_client()
    corrections = []

    prompt = (
        "Validate numerical claims in this athlete context data. "
        "Call verify_athlete_stat for any specific height/weight values. "
        f"Data:\n{json.dumps(cluster_data, indent=2)[:2000]}"
    )

    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=FLASH_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=AGENT2_SYSTEM,
                tools=AGENT2_TOOLS,
                temperature=0.1,
            ),
        )
        for part in response.candidates[0].content.parts:
            if part.function_call:
                fn = part.function_call
                if fn.name == "verify_athlete_stat":
                    result = verify_athlete_stat(**dict(fn.args))
                    if result.get("is_accurate") is False and result.get("actual_value"):
                        corrections.append({
                            "field": f"{fn.args.get('sport')} {fn.args.get('year')} {fn.args.get('stat_name')}",
                            "original": str(fn.args.get("claimed_value")),
                            "corrected": result["actual_value"],
                        })
    except Exception:
        pass  # Validator failure is always non-fatal

    return {"corrections": corrections, "corrections_made": len(corrections)}


# ── Agent 3 — Narrator (Flash, streaming) ────────────────────────────────────

AGENT3_SYSTEM = """You are Agent 3 (Narrator) — a Team USA sports historian.
Rules:
1. Use ONLY the facts provided. No invented statistics.
2. Include at least one Olympic AND one Paralympic athlete reference.
3. Use conditional language: "could align with", "historically similar builds have", "may suggest".
4. Tone: inspiring, warm, historically rich.
5. Write exactly 3 paragraphs:
   - P1: What this archetype represents in Team USA history
   - P2: The Olympic athlete parallel
   - P3: The Paralympic parallel + LA28 outlook
6. Keep it concise — max 200 words total. Quality over length."""

AGENT3_TEMPLATE = """Write a 3-paragraph archetype story (max 200 words) for a fan with:
Height: {height_cm}cm | Weight: {weight_kg}kg | BMI: {bmi:.1f}
Archetype: {archetype_label} — {archetype_description}
Olympic sports matched: {olympic_sports}
Paralympic sports matched: {paralympic_sports}"""


async def run_agent3_stream(
    height_cm: float,
    weight_kg: float,
    archetype_id: str,
) -> AsyncIterator[str]:
    """Agent 3: stream narrative. Starts immediately after instant_cluster."""
    client = _make_client()
    archetype = ARCHETYPE_MAP.get(archetype_id)
    if not archetype:
        yield "Your profile connects to a unique moment in Team USA history."
        return

    bmi = weight_kg / ((height_cm / 100) ** 2)
    prompt = AGENT3_TEMPLATE.format(
        height_cm=height_cm,
        weight_kg=weight_kg,
        bmi=bmi,
        archetype_label=archetype.label,
        archetype_description=archetype.description,
        olympic_sports=", ".join(archetype.olympic_sports[:3]),
        paralympic_sports=", ".join(archetype.paralympic_sports[:2]),
    )

    import queue, threading
    q: queue.Queue = queue.Queue()

    def _run():
        try:
            for chunk in client.models.generate_content_stream(
                model=FLASH_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=AGENT3_SYSTEM,
                    temperature=0.7,
                    max_output_tokens=300,
                ),
            ):
                if chunk.text:
                    q.put(chunk.text)
        finally:
            q.put(None)

    threading.Thread(target=_run, daemon=True).start()

    while True:
        item = await asyncio.to_thread(q.get)
        if item is None:
            break
        yield item


# ── Agent 4 — LA28 Predictor (Flash, runs in parallel with Agent 3) ──────────

AGENT4_TOOLS = [
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="get_archetype_sport_affinity",
                description="Get the ranked LA28 sports most aligned with a given archetype.",
                parameters=types.Schema(
                    type="OBJECT",
                    properties={
                        "archetype_id": types.Schema(type="STRING"),
                    },
                    required=["archetype_id"],
                ),
            ),
        ]
    )
]

AGENT4_SYSTEM = """You are Agent 4 (LA28 Predictor).
Call get_archetype_sport_affinity with the archetype_id.
Return the top recommendations as JSON:
{"la28_recommendations": [{"sport", "affinity_score", "historical_basis"}]}"""


async def run_agent4(archetype_id: str) -> dict:
    """Agent 4: LA28 recommendations — runs in parallel with Agent 3."""
    client = _make_client()

    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=FLASH_MODEL,
            contents=f"Get LA28 sport affinities for archetype_id='{archetype_id}'",
            config=types.GenerateContentConfig(
                system_instruction=AGENT4_SYSTEM,
                tools=AGENT4_TOOLS,
                temperature=0.1,
            ),
        )
        sports_data = None
        for part in response.candidates[0].content.parts:
            if part.function_call and part.function_call.name == "get_archetype_sport_affinity":
                sports_data = get_archetype_sport_affinity(
                    dict(part.function_call.args).get("archetype_id", archetype_id)
                )
    except Exception:
        sports_data = None

    if not sports_data:
        sports_data = get_archetype_sport_affinity(archetype_id)

    la28_all = {s["sport"]: s for s in get_la28_sports()}
    recommendations = []
    for item in sports_data[:4]:
        sport_info = la28_all.get(item["sport"], {})
        recommendations.append({
            "sport":           item["sport"],
            "affinity_score":  item["affinity_score"],
            "historical_basis": item["historical_basis"],
            "is_paralympic":   sport_info.get("paralympic", False),
            "is_olympic":      sport_info.get("olympic", True),
        })

    return {"la28_recommendations": recommendations}

