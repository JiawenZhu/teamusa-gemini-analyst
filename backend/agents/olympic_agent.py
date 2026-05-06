import os
from google import genai
from google.genai import types
from db import queries
from dotenv import load_dotenv

load_dotenv()

# ── Tool functions (called automatically by Gemini function calling) ──────────

def get_medal_stats(noc: str = None, year: int = None, medal: str = None,
                    sport: str = None, year_from: int = None, year_to: int = None):
    """
    Count actual medals won (Gold, Silver, Bronze only — never counts non-medal rows).
    Use `year` for a single Games year (e.g. year=2012).
    Use `year_from` + `year_to` for a range (e.g. year_from=2008, year_to=2012 means ALL Games from 2008 through 2012 inclusive).
    Use `medal` to filter by 'Gold', 'Silver', or 'Bronze'.
    Returns: { medal_count: int }
    """
    return queries.get_medal_stats(noc, year, medal, sport, year_from, year_to)

def get_athlete_biometrics(noc: str = None, sport: str = None, sex: str = None):
    """
    Average height and weight of athletes in a sport or nation.
    Use for questions like 'What is the average height of US swimmers?'
    Returns: { avg_height, avg_weight, count }
    """
    return queries.get_athlete_biometrics(noc, sport, sex)

def get_sport_breakdown(noc: str = None, year: int = None):
    """
    Top sports by medal count for a nation or year.
    Use for questions like 'In which sports did USA win most medals in 1996?'
    Returns: list of { sport, medal_count }
    """
    return queries.get_sport_breakdown(noc, year)

def get_top_nations(medal: str = None, sport: str = None, limit: int = 5):
    """
    Top nations by medal count.
    Use for questions like 'Which countries have the most gold medals in Athletics?'
    Returns: list of { noc, team_name, medal_count }
    """
    return queries.get_top_nations(medal, sport, limit)

def get_athlete_age_stats(noc: str = None, sport: str = None, year: int = None):
    """
    Min, max, and avg age of athletes.
    Use for questions like 'Who is the oldest US Olympian?' or 'Average age of US gymnasts?'
    Returns: { min_age, max_age, avg_age, count }
    """
    return queries.get_athlete_age_stats(noc, sport, year)

def get_gender_breakdown(noc: str = None, year: int = None):
    """
    Count of Male vs Female athletes on a team.
    Use for questions like 'How many women were on the US team in 2016?'
    Returns: list of { sex, count }
    """
    return queries.get_gender_breakdown(noc, year)

def get_games_summary(year: int, season: str = None):
    """
    Summary of a specific Olympic Games (total athletes, nations, events, host city).
    Use for questions like 'How many athletes competed in London 2012?'
    Returns: { total_athletes, total_nations, total_events, city }
    """
    return queries.get_games_summary(year, season)

def get_sport_history(sport: str):
    """
    Historical context for a sport: first/last year it appeared, total medals awarded.
    Use for questions like 'When was volleyball first introduced to the Olympics?'
    Returns: { first_year, last_year, total_events, total_medals }
    """
    return queries.get_sport_history(sport)

def get_bmi_by_sport(noc: str = None, year: int = None):
    """
    Average BMI grouped by sport — useful for body-type comparisons.
    Returns: list of { sport, avg_bmi, count }
    """
    return queries.get_bmi_by_sport(noc, year)

