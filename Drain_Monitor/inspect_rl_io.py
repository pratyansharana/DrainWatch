"""
RL Model Input/Output Inspector
================================
Shows exactly what goes INTO and comes OUT OF the RL model at every level:
  1. Gymnasium Environment: observation vectors, actions, rewards per step
  2. Q-Table: learned state-action values
  3. Route Optimizer: flood predictions in -> safe route decision out
"""

import numpy as np
import json
from drain_monitor.rl_engine.route_agent import RLRouteOptimizer
from drain_monitor.rl_engine.routing_env import MandiHouseToRajivChowkEnv
from drain_monitor.config import LANDMARKS, ROAD_EDGES

SEPARATOR = "=" * 80
SUBSEP = "-" * 80


# =========================================================================
#  SECTION 1: Gymnasium Environment - Step-by-Step Input/Output
# =========================================================================
def show_env_io():
    print(f"\n{SEPARATOR}")
    print("  SECTION 1: GYMNASIUM ENVIRONMENT - Step-by-Step I/O")
    print(SEPARATOR)

    # Define a flood scenario
    flood_depths = {
        "Mandi House": 0.0,
        "Barakhamba Rd Metro": 35.0,   # <-- flooded!
        "KG Marg Junction": 2.0,
        "Tolstoy Marg Junction": 0.0,
        "Janpath Junction": 5.0,
        "Rajiv Chowk Outer Circle": 3.0,
        "Connaught Place Inner Circle": 8.0,
    }

    env = MandiHouseToRajivChowkEnv()
    obs, info = env.reset(options={"flood_depths": flood_depths})

    print(f"\n  [ENV CONFIG]")
    print(f"    Start node:       {env.start_node}")
    print(f"    Target node:      {env.target_node}")
    print(f"    Max steps:        {env.max_steps}")
    print(f"    Action space:     Discrete({env.action_space.n}) (max neighbor index)")
    print(f"    Observation size: {env.observation_space.shape[0]} floats")
    print(f"      - obs[0]     = current node index")
    print(f"      - obs[1..7]  = flood depth (cm) at each landmark")

    print(f"\n  [FLOOD SCENARIO INPUT]")
    for name, depth in flood_depths.items():
        marker = " <<<< FLOODED" if depth > 15 else ""
        print(f"    {name:40s}  {depth:6.1f} cm{marker}")

    print(f"\n  [INITIAL OBSERVATION after reset()]")
    print(f"    Raw vector: {obs}")
    print(f"    Decoded:")
    print(f"      Current node index: {int(obs[0])} -> {env.idx_to_node[int(obs[0])]}")
    for i, name in enumerate(env.node_list):
        print(f"      Depth[{name:40s}] = {obs[1+i]:.1f} cm")

    # Walk through a few steps
    print(f"\n  [STEP-BY-STEP EPISODE WALKTHROUGH]")
    print(f"  {'Step':>4s}  {'Current Node':40s}  {'Action':>6s}  {'Next Node':40s}  {'Reward':>8s}  {'Depth':>7s}  {'Done?':>5s}")
    print(f"  {SUBSEP}")

    step = 0
    terminated = False
    truncated = False
    total_reward = 0.0

    while not (terminated or truncated):
        neighbors = list(env.road_graph.neighbors(env.current_node))
        current = env.current_node

        # Pick action 0 for demonstration (first neighbor)
        action = 0
        obs, reward, terminated, truncated, info = env.step(action)

        total_reward += reward
        step += 1
        print(f"  {step:4d}  {current:40s}  {action:6d}  {info['current_node']:40s}  {reward:8.2f}  {info['depth_cm']:5.1f}cm  {'YES' if terminated else 'no'}")

        if step >= 10:
            print(f"  ... (stopping after 10 steps for readability)")
            break

    print(f"\n  [EPISODE SUMMARY]")
    print(f"    Total steps:    {step}")
    print(f"    Total reward:   {total_reward:.2f}")
    print(f"    Reached target: {terminated}")


# =========================================================================
#  SECTION 2: Q-Table - Learned State-Action Values
# =========================================================================
def show_q_table(optimizer):
    print(f"\n{SEPARATOR}")
    print("  SECTION 2: Q-TABLE - Learned State-Action Values")
    print(SEPARATOR)

    print(f"\n  The Q-table maps: Q(state, action) -> expected future reward")
    print(f"  State  = current landmark node")
    print(f"  Action = which neighbor to move to")
    print(f"  Value  = higher is better (less penalty, faster, safer)\n")

    for node in optimizer.nodes:
        neighbors = optimizer.q_table.get(node, {})
        print(f"  State: [{node}]")
        if not neighbors:
            print(f"    (no actions)")
        else:
            best_action = max(neighbors, key=neighbors.get)
            for nbr, q_val in neighbors.items():
                marker = " <-- BEST ACTION" if nbr == best_action else ""
                print(f"    -> {nbr:40s}  Q = {q_val:10.3f}{marker}")
        print()


