"""
RL Verification Script — Proves the Reinforcement Learning Safe Route Engine works correctly.

Tests:
  1. No-flood baseline:   RL should pick shortest path (same as naive)
  2. Blocked direct path: RL should reroute around flooded Barakhamba Rd
  3. Multiple hazards:    RL should find the safest remaining corridor
  4. Q-table convergence: More training → better Q-values (not all zeros)
  5. Gymnasium env:       Step rewards penalize flooded nodes correctly
"""

import numpy as np
from drain_monitor.rl_engine.route_agent import RLRouteOptimizer
from drain_monitor.rl_engine.routing_env import MandiHouseToRajivChowkEnv

PASS = "[PASS]"
FAIL = "[FAIL]"

def make_predictions(depth_overrides: dict) -> list[dict]:
    """Helper to build a full landmark prediction list with custom depths."""
    defaults = {
        "Mandi House": 0.0,
        "Barakhamba Rd Metro": 0.0,
        "KG Marg Junction": 0.0,
        "Tolstoy Marg Junction": 0.0,
        "Janpath Junction": 0.0,
        "Rajiv Chowk Outer Circle": 0.0,
        "Connaught Place Inner Circle": 0.0,
    }
    defaults.update(depth_overrides)
    return [{"landmark": k, "predicted_depth_cm": v} for k, v in defaults.items()]


def test_no_flood_baseline(optimizer):
    """When no flooding, RL should pick the shortest path (same as naive)."""
    preds = make_predictions({})
    result = optimizer.find_optimal_safe_route("Mandi House", "Rajiv Chowk Outer Circle", preds)

    same_route = result["rl_safe_route"] == result["naive_route"]
    low_depth = result["rl_max_flood_depth_cm"] == 0.0

    status = PASS if (same_route and low_depth) else FAIL
    print(f"\n  {status}  Test 1: No-Flood Baseline")
    print(f"         Naive:  {' -> '.join(result['naive_route'])}  (depth {result['naive_max_flood_depth_cm']} cm)")
    print(f"         RL:     {' -> '.join(result['rl_safe_route'])}  (depth {result['rl_max_flood_depth_cm']} cm)")
    print(f"         Routes match: {same_route}")
    return same_route and low_depth


def test_avoids_flooded_barakhamba(optimizer):
    """When Barakhamba has 45cm water, RL must NOT go through it."""
    preds = make_predictions({"Barakhamba Rd Metro": 45.0})
    result = optimizer.find_optimal_safe_route("Mandi House", "Rajiv Chowk Outer Circle", preds)

    barakhamba_in_naive = "Barakhamba Rd Metro" in result["naive_route"]
    barakhamba_avoided = "Barakhamba Rd Metro" not in result["rl_safe_route"]
    hazard_flagged = result["hazard_avoided"] is True

    status = PASS if (barakhamba_avoided and hazard_flagged) else FAIL
    print(f"\n  {status}  Test 2: Avoid Flooded Barakhamba (45 cm)")
    print(f"         Naive:  {' -> '.join(result['naive_route'])}  (max depth {result['naive_max_flood_depth_cm']} cm)")
    print(f"         RL:     {' -> '.join(result['rl_safe_route'])}  (max depth {result['rl_max_flood_depth_cm']} cm)")
    print(f"         Barakhamba in naive: {barakhamba_in_naive} | Avoided by RL: {barakhamba_avoided}")
    print(f"         Reason: {result['recommendation_reason']}")
    return barakhamba_avoided and hazard_flagged


def test_multiple_hazards(optimizer):
    """When both Barakhamba AND Tolstoy are flooded, RL must find alternative."""
    preds = make_predictions({
        "Barakhamba Rd Metro": 40.0,
        "Tolstoy Marg Junction": 35.0,
    })
    result = optimizer.find_optimal_safe_route("Mandi House", "Rajiv Chowk Outer Circle", preds)

    avoids_both = (
        "Barakhamba Rd Metro" not in result["rl_safe_route"]
        and "Tolstoy Marg Junction" not in result["rl_safe_route"]
    )
    rl_depth_lower = result["rl_max_flood_depth_cm"] < result["naive_max_flood_depth_cm"] or avoids_both

    status = PASS if rl_depth_lower else FAIL
    print(f"\n  {status}  Test 3: Multiple Hazards (Barakhamba 40cm + Tolstoy 35cm)")
    print(f"         Naive:  {' -> '.join(result['naive_route'])}  (max depth {result['naive_max_flood_depth_cm']} cm)")
    print(f"         RL:     {' -> '.join(result['rl_safe_route'])}  (max depth {result['rl_max_flood_depth_cm']} cm)")
    print(f"         RL reduces max flood exposure: {rl_depth_lower}")
    return rl_depth_lower