def get_custom_sql_data(sql: str):
    """
    Execute any custom SELECT query against the database for questions that no other tool handles.
    ALWAYS target the view: v_results_full
    Columns: id, name, sex, age, height_cm, weight_kg, noc, team_name, year, season, city, sport, event, medal
    medal values: 'Gold', 'Silver', 'Bronze', or NULL (non-medalists)

    MEDAL COUNTING RULE: Always add WHERE medal IS NOT NULL when counting medals.
    YEAR RANGE RULE: Use BETWEEN or >= / <= for year ranges, e.g. year BETWEEN 2008 AND 2012.
    AGGREGATE ONLY: Queries must return aggregate statistics (counts, averages, totals).
    Do NOT write queries that SELECT individual athlete names or personal profiles.

    POSTGRESQL HAVING RULE — CRITICAL:
    PostgreSQL does NOT allow column aliases in HAVING clauses. NEVER write:
      HAVING avg_height_cm IS NOT NULL   ← ERROR: alias not allowed in HAVING
    Instead, filter NULLs in WHERE BEFORE grouping, or repeat the expression:
      WHERE height_cm IS NOT NULL AND weight_kg IS NOT NULL  ← CORRECT
      HAVING AVG(height_cm) > 0                              ← CORRECT (repeat expression)
    For BMI/biometric queries, ALWAYS filter nulls in WHERE, not HAVING.

    Examples:
      SELECT COUNT(*) FROM v_results_full WHERE noc='USA' AND year=2012 AND medal IS NOT NULL
      SELECT COUNT(*) FROM v_results_full WHERE noc='USA' AND year BETWEEN 2008 AND 2012 AND medal IS NOT NULL
      SELECT sport, COUNT(*) as medals FROM v_results_full WHERE noc='USA' AND medal IS NOT NULL GROUP BY sport ORDER BY medals DESC LIMIT 5
      SELECT year, COUNT(*) as golds FROM v_results_full WHERE medal='Gold' AND noc='USA' GROUP BY year ORDER BY year
      SELECT sport, AVG(height_cm) AS avg_height_cm, AVG(weight_kg) AS avg_weight_kg
        FROM v_results_full
        WHERE noc='USA' AND height_cm IS NOT NULL AND weight_kg IS NOT NULL
        GROUP BY sport ORDER BY avg_weight_kg DESC LIMIT 5
    """
    return queries.execute_dynamic_query(sql)



# Side-channel storage: automatic function calling handles the tool loop internally,
# so function_response parts never appear in the final response object.
# The tool stores its result here; ask_gemini reads it after the response returns.
_last_map_trigger: dict | None = None


def trigger_map_view(city_name: str):
    """
    Call this tool to fly the interactive 3D globe to a specific Olympic host city.
    Use whenever you mention a specific city that has hosted the Olympics or Paralympics.
    Also use when the user asks to "show me", "fly to", or "navigate to" a city.
    Examples: "Beijing", "Athens", "Los Angeles", "London", "Sydney", "Tokyo"
    Returns: { city, lat, lng, triggered: true }
    """
    global _last_map_trigger
    import httpx
    try:
        r = httpx.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": city_name, "format": "json", "limit": 1},
            headers={"User-Agent": "TeamUSA-Oracle/1.0"},
            timeout=5
        )
        results = r.json()
        if results:
            result = {"city": city_name, "lat": float(results[0]["lat"]), "lng": float(results[0]["lon"]), "triggered": True}
            _last_map_trigger = result
            return result
    except Exception:
        pass
    _last_map_trigger = None
    return {"city": city_name, "triggered": False}


# The tool list passed to Gemini
TOOLS = [
    get_medal_stats,
    get_athlete_biometrics,
    get_sport_breakdown,
    get_top_nations,
    get_athlete_age_stats,
    get_gender_breakdown,
    get_games_summary,
    get_sport_history,
    get_bmi_by_sport,
    get_custom_sql_data,
    trigger_map_view,
]


def _load_system_prompt() -> str:
    """Load system prompt from the versioned prompts/system_prompt.md file."""
    prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", "system_prompt.md")
    try:
        with open(os.path.normpath(prompt_path), "r", encoding="utf-8") as f:
            return f.read().strip()
    except FileNotFoundError:
        raise RuntimeError(
            f"System prompt not found at {prompt_path}. "
            "Ensure backend/prompts/system_prompt.md exists."
        )


SYSTEM_PROMPT = _load_system_prompt()


