"""
Underground Drainage Network Graph & Manning Hydraulic Pipe Capacity Solver.
"""

import numpy as np
import networkx as nx
from drain_monitor.config import MANNING_N_CONCRETE_PIPE, DEFAULT_PIPE_DIAMETER_M, DEFAULT_INLET_CAPACITY_M3_MIN, LANDMARKS

class DrainageNetworkGraph:
    """
    1D Directed Pipe Network Graph representing manholes, storm inlets, and interconnecting main pipes.
    """
    def __init__(self):
        self.graph = nx.DiGraph()
        self.build_default_mandi_house_rajiv_chowk_network()

    def build_default_mandi_house_rajiv_chowk_network(self):
        """
        Constructs synthetic yet physically realistic pipe network connecting Mandi House to Rajiv Chowk.
        """
        # Node setup: Manholes & Inlets
        manholes = [
            ("MH_MandiHouse", {"grid_pos": LANDMARKS["Mandi House"]["grid_pos"], "ground_elevation": 215.5, "invert_level": 213.5, "inlet_capacity_m3_min": 3.5, "blockage_ratio": 0.0}),
            ("MH_Barakhamba", {"grid_pos": LANDMARKS["Barakhamba Rd Metro"]["grid_pos"], "ground_elevation": 214.2, "invert_level": 212.0, "inlet_capacity_m3_min": 3.0, "blockage_ratio": 0.0}),
            ("MH_KGMarg", {"grid_pos": LANDMARKS["KG Marg Junction"]["grid_pos"], "ground_elevation": 214.8, "invert_level": 212.6, "inlet_capacity_m3_min": 2.5, "blockage_ratio": 0.0}),
            ("MH_Tolstoy", {"grid_pos": LANDMARKS["Tolstoy Marg Junction"]["grid_pos"], "ground_elevation": 215.2, "invert_level": 213.0, "inlet_capacity_m3_min": 2.5, "blockage_ratio": 0.0}),
            ("MH_Janpath", {"grid_pos": LANDMARKS["Janpath Junction"]["grid_pos"], "ground_elevation": 214.5, "invert_level": 212.3, "inlet_capacity_m3_min": 3.0, "blockage_ratio": 0.0}),
            ("MH_RajivChowk", {"grid_pos": LANDMARKS["Rajiv Chowk Outer Circle"]["grid_pos"], "ground_elevation": 212.8, "invert_level": 210.2, "inlet_capacity_m3_min": 4.0, "blockage_ratio": 0.0}),
            ("MH_CPInner", {"grid_pos": LANDMARKS["Connaught Place Inner Circle"]["grid_pos"], "ground_elevation": 212.4, "invert_level": 209.8, "inlet_capacity_m3_min": 4.5, "blockage_ratio": 0.0}),
        ]

        for mh_id, attrs in manholes:
            self.graph.add_node(mh_id, **attrs)

        # Pipe setup (Upstream Manhole -> Downstream Manhole)
        pipes = [
            ("MH_MandiHouse", "MH_Barakhamba", {"diameter_m": 1.2, "length_m": 750}),
            ("MH_MandiHouse", "MH_KGMarg", {"diameter_m": 1.0, "length_m": 1000}),
            ("MH_Barakhamba", "MH_RajivChowk", {"diameter_m": 1.5, "length_m": 850}),
            ("MH_KGMarg", "MH_Tolstoy", {"diameter_m": 1.0, "length_m": 350}),
            ("MH_Tolstoy", "MH_Janpath", {"diameter_m": 1.0, "length_m": 300}),
            ("MH_Janpath", "MH_RajivChowk", {"diameter_m": 1.2, "length_m": 450}),
            ("MH_RajivChowk", "MH_CPInner", {"diameter_m": 1.8, "length_m": 150}),
        ]

        for u, v, attrs in pipes:
            # Calculate pipe slope S = (invert_u - invert_v) / length
            inv_u = self.graph.nodes[u]["invert_level"]
            inv_v = self.graph.nodes[v]["invert_level"]
            dz = max(0.01, inv_u - inv_v)
            slope = dz / attrs["length_m"]

            # Compute max hydraulic capacity using Manning Equation: Q = (1/n) * A * R^(2/3) * S^(1/2)
            d = attrs["diameter_m"]
            area = np.pi * (d / 2.0)**2
            hydr_radius = d / 4.0
            n = MANNING_N_CONCRETE_PIPE

            # Full pipe flow rate in m3/sec, convert to m3/min
            q_m3_s = (1.0 / n) * area * (hydr_radius ** (2/3)) * np.sqrt(slope)
            q_max_m3_min = q_m3_s * 60.0

            self.graph.add_edge(
                u, v,
                diameter_m=d,
                length_m=attrs["length_m"],
                slope=slope,
                q_max_m3_min=q_max_m3_min,
                current_flow_m3_min=0.0,
                surcharge_m3=0.0
            )

    def set_node_blockage(self, node_id: str, blockage_ratio: float):
        """Sets blockage percentage (0.0 to 1.0) for a given inlet/manhole."""
        if node_id in self.graph:
            self.graph.nodes[node_id]["blockage_ratio"] = np.clip(blockage_ratio, 0.0, 1.0)

    def solve_hydraulics(self, node_inflows_m3_min: dict) -> dict:
        """
        Solves 1D pipe network hydraulic flow and detects pipe surcharges & node back-ups.
        Returns node drainage stress & surface overflow back-ups.
        """
        surcharge_results = {}

        # Reset flows
        for u, v in self.graph.edges():
            self.graph.edges[u, v]["current_flow_m3_min"] = 0.0
            self.graph.edges[u, v]["surcharge_m3"] = 0.0

        # Topological pass from upstream to downstream
        topological_order = list(nx.topological_sort(self.graph))

        accumulated_flow = {node: node_inflows_m3_min.get(node, 0.0) for node in topological_order}

        for u in topological_order:
            # Effective intake capacity considering blockage
            blockage = self.graph.nodes[u].get("blockage_ratio", 0.0)
            base_inlet_cap = self.graph.nodes[u]["inlet_capacity_m3_min"]
            effective_inlet_cap = base_inlet_cap * (1.0 - blockage)

            intake = min(accumulated_flow[u], effective_inlet_cap)
            excess_surface_node = accumulated_flow[u] - intake

            # Distribute intake flow into outgoing pipes
            out_edges = list(self.graph.out_edges(u))
            if out_edges:
                flow_per_pipe = intake / len(out_edges)
                for u_edge, v_edge in out_edges:
                    q_max = self.graph.edges[u_edge, v_edge]["q_max_m3_min"]
                    if flow_per_pipe > q_max:
                        # Pipe Surcharged!
                        pipe_overflow = flow_per_pipe - q_max
                        self.graph.edges[u_edge, v_edge]["current_flow_m3_min"] = q_max
                        self.graph.edges[u_edge, v_edge]["surcharge_m3"] = pipe_overflow
                        excess_surface_node += pipe_overflow
                        accumulated_flow[v_edge] += q_max
                    else:
                        self.graph.edges[u_edge, v_edge]["current_flow_m3_min"] = flow_per_pipe
                        accumulated_flow[v_edge] += flow_per_pipe

            surcharge_results[u] = {
                "inflow_m3_min": accumulated_flow[u],
                "effective_inlet_cap_m3_min": effective_inlet_cap,
                "surface_overflow_m3": excess_surface_node,
                "drainage_stress": min(1.0, accumulated_flow[u] / max(0.1, effective_inlet_cap))
            }

        return surcharge_results