def test_q_table_has_learned(optimizer):
    """After training, Q-table should have non-zero values (agent actually learned)."""
    non_zero_entries = 0
    total_entries = 0
    for node, actions in optimizer.q_table.items():
        for neighbor, q_val in actions.items():
            total_entries += 1
            if q_val != 0.0:
                non_zero_entries += 1

    pct_learned = (non_zero_entries / total_entries * 100) if total_entries > 0 else 0
    learned = non_zero_entries > 0

    status = PASS if learned else FAIL
    print(f"\n  {status}  Test 4: Q-Table Convergence")
    print(f"         Total Q-entries: {total_entries}")
    print(f"         Non-zero (learned): {non_zero_entries} ({pct_learned:.1f}%)")
    print(f"         Sample Q-values:")
    for node in list(optimizer.q_table.keys())[:3]:
        print(f"           {node}: {optimizer.q_table[node]}")
    return learned


def test_env_reward_penalizes_flood():
    """Gymnasium env should give worse rewards when stepping into flooded nodes."""
    # Scenario A: No flood
    env_clean = MandiHouseToRajivChowkEnv()
    env_clean.reset(options={"flood_depths": {n: 0.0 for n in env_clean.node_list}})
    _, reward_clean, _, _, _ = env_clean.step(0)

    # Scenario B: Heavy flood on same neighbor
    env_flood = MandiHouseToRajivChowkEnv()
    neighbors = list(env_flood.road_graph.neighbors("Mandi House"))
    flood_depths = {n: 0.0 for n in env_flood.node_list}
    flood_depths[neighbors[0]] = 45.0  # Critical flood
    env_flood.reset(options={"flood_depths": flood_depths})
    _, reward_flood, _, _, _ = env_flood.step(0)

    penalty_applied = reward_flood < reward_clean
    penalty_magnitude = reward_clean - reward_flood

    status = PASS if penalty_applied else FAIL
    print(f"\n  {status}  Test 5: Gymnasium Reward Penalty for Flooding")
    print(f"         Step into clean node:   reward = {reward_clean:.2f}")
    print(f"         Step into flooded node: reward = {reward_flood:.2f}")
    print(f"         Penalty applied: {penalty_applied} (Delta = {penalty_magnitude:.2f})")
    return penalty_applied


def test_rl_reduces_max_depth(optimizer):
    """RL route's max flood depth should be ≤ naive route's max depth."""
    preds = make_predictions({
        "Barakhamba Rd Metro": 35.0,
        "Rajiv Chowk Outer Circle": 8.0,
    })
    result = optimizer.find_optimal_safe_route("Mandi House", "Rajiv Chowk Outer Circle", preds)

    rl_better = result["rl_max_flood_depth_cm"] <= result["naive_max_flood_depth_cm"]

    status = PASS if rl_better else FAIL
    print(f"\n  {status}  Test 6: RL Reduces Max Flood Exposure")
    print(f"         Naive max depth: {result['naive_max_flood_depth_cm']} cm")
    print(f"         RL max depth:    {result['rl_max_flood_depth_cm']} cm")
    print(f"         RL <= Naive: {rl_better}")
    return rl_better


if __name__ == "__main__":
    print("=" * 72)
    print("  RL VERIFICATION SUITE — DrainMonitor Safe Route Engine")
    print("=" * 72)

    print("\n  Training Q-Learning agent (500 episodes)...")
    optimizer = RLRouteOptimizer()
    optimizer.train_agent(episodes=500)
    print("  Training complete.\n")

    results = []
    results.append(test_no_flood_baseline(optimizer))
    results.append(test_avoids_flooded_barakhamba(optimizer))
    results.append(test_multiple_hazards(optimizer))
    results.append(test_q_table_has_learned(optimizer))
    results.append(test_env_reward_penalizes_flood())
    results.append(test_rl_reduces_max_depth(optimizer))

    passed = sum(results)
    total = len(results)

    print("\n" + "=" * 72)
    print(f"  RESULTS: {passed}/{total} tests passed")
    if passed == total:
        print("  [OK] RL ENGINE VERIFIED - All flood-avoidance behaviors confirmed!")
    else:
        print("  [!!] Some tests failed - review the output above.")
    print("=" * 72)