# ── LEGACY INLINE COPY (kept as reference, not used) ────────────────────────
_SYSTEM_PROMPT_INLINE_LEGACY = """You are the Team USA Gemini Analyst — a precise, data-driven AI analyst with access to a real Olympic database containing 271,116 rows of verified historical records (1896–2016 Olympic Games, public Kaggle dataset).

═══ PRIVACY & ATTRIBUTION RULES (HIGHEST PRIORITY — NEVER OVERRIDE) ═══

• NO INDIVIDUAL ATHLETES: Never name, profile, quote, or describe any specific living or deceased athlete. Do not reference personal biometrics, finish times, specific scores, or individual career histories.
• AGGREGATE ONLY: Refer exclusively to aggregate Team USA records, era-level patterns, sport-level statistics, and anonymized historical trends.
• NO LIKENESSES: Do not describe an athlete's appearance, style, or personal story.
• DATA WINDOW: This dataset covers Olympic Games through the 2016 Rio Games. If asked about 2020, 2024, or 2028, clearly state: "Our records go up to the 2016 Rio Games — we don't have data for that period yet."
• CONDITIONAL LANGUAGE: When connecting user biometrics to historical patterns, always use conditional phrasing: "athletes with similar builds have historically tended to…" not "you are exactly like…" or "legends share your build."

═══ YOUR THINKING PROCESS ═══
For EVERY question, follow this exact sequence:

  STEP 1 — UNDERSTAND the question fully. Identify:
    • What data is needed? (counts, names, ranges, comparisons, calculations)
    • Does it require a single query or multiple queries?
    • Is there arithmetic to do after fetching data (differences, percentages, ratios)?

  STEP 2 — GATHER data using tools. Rules:
    • ALWAYS call at least one tool before responding.
    • If a question needs data from multiple angles, call multiple tools.
    • If no structured tool fits the question, use get_custom_sql_data with precise SQL.

  STEP 3 — CALCULATE & REASON on the tool results.
    • If the answer requires arithmetic (e.g. "how many MORE medals", "what percentage",
      "difference between years"), do that math yourself from the returned numbers.
    • Example: "How many more medals did USA win in 2012 vs 2008?"
        → Call get_medal_stats(noc='USA', year=2012) → get 104
        → Call get_medal_stats(noc='USA', year=2008) → get 110
        → Calculate: 104 - 110 = -6. USA won 6 fewer medals in 2012 than 2008.
    • Example: "What % of USA's medals came from swimming?"
        → Call get_medal_stats(noc='USA') → total = 2638
        → Call get_sport_breakdown(noc='USA') → swimming = 892
        → Calculate: 892 / 2638 * 100 = 33.8%

  STEP 4 — ANSWER with confidence using the actual numbers from the database.

═══ CRITICAL RULES ═══

1. ALWAYS CALL A TOOL FIRST. Never answer from memory or training knowledge.
   The ONLY truth is what the database returns.

2. MEDAL COUNTING — the #1 bug to avoid:
   • get_medal_stats() ALREADY filters medal IS NOT NULL automatically.
   • When writing custom SQL for medal counts, ALWAYS add: WHERE medal IS NOT NULL
   • Never count all rows and call it "medals" — most rows are non-medal participations.

3. YEAR RANGES — use the right approach:
   • Single year: get_medal_stats(noc='USA', year=2012)
   • Year range: get_medal_stats(noc='USA', year_from=2008, year_to=2012)
     OR use get_custom_sql_data: "... AND year BETWEEN 2008 AND 2012 AND medal IS NOT NULL"
   • "From 2008 to 2012" means INCLUSIVE of both 2008 and 2012 Games.

4. AGGREGATE-ONLY QUERIES — never select individual athlete rows:
   • Do NOT run queries that return specific athlete names, personal biometrics, or individual results.
   • All SQL must return aggregated data: COUNT, AVG, SUM, GROUP BY, etc.
   • If the user asks about a named athlete, decline politely and offer aggregate data instead:
     "I can't provide individual athlete profiles, but I can tell you how Team USA performed in [sport] in [year] overall."

14. POSTGRESQL HAVING RULE — NEVER use SELECT aliases in HAVING:
    PostgreSQL does NOT allow referencing a column alias from SELECT inside HAVING.
    ❌ BAD:  SELECT AVG(height_cm) AS avg_h ... HAVING avg_h IS NOT NULL
    ✅ GOOD: Filter nulls in WHERE before grouping:
             WHERE height_cm IS NOT NULL AND weight_kg IS NOT NULL
    ✅ GOOD: Repeat the full expression in HAVING if needed:
             HAVING AVG(weight_kg) > 0
    For ALL biometric / BMI queries, ALWAYS filter height_cm IS NOT NULL AND weight_kg IS NOT NULL in the WHERE clause, never in HAVING.


5. EMPTY RESULTS: If a tool returns 0 rows or empty, report that honestly:
   "Our dataset has no records for [X]." Do NOT hallucinate or guess.

6. DATA COVERAGE — IMPORTANT LANGUAGE RULE:
   NEVER say "1896–2016" or repeat the year range in your response unless the user
   specifically asks about the dataset's coverage or time range.
   Instead, refer to the data professionally:
   ✅ "According to our records..."
   ✅ "Our Olympic database shows..."
   ✅ "Based on the data we have..."
   ✅ "Historically, across all Olympic Games in our database..."
   ❌ "Based on the Olympic records available from 1896 to 2016..."
   ❌ "In the 1896–2016 dataset..."
   The dataset covers Olympic Games through 2016. If a user asks about
   more recent Games (2020, 2024), clearly state: "Our records go up to the 2016
   Rio Games — we don't have data for [year] yet."

7. MULTI-STEP PROBLEMS — call multiple tools then reason:
   • Comparison questions → query both sides → subtract/divide
   • Trend questions → query each year/period → describe the pattern
   • Percentage questions → query part + whole → calculate %
   • "Best era" questions → query multiple periods → compare

8. TONE: Warm, inspiring, data-confident. Always cite the actual numbers from tools.

9. MAP CONTROL — Use trigger_map_view when:
   • You mention a specific Olympic or Paralympic host city in your response
   • The user says "show me", "fly to", "where is", "navigate to" + a city
   • You are discussing country data where a specific host city is relevant
   Call trigger_map_view(city_name) silently — the result will animate the globe for the user.
   Examples: Beijing 2008 → trigger_map_view("Beijing"), Sydney 2000 → trigger_map_view("Sydney")

10. OFFICIAL GAMES TERMINOLOGY — ALWAYS follow these naming rules:
    Summer Games (non-LA): "Olympic Games [City] [Year]" (e.g., "Olympic Games Beijing 2008", "Olympic Games Atlanta 1996")
    Winter Games: "Olympic Winter Games [City] [Year]" (e.g., "Olympic Winter Games Lake Placid 1980")
    Paralympic Winter Games: "Paralympic Winter Games [City] [Year]"
    2028 Los Angeles Games: "LA28 Games" or "LA28 Olympic and Paralympic Games"
    NEVER say: "2008 Summer Games", "Summer Olympics", "Winter Olympics", "2008 Summer Olympics"
    ALLOWED secondary references: "The Winter Olympics" or "[City] [Year]" (e.g., "Beijing 2008")

11. OLYMPIAN / PARALYMPIAN LANGUAGE:
    Once an athlete is an Olympian or Paralympian, they are ALWAYS one.
    NEVER use "former Olympian", "past Olympian", "former Paralympian", or "past Paralympian".

12. SPORT NAMES — use official sport names, not NGB names:
    ✅ "swimming" ❌ "USA Swimming"
    ✅ "gymnastics" ❌ "USA Gymnastics"
    ✅ "basketball" ❌ "USA Basketball"
    ✅ "ice hockey" ❌ "USA Hockey"

13. NO REPEATED ANSWERS — Never repeat or rephrase an answer you already gave in this conversation.
    If the same question is asked again, acknowledge you already covered it and offer a new angle or related stat.

═══ DATABASE REFERENCE ═══
Primary query surface: v_results_full
Columns: id, name, sex, age, height_cm, weight_kg, noc, team_name,
         year, season, city, sport, event, medal
medal values: 'Gold' | 'Silver' | 'Bronze' | NULL (did not medal)
Coverage: Olympic Games (most complete data)
USA filter: noc = 'USA'
"""


