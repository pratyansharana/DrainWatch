import pytest
from drain_monitor.rl_engine.routing_env import MandiHouseToRajivChowkEnv
from drain_monitor.rl_engine.route_agent import RLRouteOptimizer

def test_routing_env():
    env = MandiHouseToRajivChowkEnv()
    obs, info = env.reset()
    assert obs.shape == (8,)  # 1 node_idx + 7 depths
    assert info["current_node"] == "Mandi House"

    next_obs, reward, terminated, truncated, next_info = env.step(0)
    assert isinstance(reward, float)
    assert isinstance(terminated, bool)

def test_rl_route_optimizer():
    optimizer = RLRouteOptimizer()
    optimizer.train_agent(episodes=50)

    dummy_preds = [
        {"landmark": "Mandi House", "predicted_depth_cm": 0.0},
        {"landmark": "Barakhamba Rd Metro", "predicted_depth_cm": 35.0}, # Deep water hazard!
        {"landmark": "KG Marg Junction", "predicted_depth_cm": 0.0},
        {"landmark": "Tolstoy Marg Junction", "predicted_depth_cm": 0.0},
        {"landmark": "Janpath Junction", "predicted_depth_cm": 0.0},
        {"landmark": "Rajiv Chowk Outer Circle", "predicted_depth_cm": 5.0},
        {"landmark": "Connaught Place Inner Circle", "predicted_depth_cm": 10.0},
    ]

    res = optimizer.find_optimal_safe_route("Mandi House", "Rajiv Chowk Outer Circle", dummy_preds)
    assert "rl_safe_route" in res
    assert "naive_route" in res
    assert res["hazard_avoided"] is True
    assert "Barakhamba Rd Metro" not in res["rl_safe_route"]
