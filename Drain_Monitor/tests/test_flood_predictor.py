import pytest
from drain_monitor.predictor.flood_model import FloodPredictionEngine

def test_flood_prediction_engine():
    engine = FloodPredictionEngine()
    assert engine.is_trained

    res = engine.predict_location("Barakhamba Rd Metro", rainfall_mm_hr=50.0)
    assert "predicted_depth_cm" in res
    assert "flood_probability" in res
    assert "time_to_flood_min" in res
    assert "risk_level" in res
    assert res["predicted_depth_cm"] >= 0.0

    all_res = engine.predict_all_landmarks(rainfall_mm_hr=70.0)
    assert len(all_res) > 0
    assert any(item["landmark"] == "Mandi House" for item in all_res)