def ask_gemini(question: str, context: str = "", history: list = None):
    client = genai.Client(vertexai=True, project="teamusa-8b1ba", location="global")

    final_system_prompt = SYSTEM_PROMPT
    if context:
        final_system_prompt += f"\n\n--- CONTEXT ABOUT THE CURRENT USER ---\n{context}"

    contents = []
    if history:
        for msg in history:
            role = "user" if msg.role == "user" else "model"
            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg.text)]))
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=question)]))

    # Only keep the last 6 messages (3 exchanges) to avoid stale thought signatures
    # that accumulate in longer conversations and trigger 400 INVALID_ARGUMENT
    safe_history = contents[:-1][-6:] if len(contents) > 1 else None

    def _call_gemini(history_to_use):
        chat = client.chats.create(
            model="gemini-3-flash-preview",
            history=history_to_use,
            config=types.GenerateContentConfig(
                system_instruction=final_system_prompt,
                tools=TOOLS,
                temperature=0.1,
                automatic_function_calling=types.AutomaticFunctionCallingConfig(
                    disable=False
                )
            )
        )
        return chat.send_message(question)

    try:
        print(f"🤖 Asking Gemini: {question}")
        try:
            response = _call_gemini(safe_history)
        except Exception as first_err:
            err_str = str(first_err)
            # "Corrupted thought signature" or similar history-related 400 errors
            if "400" in err_str or "thought" in err_str.lower() or "signature" in err_str.lower() or "INVALID_ARGUMENT" in err_str:
                print(f"⚠️ History caused {err_str[:80]} — retrying without history")
                response = _call_gemini(None)
            else:
                raise

        response_text = response.text if response.text else "The analyst could not find a clear answer."
        print(f"✅ Gemini Response: {response_text[:120]}...")

        # Feature B: read the map trigger stored by trigger_map_view during automatic function calling
        map_trigger = None
        global _last_map_trigger
        if _last_map_trigger and _last_map_trigger.get("triggered"):
            map_trigger = {
                "city": _last_map_trigger["city"],
                "lat": _last_map_trigger["lat"],
                "lng": _last_map_trigger["lng"],
            }
        _last_map_trigger = None  # reset for next call
        print(f"🌍 Map trigger: {map_trigger}")

        return response_text, map_trigger
    except Exception as e:
        return f"Error communicating with Gemini: {str(e)}", None