# =========================================================================
#  SECTION 3: Route Optimizer - Full Input/Output
# =========================================================================
def show_route_optimizer_io(optimizer):
    print(f"\n{SEPARATOR}")
    print("  SECTION 3: ROUTE OPTIMIZER - Full Input/Output")
    print(SEPARATOR)

    # === INPUT ===
    flood_predictions = [
        {"landmark": "Mandi House",                  "predicted_depth_cm": 5.0},
        {"landmark": "Barakhamba Rd Metro",           "predicted_depth_cm": 42.0},
        {"landmark": "KG Marg Junction",              "predicted_depth_cm": 3.0},
        {"landmark": "Tolstoy Marg Junction",         "predicted_depth_cm": 1.0},
        {"landmark": "Janpath Junction",              "predicted_depth_cm": 6.0},
        {"landmark": "Rajiv Chowk Outer Circle",      "predicted_depth_cm": 12.0},
        {"landmark": "Connaught Place Inner Circle",  "predicted_depth_cm": 15.0},
    ]

    print(f"\n  ========== INPUT ==========")
    print(f"\n  [INPUT 1] Origin:      Mandi House")
    print(f"  [INPUT 2] Destination: Rajiv Chowk Outer Circle")
    print(f"\n  [INPUT 3] Flood Predictions (from ML Surrogate Model):")
    print(f"    {'Landmark':42s}  {'Depth (cm)':>10s}  {'Risk'}")
    print(f"    {'-'*70}")
    for p in flood_predictions:
        depth = p["predicted_depth_cm"]
        if depth > 30:
            risk = "CRITICAL - IMPASSABLE"
        elif depth > 15:
            risk = "HIGH"
        elif depth > 5:
            risk = "MEDIUM"
        else:
            risk = "LOW"
        print(f"    {p['landmark']:42s}  {depth:10.1f}  {risk}")

    print(f"\n  [INPUT 4] Road Network Edges (from config):")
    print(f"    {'From':30s}  {'To':30s}  {'Dist (m)':>8s}  {'Speed':>6s}")
    print(f"    {'-'*80}")
    for u, v, attrs in ROAD_EDGES:
        print(f"    {u:30s}  {v:30s}  {attrs['distance_m']:8d}  {attrs['speed_kmh']:4d} km/h")

    # === PROCESSING ===
    print(f"\n  ========== PROCESSING ==========")
    print(f"\n  [STEP A] Build flood-cost weighted graph:")
    depth_map = {p["landmark"]: p["predicted_depth_cm"] for p in flood_predictions}
    print(f"    {'Edge':65s}  {'Base Time':>10s}  {'Flood Cost':>10s}")
    print(f"    {'-'*90}")
    for u, v, attrs in ROAD_EDGES:
        dist = attrs["distance_m"]
        speed = attrs["speed_kmh"]
        base_time = (dist / 1000.0) / speed * 60.0
        max_d = max(depth_map.get(u, 0), depth_map.get(v, 0))

        if max_d > 30:
            flood_cost = 9999.0
            note = "(BLOCKED >30cm)"
        elif max_d > 15:
            flood_cost = base_time * 5.0 + (max_d * 2.0)
            note = "(HIGH penalty)"
        elif max_d > 5:
            flood_cost = base_time * 1.5 + max_d
            note = "(medium penalty)"
        else:
            flood_cost = base_time
            note = "(no penalty)"

        print(f"    {u:30s} -> {v:30s}  {base_time:8.2f} min  {flood_cost:10.2f}  {note}")

    print(f"\n  [STEP B] Compute naive shortest path (distance only, ignores flood)")
    print(f"  [STEP C] Compute RL safe path (flood-cost weighted Dijkstra)")

    # === OUTPUT ===
    result = optimizer.find_optimal_safe_route("Mandi House", "Rajiv Chowk Outer Circle", flood_predictions)

    print(f"\n  ========== OUTPUT ==========")
    print(f"\n  [OUTPUT] Full JSON response from find_optimal_safe_route():\n")
    # Pretty print with indentation
    output_str = json.dumps(result, indent=4, default=str)
    for line in output_str.split('\n'):
        print(f"    {line}")

    print(f"\n  [OUTPUT DECODED]")
    print(f"    Naive Route:       {' -> '.join(result['naive_route'])}")
    print(f"    Naive Time:        {result['naive_travel_time_min']} min")
    print(f"    Naive Max Depth:   {result['naive_max_flood_depth_cm']} cm")
    print()
    print(f"    RL Safe Route:     {' -> '.join(result['rl_safe_route'])}")
    print(f"    RL Time:           {result['rl_travel_time_min']} min")
    print(f"    RL Max Depth:      {result['rl_max_flood_depth_cm']} cm")
    print()
    print(f"    Hazard Avoided:    {result['hazard_avoided']}")
    print(f"    Reason:            {result['recommendation_reason']}")


# =========================================================================
#  MAIN
# =========================================================================
if __name__ == "__main__":
    print(SEPARATOR)
    print("  RL MODEL INPUT/OUTPUT INSPECTOR")
    print("  DrainMonitor Safe Route Engine")
    print(SEPARATOR)

    print("\n  Training Q-Learning agent (500 episodes)...")
    optimizer = RLRouteOptimizer()
    optimizer.train_agent(episodes=500)
    print("  Training complete.")

    show_env_io()
    show_q_table(optimizer)
    show_route_optimizer_io(optimizer)

    print(f"\n{SEPARATOR}")
    print("  INSPECTION COMPLETE")
    print(SEPARATOR)
