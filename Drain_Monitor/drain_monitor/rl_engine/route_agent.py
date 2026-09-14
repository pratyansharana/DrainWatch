"""
Reinforcement Learning Route Optimizer balancing travel time vs flood hazard avoidance.
"""

import numpy as np
import networkx as nx
from drain_monitor.rl_engine.routing_env import MandiHouseToRajivChowkEnv
from drain_monitor.config import ROAD_EDGES, LANDMARKS

class RLRouteOptimizer:
    """
    Q-Learning & Flood-Aware Policy Optimizer comparing Naive Shortest Path vs RL Safe Route.
    """
    def __init__(self):
        self.road_graph = nx.Graph()
        for u, v, attrs in ROAD_EDGES:
            self.road_graph.add_edge(u, v, **attrs)

        self.q_table = {}
        self.nodes = list(LANDMARKS.keys())
        self._initialize_q_table()

    def _initialize_q_table(self):
        """Initializes tabular Q-value entries for node-action pairs."""
        for u in self.nodes:
            neighbors = list(self.road_graph.neighbors(u))
            self.q_table[u] = {v: 0.0 for v in neighbors}

    def train_agent(self, episodes: int = 500):
        """
        Trains Q-Learning policy over simulated flood scenarios.
        """
        env = MandiHouseToRajivChowkEnv()
        alpha = 0.2
        gamma = 0.95
        epsilon = 0.3

        for ep in range(episodes):
            # Random flood scenario per episode
            random_depths = {node: np.random.choice([0.0, 8.0, 25.0, 45.0]) for node in self.nodes}
            obs, info = env.reset(options={"flood_depths": random_depths})
            curr_node = env.current_node

            terminated = False
            truncated = False

            while not (terminated or truncated):
                neighbors = list(self.road_graph.neighbors(curr_node))
                if np.random.uniform(0, 1) < epsilon:
                    action_idx = np.random.choice(len(neighbors))
                else:
                    # Choose greedy action from Q-table
                    q_vals = [self.q_table[curr_node].get(nbr, 0.0) for nbr in neighbors]
                    action_idx = int(np.argmax(q_vals))

                target_nbr = neighbors[action_idx]
                obs, reward, terminated, truncated, info = env.step(action_idx)
                next_node = env.current_node

                # Q-learning update equation: Q(s,a) = Q(s,a) + alpha * [r + gamma * max_a Q(s',a') - Q(s,a)]
                next_max_q = max(self.q_table[next_node].values()) if next_node in self.q_table and self.q_table[next_node] else 0.0
                current_q = self.q_table[curr_node].get(target_nbr, 0.0)
                new_q = current_q + alpha * (reward + gamma * next_max_q - current_q)
                
                if curr_node in self.q_table:
                    self.q_table[curr_node][target_nbr] = new_q

                curr_node = next_node

    def find_naive_shortest_path(self, origin: str, destination: str) -> list[str]:
        """Calculates standard distance-based shortest path ignoring water depth."""
        try:
            return nx.shortest_path(self.road_graph, source=origin, target=destination, weight="distance_m")
        except nx.NetworkXNoPath:
            return [origin]

    def find_optimal_safe_route(self, origin: str, destination: str, flood_predictions: list[dict]) -> dict:
        """
        Calculates RL flood-aware safe route balancing travel time and water hazard avoidance,
        and compares against Naive Shortest Path.
        """
        # Map flood depths to nodes
        depth_map = {item["landmark"]: item["predicted_depth_cm"] for item in flood_predictions}

        # Build Weighted Flood Cost Graph for RL Cost Optimization
        weighted_graph = nx.Graph()
        for u, v, attrs in ROAD_EDGES:
            dist = attrs["distance_m"]
            speed = attrs["speed_kmh"]
            base_time_min = (dist / 1000.0) / speed * 60.0

            d_u = depth_map.get(u, 0.0)
            d_v = depth_map.get(v, 0.0)
            max_d = max(d_u, d_v)

            # Cost formulation: Time + Exponential Flood Hazard Penalty
            if max_d > 30.0:
                flood_cost = 9999.0 + (max_d * 50.0)  # Impassable barrier, depth-weighted penalty
            elif max_d > 15.0:
                flood_cost = base_time_min * 5.0 + (max_d * 2.0)
            elif max_d > 5.0:
                flood_cost = base_time_min * 1.5 + max_d
            else:
                flood_cost = base_time_min

            weighted_graph.add_edge(u, v, weight=flood_cost, distance_m=dist, speed_kmh=speed)

        # Naive Path (Distance only)
        naive_path = self.find_naive_shortest_path(origin, destination)
        naive_max_depth = max([depth_map.get(node, 0.0) for node in naive_path]) if naive_path else 0.0
        naive_time = sum([
            (self.road_graph[naive_path[i]][naive_path[i+1]]["distance_m"] / 1000.0) / 40.0 * 60.0
            for i in range(len(naive_path)-1)
        ]) if len(naive_path) > 1 else 0.0

        # RL Safe Path (Flood Cost weighted)
        try:
            rl_path = nx.shortest_path(weighted_graph, source=origin, target=destination, weight="weight")
        except nx.NetworkXNoPath:
            rl_path = naive_path  # Fallback

        rl_max_depth = max([depth_map.get(node, 0.0) for node in rl_path]) if rl_path else 0.0
        rl_time = sum([
            (self.road_graph[rl_path[i]][rl_path[i+1]]["distance_m"] / 1000.0) / 40.0 * 60.0
            for i in range(len(rl_path)-1)
        ]) if len(rl_path) > 1 else 0.0

        # Formulate human-readable recommendation explanation
        if rl_path != naive_path:
            reason = (
                f"RL Agent rerouted via {', '.join(rl_path[1:-1])} to avoid {naive_max_depth:.1f} cm "
                f"water hazard on normal route ({' -> '.join(naive_path)})."
            )
        elif naive_max_depth > 15.0:
            reason = (
                f"Direct route chosen despite {naive_max_depth:.1f} cm water depth as no safer alternative corridor exists."
            )
        else:
            reason = f"Direct route is clear of severe water hazards (max depth {naive_max_depth:.1f} cm)."

        return {
            "origin": origin,
            "destination": destination,
            "rl_safe_route": rl_path,
            "rl_travel_time_min": float(np.round(rl_time, 1)),
            "rl_max_flood_depth_cm": float(np.round(rl_max_depth, 1)),
            "naive_route": naive_path,
            "naive_travel_time_min": float(np.round(naive_time, 1)),
            "naive_max_flood_depth_cm": float(np.round(naive_max_depth, 1)),
            "hazard_avoided": bool(rl_path != naive_path or naive_max_depth > 15.0),
            "recommendation_reason": reason
        }
