import os
from google import genai
from google.genai import types
from db import queries
from dotenv import load_dotenv

load_dotenv()

def get_medal_stats(noc: str = None, year: int = None, medal: str = None, sport: str = None):
    """
    Retrieves medal counts for a specific nation, year, medal type, or sport.
    Use this for questions like 'How many golds did USA win in 2008?'
    """
    return queries.get_medal_stats(noc, year, medal, sport)

def get_athlete_biometrics(noc: str = None, sport: str = None, sex: str = None):
    """
    Retrieves average height and weight of athletes.
    Use this for questions like 'What is the average height of US swimmers?'
    """
    return queries.get_athlete_biometrics(noc, sport, sex)

def get_sport_breakdown(noc: str = None, year: int = None):
    """
    Retrieves the top sports by medal count for a nation or year.
    Use this for questions like 'In which sports did USA win most medals in 1996?'
    """
    return queries.get_sport_breakdown(noc, year)

def get_top_nations(medal: str = None, sport: str = None, limit: int = 5):
    """
    Retrieves the top nations by medal count.
    Use this for questions like 'Which countries have the most gold medals in Athletics?'
    """
    return queries.get_top_nations(medal, sport, limit)

def get_athlete_age_stats(noc: str = None, sport: str = None, year: int = None):
    """
    Retrieves age statistics (min, max, avg) for athletes.
    Use this for questions like 'Who is the oldest US Olympian?' or 'Average age of US gymnasts?'
    """
    return queries.get_athlete_age_stats(noc, sport, year)

def get_gender_breakdown(noc: str = None, year: int = None):
    """
    Retrieves gender distribution of athletes.
    Use this for questions like 'How many women were on the US team in 2016?'
    """
    return queries.get_gender_breakdown(noc, year)

def get_games_summary(year: int, season: str = None):
    """
    Retrieves a summary of a specific Olympic games (athletes, nations, events).
    Use this for questions like 'How many athletes competed in London 2012?'
    """
    return queries.get_games_summary(year, season)

def get_sport_history(sport: str):
    """
    Retrieves historical context for a sport (first/last year, total medals).
    Use this for questions like 'When was volleyball first introduced to the Olympics?'
    """
    return queries.get_sport_history(sport)

def get_bmi_by_sport(noc: str = None, year: int = None):
    """
    Retrieves average BMI grouped by sport.
    Use this for questions like 'Which sports have the highest average BMI?'
    """
    return queries.get_bmi_by_sport(noc, year)

def get_custom_sql_data(sql: str):
    """
    Execute a dynamic SELECT query to answer complex questions.
    You may query ANY table or view in the database.
    The main view is: v_results_full (columns: id, name, sex, age, height_cm, weight_kg, noc, team_name, games, year, season, city, sport, event, medal)
    Other tables: athletes, events, results, sports, games, noc_regions
    Use this for athlete name searches, complex aggregations, cross-year stats, and any question the other tools cannot answer.
    Example: SELECT name, sport, year, medal FROM v_results_full WHERE name ILIKE '%Kobe%'
    Example: SELECT name, COUNT(*) as golds FROM v_results_full WHERE medal='Gold' AND noc='USA' GROUP BY name ORDER BY golds DESC LIMIT 10
    """
    return queries.execute_dynamic_query(sql)

# The tool definitions for Gemini
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

SYSTEM_PROMPT = """You are the Team USA Gemini Analyst — a precise, data-driven AI with access to a real PostgreSQL database containing 271,116 rows of Olympic history from 1896 to 2016.

CRITICAL RULES — FOLLOW EVERY SINGLE ONE:
1. YOU MUST ALWAYS CALL A TOOL BEFORE ANSWERING. Never say "I couldn't find" or "no data" without first calling a tool and getting real results.
2. ATHLETE NAME SEARCHES: When searching for an athlete by name (e.g., "LeBron James", "Kobe Bryant"), you MUST split the name and use multiple ILIKE clauses with AND (e.g., name ILIKE '%LeBron%' AND name ILIKE '%James%') because athletes often have middle names in the database.
3. MEDAL COUNT QUESTIONS: For "how many medals does USA have", call get_medal_stats with noc='USA'. For total medals across all time, call with no filters.
4. NEVER answer from your internal memory or training knowledge. The ONLY truth is what the database returns.
5. If a tool returns empty results, say exactly that: "The database has no records for [name] in the 1896-2016 dataset." Do NOT say "I couldn't find" without calling a tool first.
6. If data only goes to 2016, mention: "Based on the records available up to 2016..."
7. Be warm, inspiring, and data-confident. Reference the actual numbers returned by the tools.
8. For complex multi-year aggregations or ranked queries, use get_custom_sql_data with precise SQL.

EXAMPLES OF CORRECT BEHAVIOR:
- User: "How many medals does Kobe Bryant have?" → Call: get_custom_sql_data("SELECT name, sport, year, medal FROM v_results_full WHERE name ILIKE '%Kobe%' AND name ILIKE '%Bryant%'")
- User: "How many medals does USA have?" → Call: get_medal_stats(noc='USA')
- User: "Who won the most gold medals?" → Call: get_custom_sql_data("SELECT name, COUNT(*) as golds FROM v_results_full WHERE medal='Gold' GROUP BY name ORDER BY golds DESC LIMIT 10")

The ONLY reliable query target is the view v_results_full.
v_results_full columns: id, name, sex, age, height_cm, weight_kg, noc, team_name, games, year, season, city, sport, event, medal
Do NOT use any other table name — always use v_results_full for all custom SQL.
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
        print(f"🔮 Asking Oracle: {question}")
        chat = client.chats.create(
            model="gemini-2.5-flash",
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
        print(f"✅ Oracle Response: {response.text}")
        return response.text if response.text else "The analyst could not find a clear answer."
    except Exception as e:
        return f"Error communicating with Gemini: {str(e)}"