import asyncio
import json

async def handle_live_session(websocket, archetype_id: str = None):

    # Feature: Sync context with text chat
    from data.public_data import get_all_archetypes
    archs = {a["id"]: a for a in get_all_archetypes()}
    arch = archs.get(archetype_id, {})
    
    live_system_instruction = SYSTEM_PROMPT
    if arch:
        context = f"""
--- USER BIOMETRIC CONTEXT (Sync with Text Chat) ---
The user's biometric profile aligns with: {arch.get('label', archetype_id)} ({arch.get('description', '')})
Historically associated sports: {', '.join(arch.get('olympic_sports', [])[:4])}
Paralympic sport alignment: {', '.join(arch.get('paralympic_sports', [])[:3])}
Always use conditional phrasing.
"""
        live_system_instruction += context

    # v1beta1 is required for gemini-3.1-flash-live-preview
    client = genai.Client(
        vertexai=True, project="teamusa-8b1ba", location="us-central1",
        http_options={"api_version": "v1beta1"},
    )

    config = types.LiveConnectConfig(
        system_instruction=types.Content(parts=[types.Part.from_text(text=live_system_instruction)]),
        tools=TOOLS,
        response_modalities=["AUDIO"],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Aoede")
            )
        ),
        # Enable input transcription so we can intercept user speech and route
        # analytical questions through the SQL-backed ask_gemini engine.
        input_audio_transcription=types.AudioTranscriptionConfig(),
        # Enable output transcription so we can show the agent's spoken words
        # as text in the glassmorphism chat overlay.
        output_audio_transcription=types.AudioTranscriptionConfig(),
    )

    try:
        # The frontend used gemini-live-2.5-flash-native-audio
        target_model = "gemini-live-2.5-flash-native-audio"
        async with client.aio.live.connect(model=target_model, config=config) as session:
            print(f"Connected to Gemini Live API ({target_model})")
            await websocket.send_json({"type": "status", "message": "connected"})

            audio_input_queue = asyncio.Queue()
            text_input_queue = asyncio.Queue()

            # ── Task 1: Receive from browser WebSocket ─────────────────────────
            async def receive_from_client():
                audio_chunks_received = 0
                try:
                    while True:
                        message = await websocket.receive()

                        if message["type"] == "websocket.disconnect":
                            print(f"Client disconnected")
                            break

                        if message.get("bytes"):
                            data = message["bytes"]
                            audio_chunks_received += 1
                            if audio_chunks_received % 100 == 1:
                                import struct
                                samples = struct.unpack(f"<{len(data)//2}h", data[:(len(data)//2)*2])
                                max_amp = max(abs(s) for s in samples) if samples else 0
                                print(f"[Audio chunk #{audio_chunks_received}]: {len(data)}B max_amp={max_amp}")
                            await audio_input_queue.put(data)

                        elif message.get("text"):
                            try:
                                payload = json.loads(message["text"])
                                msg_type = payload.get("type")
                                if msg_type == "text_query":
                                    text = payload.get("text", "").strip()
                                    if text:
                                        print(f"[Client text]: {text}")
                                        await text_input_queue.put(text)
                            except json.JSONDecodeError:
                                pass
                except Exception as e:
                    print(f"receive_from_client error: {e}")
                finally:
                    await audio_input_queue.put(None)
                    await text_input_queue.put(None)

            # ── Task 2: Forward browser audio → Gemini ─────────────────────────
            async def send_audio_to_gemini():
                try:
                    # Kick off conversation with a text greeting
                    print("Sending initial greeting...")
                    await session.send_client_content(
                        turns=types.Content(
                            role="user",
                            parts=[types.Part.from_text(text="Hello! Please greet the user and offer to help with Olympic history or globe navigation.")]
                        ),
                        turn_complete=True
                    )
                    print("Initial greeting sent.")

                    while True:
                        data = await audio_input_queue.get()
                        if data is None:
                            break
                        try:
                            # mime_type must be plain "audio/pcm" (no rate suffix)
                            await session.send_realtime_input(
                                media=types.Blob(data=data, mime_type="audio/pcm")
                            )
                        except Exception as e:
                            print(f"send_audio error: {e}")
                except Exception as e:
                    print(f"send_audio_to_gemini fatal: {e}")
                    import traceback; traceback.print_exc()

            # ── Task 3: Forward text queries → Gemini ──────────────────────────
            async def send_text_to_gemini():
                try:
                    while True:
                        text = await text_input_queue.get()
                        if text is None:
                            break
                        try:
                            await session.send_client_content(
                                turns=types.Content(
                                    role="user",
                                    parts=[types.Part.from_text(text=text)]
                                ),
                                turn_complete=True
                            )
                        except Exception as e:
                            print(f"send_text error: {e}")
                except Exception as e:
                    print(f"send_text_to_gemini fatal: {e}")

            # ── Task 4: Receive Gemini responses → browser ─────────────────────
            # HYBRID ARCHITECTURE:
            # The live audio model is great for voice I/O but does not reliably
            # invoke SQL function calls for complex analytical questions.
            # Fix: enable input_audio_transcription so we get the user's spoken words
            # as text. When a full user turn is transcribed, we run it through
            # ask_gemini() (the SQL-backed chat engine) in a thread, then inject
            # the DB-grounded answer back into the live session so Gemini speaks it.
            async def receive_from_gemini():
                chunk_count = 0
                pending_transcript: list = []  # accumulate transcript fragments
                db_inject_lock = asyncio.Lock()
                db_tasks: set[asyncio.Task] = set()  # track background inject tasks
                db_inject_in_flight = False  # suppress duplicate output_transcription when DB answer is pending

                async def run_db_and_inject(question: str):
                    """Run the real SQL engine and inject the grounded answer."""
                    nonlocal db_inject_in_flight
                    async with db_inject_lock:
                        db_inject_in_flight = True
                        print(f"[DB hybrid] SQL query for: {question!r}")
                        loop = asyncio.get_event_loop()
                        try:
                            answer, map_trigger = await loop.run_in_executor(
                                None, lambda: ask_gemini(question, context="", history=[])
                            )
                        except Exception as e:
                            answer = f"I'm sorry, I had trouble looking that up. {e}"
                            map_trigger = None

                        print(f"[DB hybrid] Answer ({len(answer)} chars): {answer[:120]}...")

                        # Send map trigger to browser
                        if map_trigger and map_trigger.get("lat"):
                            try:
                                await websocket.send_json({
                                    "type": "map_trigger",
                                    "city": map_trigger["city"],
                                    "lat": map_trigger["lat"],
                                    "lng": map_trigger["lng"],
                                })
                            except Exception:
                                pass

                        # Send the DB-grounded answer as the single authoritative text
                        # (output_transcription is suppressed while db_inject_in_flight to avoid duplication)
                        try:
                            await websocket.send_json({"type": "live_text", "text": answer})
                        except RuntimeError as e:
                            if "Unexpected ASGI message" in str(e):
                                db_inject_in_flight = False
                                return  # Client disconnected
                            pass
                        except Exception:
                            pass

                        # Inject the DB answer back so Gemini speaks it
                        inject_prompt = (
                            f"The database returned this verified answer for '{question}':\n\n"
                            f"{answer}\n\n"
                            f"Please read this exact answer to the user naturally. "
                            f"CRITICAL RULES: Do NOT add any filler words. Do NOT ask any follow up questions. "
                            f"Do NOT repeat yourself. Just read the answer and stop."
                        )
                        try:
                            await session.send_client_content(
                                turns=types.Content(
                                    role="user",
                                    parts=[types.Part.from_text(text=inject_prompt)]
                                ),
                                turn_complete=True,
                            )
                        except Exception as e:
                            print(f"[DB hybrid] inject error: {e}")
                        finally:
                            db_inject_in_flight = False

                try:
                    while True:
                        async for response in session.receive():
                            sc = response.server_content

                            # ── Output transcript: what the agent is saying ────────
                            # Suppress when a DB inject is in flight to avoid duplicating
                            # the grounded answer that was already sent as live_text.
                            if sc and getattr(sc, "output_transcription", None) and not db_inject_in_flight:
                                agent_text = getattr(sc.output_transcription, "text", "") or ""
                                if agent_text.strip():
                                    print(f"[Agent transcript]: {agent_text!r}")
                                    try:
                                        await websocket.send_json({"type": "live_text", "text": agent_text})
                                    except RuntimeError:
                                        return  # Client disconnected

                            # ── Input transcript: what the user said ───────────────
                            if sc and getattr(sc, "input_transcription", None):
                                transcript_text = getattr(sc.input_transcription, "text", "") or ""
                                if transcript_text.strip():
                                    pending_transcript.append(transcript_text)
                                    print(f"[User transcript chunk]: {transcript_text!r}")
                                    # Send interim chunk → shows real-time transcription in UI
                                    try:
                                        await websocket.send_json({"type": "user_text_interim", "text": transcript_text})
                                    except RuntimeError:
                                        return

                            # Full user turn transcribed → route through DB
                            if sc and getattr(sc, "input_transcription_complete", False):
                                full_question = " ".join(pending_transcript).strip()
                                pending_transcript.clear()
                                if full_question:
                                    if db_inject_lock.locked():
                                        print(f"[User said (ignored, db running)]: {full_question!r}")
                                        continue
                                    
                                    print(f"[User said (complete)]: {full_question!r}")
                                    # Send user speech to browser for display in chat overlay
                                    try:
                                        await websocket.send_json({"type": "user_text", "text": full_question})
                                    except RuntimeError:
                                        return
                                    task = asyncio.create_task(run_db_and_inject(full_question))
                                    db_tasks.add(task)
                                    task.add_done_callback(db_tasks.discard)

                            # ── Audio output from Gemini → browser ─────────────────
                            if sc and sc.model_turn:
                                for part in sc.model_turn.parts:
                                    if part.inline_data and part.inline_data.data:
                                        chunk_count += 1
                                        if chunk_count <= 5:
                                            print(f"[Gemini audio #{chunk_count}]: {len(part.inline_data.data)}B")
                                        try:
                                            await websocket.send_bytes(part.inline_data.data)
                                        except RuntimeError as e:
                                            if "Unexpected ASGI message" in str(e):
                                                break # Client disconnected
                                    if part.text:
                                        print(f"[Gemini text]: {part.text}")
                                        try:
                                            await websocket.send_json({"type": "live_text", "text": part.text})
                                        except RuntimeError as e:
                                            if "Unexpected ASGI message" in str(e):
                                                break # Client disconnected

                            if sc and sc.turn_complete:
                                print("[Gemini] Turn complete.")
                                try:
                                    await websocket.send_json({"type": "turn_complete"})
                                except RuntimeError:
                                    pass

                            # ── Tool calls (map nav + any direct DB calls) ──────────
                            if response.tool_call:
                                fn_responses = []
                                for func_call in response.tool_call.function_calls:
                                    name = func_call.name
                                    args = dict(func_call.args) if func_call.args else {}
                                    print(f"Live tool: {name}({args})")
                                    func = next((t for t in TOOLS if getattr(t, '__name__', None) == name), None)
                                    if func:
                                        try:
                                            result = func(**args) if args else func()
                                            if name == "trigger_map_view" and isinstance(result, dict) and result.get("triggered"):
                                                await websocket.send_json({
                                                    "type": "map_trigger",
                                                    "city": result.get("city"),
                                                    "lat": result.get("lat"),
                                                    "lng": result.get("lng"),
                                                })
                                            fn_responses.append(types.FunctionResponse(
                                                name=name,
                                                id=func_call.id,
                                                response={"result": result},
                                            ))
                                        except Exception as tool_err:
                                            fn_responses.append(types.FunctionResponse(
                                                name=name,
                                                id=func_call.id,
                                                response={"error": str(tool_err)},
                                            ))
                                if fn_responses:
                                    await session.send_tool_response(function_responses=fn_responses)
                except asyncio.CancelledError:
                    # Normal shutdown when tasks are cancelled
                    pass
                except RuntimeError as e:
                    # "Unexpected ASGI message" means client already closed — not an error
                    if "Unexpected ASGI message" not in str(e):
                        import traceback
                        with open("ws_debug.log", "a") as f:
                            f.write(f"receive_from_gemini error: {e}\n{traceback.format_exc()}\n")
                        print(f"receive_from_gemini error: {e}")
                except Exception as e:
                    err_str = str(e)
                    # Treat clean Gemini 1000 'operation cancelled' as graceful close
                    if "1000" in err_str and "operation was cancelled" in err_str.lower():
                        print("[Gemini] Session ended cleanly (1000).")
                        return
                    import traceback
                    with open("ws_debug.log", "a") as f:
                        f.write(f"receive_from_gemini error: {e}\n{traceback.format_exc()}\n")
                    print(f"receive_from_gemini error: {e}")
                    traceback.print_exc()

            # Run all tasks concurrently — receive_from_gemini blocks the main coroutine
            receive_task = asyncio.create_task(receive_from_client())
            send_audio_task = asyncio.create_task(send_audio_to_gemini())
            send_text_task = asyncio.create_task(send_text_to_gemini())

            try:
                await receive_from_gemini()
            finally:
                receive_task.cancel()
                send_audio_task.cancel()
                send_text_task.cancel()
                # Cancel any still-running DB inject tasks so uvicorn can restart cleanly
                for t in list(db_tasks):
                    t.cancel()
                print("[Session] All tasks cancelled.")

    except Exception as e:
        import traceback
        with open("ws_debug.log", "a") as f:
            f.write(f"Live API error: {type(e).__name__}: {e}\n{traceback.format_exc()}\n")
        print(f"Live API error: {type(e).__name__}: {e}")
        traceback.print_exc()
        try:
            await websocket.close(code=1011)
        except Exception:
            pass
