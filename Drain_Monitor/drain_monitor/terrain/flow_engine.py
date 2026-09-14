"""
Terrain Water Flow Engine implementing D8 Flow Direction, Flow Accumulation, and Surface Flow Graph.
"""

import numpy as np
import networkx as nx

class TerrainFlowEngine:
    """
    Computes terrain slopes, D8 steepest-descent flow direction, flow accumulation,
    and constructs a dynamic NetworkX Surface Flow Graph.
    """
    # D8 neighbor relative offsets: (dr, dc) and distance multipliers (1.0 for orthogonal, sqrt(2) for diagonal)
    D8_OFFSETS = [
        (-1, 0, 1.0),   # N (0)
        (-1, 1, np.sqrt(2)),  # NE (1)
        (0, 1, 1.0),    # E (2)
        (1, 1, np.sqrt(2)),   # SE (3)
        (1, 0, 1.0),    # S (4)
        (1, -1, np.sqrt(2)),  # SW (5)
        (0, -1, 1.0),   # W (6)
        (-1, -1, np.sqrt(2))  # NW (7)
    ]

    def __init__(self, dem: np.ndarray, cell_dx_m: float = 35.0, cell_dy_m: float = 40.0):
        self.dem = dem
        self.rows, self.cols = dem.shape
        self.cell_dx = cell_dx_m
        self.cell_dy = cell_dy_m
        self.mean_cell_size = (cell_dx_m + cell_dy_m) / 2.0

        self.slope_matrix = np.zeros((self.rows, self.cols), dtype=np.float64)
        self.flow_dir_matrix = np.full((self.rows, self.cols), -1, dtype=np.int32)
        self.flow_acc_matrix = np.ones((self.rows, self.cols), dtype=np.float64)
        self.surface_graph = nx.DiGraph()

        self._compute_slope_and_flow_dir()
        self._compute_flow_accumulation()
        self._build_surface_flow_graph()

    def _compute_slope_and_flow_dir(self):
        """
        Calculates D8 flow direction (steepest downhill neighbor) and slope percentage for every cell.
        """
        for r in range(self.rows):
            for c in range(self.cols):
                current_z = self.dem[r, c]
                max_slope = 0.0
                best_dir = -1

                for idx, (dr, dc, dist_factor) in enumerate(self.D8_OFFSETS):
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < self.rows and 0 <= nc < self.cols:
                        neighbor_z = self.dem[nr, nc]
                        dz = current_z - neighbor_z
                        dist = self.mean_cell_size * dist_factor
                        if dz > 0:
                            slope = dz / dist
                            if slope > max_slope:
                                max_slope = slope
                                best_dir = idx

                self.slope_matrix[r, c] = max_slope
                self.flow_dir_matrix[r, c] = best_dir

    def _compute_flow_accumulation(self):
        """
        Calculates flow accumulation using in-degree topological sorting.
        Each cell starts with an accumulation of 1.0 (its own area unit).
        """
        in_degree = np.zeros((self.rows, self.cols), dtype=np.int32)

        # Compute in-degree for every cell
        for r in range(self.rows):
            for c in range(self.cols):
                fdir = self.flow_dir_matrix[r, c]
                if fdir != -1:
                    dr, dc, _ = self.D8_OFFSETS[fdir]
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < self.rows and 0 <= nc < self.cols:
                        in_degree[nr, nc] += 1

        # Queue cells with zero in-degree (peaks / ridges)
        queue = [(r, c) for r in range(self.rows) for c in range(self.cols) if in_degree[r, c] == 0]

        while queue:
            curr_r, curr_c = queue.pop(0)
            fdir = self.flow_dir_matrix[curr_r, curr_c]

            if fdir != -1:
                dr, dc, _ = self.D8_OFFSETS[fdir]
                nr, nc = curr_r + dr, curr_c + dc
                if 0 <= nr < self.rows and 0 <= nc < self.cols:
                    self.flow_acc_matrix[nr, nc] += self.flow_acc_matrix[curr_r, curr_c]
                    in_degree[nr, nc] -= 1
                    if in_degree[nr, nc] == 0:
                        queue.append((nr, nc))

    def _build_surface_flow_graph(self):
        """
        Constructs a NetworkX DiGraph representing surface water flow paths.
        """
        for r in range(self.rows):
            for c in range(self.cols):
                node_id = (r, c)
                self.surface_graph.add_node(
                    node_id,
                    elevation=float(self.dem[r, c]),
                    slope=float(self.slope_matrix[r, c]),
                    flow_acc=float(self.flow_acc_matrix[r, c])
                )

                fdir = self.flow_dir_matrix[r, c]
                if fdir != -1:
                    dr, dc, dist_factor = self.D8_OFFSETS[fdir]
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < self.rows and 0 <= nc < self.cols:
                        downhill_node = (nr, nc)
                        slope = float(self.slope_matrix[r, c])
                        self.surface_graph.add_edge(
                            node_id,
                            downhill_node,
                            slope=slope,
                            weight=max(0.001, slope)
                        )

    def get_summary(self) -> dict:
        """
        Returns high-level summary of the terrain flow system.
        """
        return {
            "rows": self.rows,
            "cols": self.cols,
            "total_nodes": self.surface_graph.number_of_nodes(),
            "total_flow_edges": self.surface_graph.number_of_edges(),
            "min_elevation_masl": float(np.min(self.dem)),
            "max_elevation_masl": float(np.max(self.dem)),
            "max_flow_accumulation_cells": float(np.max(self.flow_acc_matrix)),
            "mean_slope": float(np.mean(self.slope_matrix))
        }
