"""
Custom Gymnasium Environment for Safe Route Optimization Mandi House -> Rajiv Chowk.
"""

import gymnasium as gym
from gymnasium import spaces
import numpy as np
import networkx as nx
from drain_monitor.config import LANDMARKS, ROAD_EDGES

class MandiHouseToRajivChowkEnv(gym.Env):
    """
    Gymnasium environment where an agent navigates Central Delhi road network from Mandi House to Rajiv Chowk
    under dynamic street flooding conditions.
    """
    metadata = {"render_modes": ["human"]}

    def __init__(self, flood_depths: dict = None):
        super().__init__()
        self.node_list = list(LANDMARKS.keys())
        self.node_to_idx = {name: idx for idx, name in enumerate(self.node_list)}
        self.idx_to_node = {idx: name for idx, name in enumerate(self.node_list)}
        self.n_nodes = len(self.node_list)

        self.start_node = "Mandi House"
        self.target_node = "Rajiv Chowk Outer Circle"

        # Build Road Graph
        self.road_graph = nx.Graph()
        for u, v, attrs in ROAD_EDGES:
            self.road_graph.add_edge(u, v, **attrs)

        # Set Flood Depths per node (cm)
        self.flood_depths = flood_depths or {node: 0.0 for node in self.node_list}

        # Action space: index of neighbor node (max 4 connections per node)
        self.max_degree = 4
        self.action_space = spaces.Discrete(self.max_degree)

        # Observation space: [current_node_idx, flood_depth_0, ..., flood_depth_N]
        self.observation_space = spaces.Box(
            low=0.0, high=500.0, shape=(1 + self.n_nodes,), dtype=np.float32
        )

        self.current_node = self.start_node
        self.steps_taken = 0
        self.max_steps = 15

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        if options and "flood_depths" in options:
            self.flood_depths = options["flood_depths"]
        
        self.current_node = self.start_node
        self.steps_taken = 0

        obs = self._get_observation()
        info = {"current_node": self.current_node}
        return obs, info

    def _get_observation(self):
        node_idx = float(self.node_to_idx[self.current_node])
        depths = [float(self.flood_depths.get(node, 0.0)) for node in self.node_list]
        return np.array([node_idx] + depths, dtype=np.float32)

    def step(self, action: int):
        self.steps_taken += 1
        neighbors = list(self.road_graph.neighbors(self.current_node))

        # Handle valid vs invalid action
        if action < len(neighbors):
            next_node = neighbors[action]
            edge_data = self.road_graph[self.current_node][next_node]
            valid_action = True
        else:
            next_node = self.current_node  # Stay in place on invalid action index
            edge_data = {"distance_m": 100, "speed_kmh": 10}
            valid_action = False

        depth_cm = self.flood_depths.get(next_node, 0.0)
        dist_m = edge_data.get("distance_m", 500)
        speed_kmh = edge_data.get("speed_kmh", 40)

        # Travel time in minutes
        # Reduce effective speed if water is present
        speed_penalty_factor = max(0.1, 1.0 - (depth_cm / 50.0))
        eff_speed_kmh = max(5.0, speed_kmh * speed_penalty_factor)
        travel_time_min = (dist_m / 1000.0) / eff_speed_kmh * 60.0

        # Calculate Reward
        reward = - travel_time_min

        # Flood Risk Penalties
        if depth_cm > 30.0:
            # Critical hazard impassable water
            reward -= 150.0
        elif depth_cm > 15.0:
            # High risk deep water
            reward -= 30.0 + (depth_cm * 2.0)
        elif depth_cm > 5.0:
            # Medium risk warning
            reward -= (depth_cm * 0.8)

        if not valid_action:
            reward -= 10.0

        self.current_node = next_node
        terminated = (self.current_node == self.target_node)
        truncated = (self.steps_taken >= self.max_steps)

        if terminated:
            reward += 100.0  # Destination bonus

        obs = self._get_observation()
        info = {
            "current_node": self.current_node,
            "depth_cm": depth_cm,
            "travel_time_min": travel_time_min,
            "reached_destination": terminated
        }

        return obs, reward, terminated, truncated, info
