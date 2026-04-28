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
    NAME SEARCH RULE: Split first/last name with AND ILIKE, e.g.:
        WHERE name ILIKE '%Kobe%' AND name ILIKE '%Bryant%'

    Examples:
      SELECT COUNT(*) FROM v_results_full WHERE noc='USA' AND year=2012 AND medal IS NOT NULL
      SELECT COUNT(*) FROM v_results_full WHERE noc='USA' AND year BETWEEN 2008 AND 2012 AND medal IS NOT NULL
      SELECT name, sport, year, medal FROM v_results_full WHERE name ILIKE '%Kobe%' AND name ILIKE '%Bryant%'
      SELECT name, COUNT(*) as golds FROM v_results_full WHERE medal='Gold' AND noc='USA' GROUP BY name ORDER BY golds DESC LIMIT 10
      SELECT sport, COUNT(*) as medals FROM v_results_full WHERE noc='USA' AND medal IS NOT NULL GROUP BY sport ORDER BY medals DESC LIMIT 5
    """
    return queries.execute_dynamic_query(sql)


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
    get_custom_sql_data
]


SYSTEM_PROMPT = """You are the Team USA Gemini Analyst — a precise, data-driven AI analyst with access to a real PostgreSQL database containing 271,116 rows of Olympic history from 1896 to 2016.

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

4. ATHLETE NAME SEARCHES — always split first + last name:
   • "LeBron James" → WHERE name ILIKE '%LeBron%' AND name ILIKE '%James%'
   • "Kobe Bryant" → WHERE name ILIKE '%Kobe%' AND name ILIKE '%Bryant%'
   • Reason: athletes have middle names stored (e.g., "LeBron Raymone James").

5. EMPTY RESULTS: If a tool returns 0 rows or empty, report that honestly:
   "The database has no records for [X] in the 1896–2016 dataset."
   Do NOT hallucinate or guess.

6. DATA COVERAGE: If the answer references data only through 2016, say:
   "Based on the Olympic records available from 1896 to 2016..."

7. MULTI-STEP PROBLEMS — call multiple tools then reason:
   • Comparison questions → query both sides → subtract/divide
   • Trend questions → query each year/period → describe the pattern
   • Percentage questions → query part + whole → calculate %
   • "Best era" questions → query multiple periods → compare

8. TONE: Warm, inspiring, data-confident. Always cite the actual numbers from tools.

═══ DATABASE REFERENCE ═══
Primary query surface: v_results_full
Columns: id, name, sex, age, height_cm, weight_kg, noc, team_name,
         year, season, city, sport, event, medal
medal values: 'Gold' | 'Silver' | 'Bronze' | NULL (did not medal)
Years covered: 1896–2016 (Summer Games only for most data)
USA filter: noc = 'USA'
"""


def ask_gemini(question: str, context: str = "", history: list = None):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "Error: GEMINI_API_KEY not found."

    client = genai.Client(api_key=api_key)

    final_system_prompt = SYSTEM_PROMPT
    if context:
        final_system_prompt += f"\n\n--- CONTEXT ABOUT THE CURRENT USER ---\n{context}"

    contents = []
    if history:
        for msg in history:
            role = "user" if msg.role == "user" else "model"
            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg.text)]))
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=question)]))

    try:
        print(f"🤖 Asking Gemini: {question}")
        chat = client.chats.create(
            model="gemini-3-flash-preview",
            history=contents[:-1] if len(contents) > 1 else None,
            config=types.GenerateContentConfig(
                system_instruction=final_system_prompt,
                tools=TOOLS,
                temperature=0.1,
                automatic_function_calling=types.AutomaticFunctionCallingConfig(
                    disable=False
                )
            )
        )

        response = chat.send_message(question)
        print(f"✅ Gemini Response: {response.text}")
        return response.text if response.text else "The analyst could not find a clear answer."
    except Exception as e:
        return f"Error communicating with Gemini: {str(e)}"
