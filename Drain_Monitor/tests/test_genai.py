import pytest
from unittest.mock import patch, MagicMock
from drain_monitor.genai.intelligence import GenAICityIntelligenceEngine

def test_genai_city_intelligence_rule_based():
    engine = GenAICityIntelligenceEngine()

    report1 = "Drain clogged near Barakhamba metro gate 2 with garbage plastic bags."
    res1 = engine.process_report(report1)
    assert res1.location == "Barakhamba Rd Metro"
    assert res1.event_type == "drain_blockage"
    assert res1.blockage_ratio > 0.0

    report2 = "Construction works at Tolstoy Marg reduced road to single lane."
    res2 = engine.process_report(report2)
    assert res2.location == "Tolstoy Marg Junction"
    assert res2.event_type == "construction"
    assert res2.road_capacity_reduction > 0.0

test_genai_city_intelligence = test_genai_city_intelligence_rule_based

def test_genai_mistral_api_integration():
    mock_response_json = {
        "choices": [
            {
                "message": {
                    "content": '{"location": "Barakhamba Rd Metro", "event": "drain_blockage", "event_type": "drain_blockage", "blockage_ratio": 0.85, "road_capacity_reduction": 0.3, "confidence": 0.96}'
                }
            }
        ]
    }

    with patch("requests.post") as mock_post:
        mock_resp = MagicMock()
        mock_resp.json.return_value = mock_response_json
        mock_resp.raise_for_status.return_value = None
        mock_post.return_value = mock_resp

        engine = GenAICityIntelligenceEngine(api_key="test-mistral-api-key")
        res = engine.process_report("Clogged drain at Barakhamba Metro")

        assert res.location == "Barakhamba Rd Metro"
        assert res.blockage_ratio == 0.85
        assert res.source == "mistral_ai_report"
        mock_post.assert_called_once()

def test_genai_mistral_api_fallback_on_error():
    with patch("requests.post", side_effect=Exception("API Error")):
        engine = GenAICityIntelligenceEngine(api_key="invalid-key")
        res = engine.process_report("Clogged drain near Barakhamba metro")
        assert res.location == "Barakhamba Rd Metro"
        assert res.event_type == "drain_blockage"
