import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from db.queries import get_medal_stats, get_top_nations

print("Testing get_medal_stats (USA Swimming Gold):")
print(get_medal_stats(noc="USA", sport="Swimming", medal="Gold"))

print("\nTesting get_top_nations (Top 3 for Gold):")
print(get_top_nations(medal="Gold", limit=3))
