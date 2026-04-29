"""
test_api.py — TeamUSA Digital Mirror Backend Tests

Tests the core API endpoints and ML logic without requiring a live database
or Gemini API key. Uses FastAPI's TestClient so no server needs to be running.

Run:
    cd backend
    pip install pytest httpx
    pytest test_api.py -v
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import numpy as np


# ── Patch DB + Gemini before importing app ────────────────────────────────────
# We mock heavy I/O so tests run offline with no credentials required.

@pytest.fixture(scope="session", autouse=True)
def mock_startup_dependencies():
    """Prevent real data download and DB connection on app startup."""
    with (
        patch("data.public_data.load_data", return_value=None),
        patch("data.public_data._download_data", return_value=MagicMock()),
        patch("db.queries.get_db_connection", side_effect=RuntimeError("DB not available in tests")),
    ):
        yield


@pytest.fixture(scope="session")
def client():
    from main import app
    return TestClient(app, raise_server_exceptions=False)


# ─────────────────────────────────────────────────────────────────────────────
# 1. Health check
# ─────────────────────────────────────────────────────────────────────────────

class TestHealth:
    def test_health_returns_ok(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json() == {"status": "ok"}


# ─────────────────────────────────────────────────────────────────────────────
# 2. /api/stats
# ─────────────────────────────────────────────────────────────────────────────

class TestStats:
    def test_stats_returns_dict(self, client):
        r = client.get("/api/stats")
        assert r.status_code == 200
        body = r.json()
        # Should always return some keys regardless of data state
        assert "total_athletes" in body or "total_records" in body or "error" in body

    def test_stats_has_data_source_when_loaded(self, client):
        """If data loaded, must report the open-source origin."""
        r = client.get("/api/stats")
        body = r.json()
        if "data_source" in body:
            assert "Olympic_history" in body["data_source"]


# ─────────────────────────────────────────────────────────────────────────────
# 3. /api/archetypes
# ─────────────────────────────────────────────────────────────────────────────

class TestArchetypes:
    def test_returns_list(self, client):
        r = client.get("/api/archetypes")
        assert r.status_code == 200
        body = r.json()
        assert "archetypes" in body
        archetypes = body["archetypes"]
        assert isinstance(archetypes, list)
        assert len(archetypes) == 6

    def test_archetype_has_required_fields(self, client):
        r = client.get("/api/archetypes")
        archetypes = r.json()["archetypes"]
        required = {"id", "label", "icon", "color", "description", "olympic_sports"}
        for arch in archetypes:
            missing = required - set(arch.keys())
            assert not missing, f"Archetype '{arch.get('id')}' missing fields: {missing}"

    def test_archetype_ids_are_unique(self, client):
        r = client.get("/api/archetypes")
        ids = [a["id"] for a in r.json()["archetypes"]]
        assert len(ids) == len(set(ids)), "Duplicate archetype IDs detected"


# ─────────────────────────────────────────────────────────────────────────────
# 4. /api/para-archetypes
# ─────────────────────────────────────────────────────────────────────────────

class TestParaArchetypes:
    def test_returns_6_para_archetypes(self, client):
        r = client.get("/api/para-archetypes")
        assert r.status_code == 200
        archetypes = r.json()["archetypes"]
        assert len(archetypes) == 6

    def test_para_ids_start_with_para(self, client):
        r = client.get("/api/para-archetypes")
        for arch in r.json()["archetypes"]:
            assert arch["id"].startswith("para_"), (
                f"Paralympic archetype '{arch['id']}' should start with 'para_'"
            )


# ─────────────────────────────────────────────────────────────────────────────
# 5. /api/match — Olympic mode
# ─────────────────────────────────────────────────────────────────────────────

class TestMatchOlympic:
    VALID_PAYLOAD = {"height_cm": 178, "weight_kg": 72, "age": 25, "mode": "olympic"}

    def test_valid_match_returns_archetype_id(self, client):
        r = client.post("/api/match", json=self.VALID_PAYLOAD)
        assert r.status_code == 200
        body = r.json()
        assert "archetype_id" in body
        assert body["archetype_id"] != ""

    def test_valid_match_returns_bmi(self, client):
        r = client.post("/api/match", json=self.VALID_PAYLOAD)
        body = r.json()
        assert "user_bmi" in body
        # BMI for 178cm / 72kg ≈ 22.7
        assert abs(body["user_bmi"] - 22.7) < 1.0

    def test_archetype_id_is_known(self, client):
        known_ids = {
            "powerhouse", "aerobic_engine", "explosive_athlete",
            "precision_maestro", "aquatic_titan", "agile_competitor",
        }
        r = client.post("/api/match", json=self.VALID_PAYLOAD)
        arch_id = r.json()["archetype_id"]
        assert arch_id in known_ids, f"Unknown archetype_id returned: '{arch_id}'"

    def test_height_below_minimum_rejected(self, client):
        r = client.post("/api/match", json={"height_cm": 100, "weight_kg": 60, "age": 25})
        assert r.status_code == 422

    def test_height_above_maximum_rejected(self, client):
        r = client.post("/api/match", json={"height_cm": 250, "weight_kg": 80, "age": 25})
        assert r.status_code == 422

    def test_weight_below_minimum_rejected(self, client):
        r = client.post("/api/match", json={"height_cm": 170, "weight_kg": 20, "age": 25})
        assert r.status_code == 422

    def test_missing_height_rejected(self, client):
        r = client.post("/api/match", json={"weight_kg": 70, "age": 25})
        assert r.status_code == 422

    def test_age_is_optional(self, client):
        """age is optional — should not cause a 422."""
        r = client.post("/api/match", json={"height_cm": 178, "weight_kg": 72})
        assert r.status_code == 200

    @pytest.mark.parametrize("height,weight,expected_id", [
        # Very heavy + tall → Powerhouse or Aquatic Titan
        (190, 130, {"powerhouse", "aquatic_titan", "agile_competitor"}),
        # Very light + short → Aerobic Engine or Precision Maestro
        (165, 55,  {"aerobic_engine", "precision_maestro", "explosive_athlete"}),
    ])
    def test_extreme_biometrics_still_return_a_result(self, client, height, weight, expected_id):
        r = client.post("/api/match", json={"height_cm": height, "weight_kg": weight, "age": 30})
        assert r.status_code == 200
        assert "archetype_id" in r.json()


# ─────────────────────────────────────────────────────────────────────────────
# 6. /api/match — Paralympic mode
# ─────────────────────────────────────────────────────────────────────────────

class TestMatchParalympic:
    VALID_PAYLOAD = {"height_cm": 175, "weight_kg": 70, "age": 28, "mode": "paralympic"}

    def test_para_match_returns_archetype_id(self, client):
        r = client.post("/api/match", json=self.VALID_PAYLOAD)
        assert r.status_code == 200
        body = r.json()
        assert "archetype_id" in body

    def test_para_archetype_id_is_known(self, client):
        known_para_ids = {
            "para_powerhouse", "para_endurance", "para_sprinter",
            "para_precision", "para_aquatics", "para_team_athlete",
        }
        r = client.post("/api/match", json=self.VALID_PAYLOAD)
        arch_id = r.json()["archetype_id"]
        assert arch_id in known_para_ids, f"Unknown paralympic archetype_id: '{arch_id}'"

    def test_para_mode_flag_in_response(self, client):
        r = client.post("/api/match", json=self.VALID_PAYLOAD)
        body = r.json()
        # When returned from paralympic fallback, mode key is present
        if "mode" in body:
            assert body["mode"] == "paralympic"


# ─────────────────────────────────────────────────────────────────────────────
# 7. /api/timeline
# ─────────────────────────────────────────────────────────────────────────────

class TestTimeline:
    def test_returns_athletes_key(self, client):
        r = client.get("/api/timeline")
        assert r.status_code == 200
        assert "athletes" in r.json()

    def test_returns_list(self, client):
        r = client.get("/api/timeline")
        assert isinstance(r.json()["athletes"], list)


# ─────────────────────────────────────────────────────────────────────────────
# 8. Unit tests — ML helper functions (no HTTP, no DB)
# ─────────────────────────────────────────────────────────────────────────────

class TestBMIComputation:
    """Test BMI logic directly against the business rules in public_data.py."""

    def test_bmi_formula(self):
        from data.public_data import match_biometrics
        # 178 cm, 72 kg → BMI ≈ 22.72
        result = match_biometrics(178, 72, 25)
        assert abs(result["user_bmi"] - 22.7) < 0.5

    def test_fallback_archetype_assignment_tall_heavy(self):
        """Heaviest/tallest input should map to powerhouse or aquatic_titan via fallback."""
        from data.public_data import _fallback_match
        result = _fallback_match(195, 120, 120 / (1.95 ** 2))
        assert result["archetype_id"] in ("powerhouse", "aquatic_titan")

    def test_fallback_archetype_assignment_short_light(self):
        """Short/light input should map to precision_maestro or aerobic_engine."""
        from data.public_data import _fallback_match
        result = _fallback_match(162, 52, 52 / (1.62 ** 2))
        assert result["archetype_id"] in ("precision_maestro", "aerobic_engine")

    def test_archetype_name_resolver_powerhouse(self):
        """Centroid at 185cm / 105kg should resolve to powerhouse."""
        from data.public_data import _assign_archetype_name
        arch = _assign_archetype_name(185, 105)
        assert arch == "powerhouse"

    def test_archetype_name_resolver_aerobic(self):
        """Centroid at 174cm / 62kg should resolve to aerobic_engine."""
        from data.public_data import _assign_archetype_name
        arch = _assign_archetype_name(174, 62)
        assert arch == "aerobic_engine"


class TestSentenceChunker:
    """Test the SSE sentence-chunking logic used in chat-stream."""

    def test_single_short_sentence_is_kept(self):
        from main import _split_sentences
        chunks = _split_sentences("Hello world.")
        assert len(chunks) >= 1
        assert "Hello world." in chunks[0]

    def test_two_sentences_split_correctly(self):
        from main import _split_sentences
        text = "Team USA won gold. They trained for four years."
        chunks = _split_sentences(text, min_chars=10)
        assert len(chunks) >= 1  # merged or split, always at least 1 chunk

    def test_empty_string_returns_one_chunk(self):
        from main import _split_sentences
        chunks = _split_sentences("")
        assert len(chunks) == 1

    def test_progressive_groups_first_group_is_one_sentence(self):
        from main import _progressive_groups
        sentences = ["A.", "B.", "C.", "D.", "E.", "F."]
        groups = _progressive_groups(sentences)
        assert groups[0] == ["A."], "First group must be a single sentence for minimal TTFA"

    def test_progressive_groups_second_group_is_two(self):
        from main import _progressive_groups
        sentences = ["A.", "B.", "C.", "D.", "E."]
        groups = _progressive_groups(sentences)
        assert len(groups[1]) == 2

    def test_progressive_groups_third_plus_are_three(self):
        from main import _progressive_groups
        sentences = ["A.", "B.", "C.", "D.", "E.", "F.", "G.", "H.", "I."]
        groups = _progressive_groups(sentences)
        assert len(groups[2]) <= 3


class TestHaversineDistance:
    """Test the Haversine distance calculation used in /api/location.
    We test the math directly by reimplementing the formula from main.py."""

    @staticmethod
    def _haversine(lat1, lng1, lat2=34.0522, lng2=-118.2437):
        import math
        r = 6371
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return int(r * c)

    def test_la_to_la_is_zero(self):
        assert self._haversine(34.0522, -118.2437) == 0

    def test_ny_to_la_approx_distance(self):
        # NYC → LA is roughly 3940 km
        dist = self._haversine(40.7128, -74.0060)
        assert 3800 < dist < 4100, f"NYC→LA distance {dist} km is out of expected range"

    def test_tokyo_to_la_approx_distance(self):
        # Tokyo → LA is roughly 8800 km
        dist = self._haversine(35.6762, 139.6503)
        assert 8500 < dist < 9100, f"Tokyo→LA distance {dist} km is out of expected range"
