"""
Surface-to-Drainage Coupling Module connecting terrain runoff grid to pipe inlets.
"""

import numpy as np
from drain_monitor.drainage.drainage_graph import DrainageNetworkGraph
from drain_monitor.terrain.flow_engine import TerrainFlowEngine

class SurfaceDrainageCoupler:
    """
    Couples 2D surface terrain flow with 1D underground pipe hydraulics.
    Calculates net excess surface water and surface flood depth (cm) per cell.
    """
    def __init__(self, flow_engine: TerrainFlowEngine, drainage_network: DrainageNetworkGraph):
        self.flow_engine = flow_engine
        self.drainage_network = drainage_network
        self.rows = flow_engine.rows
        self.cols = flow_engine.cols
        self.cell_area = flow_engine.mean_cell_size ** 2

        # Map grid cells to nearest manhole node ID
        self.cell_to_node_map = {}
        self._map_cells_to_nodes()

    def _map_cells_to_nodes(self):
        """Maps each (r, c) cell to its closest drainage inlet node based on grid distance."""
        node_positions = {
            node_id: attrs["grid_pos"]
            for node_id, attrs in self.drainage_network.graph.nodes(data=True)
        }

        for r in range(self.rows):
            for c in range(self.cols):
                min_dist = float('inf')
                closest_node = None
                for node_id, (nr, nc) in node_positions.items():
                    dist = np.sqrt((r - nr)**2 + (c - nc)**2)
                    if dist < min_dist:
                        min_dist = dist
                        closest_node = node_id
                self.cell_to_node_map[(r, c)] = closest_node

    def simulate_surface_drainage_coupling(self, cell_runoff_m3: np.ndarray, duration_min: float = 15.0) -> dict:
        """
        Simulates 2D surface flow routing along DEM slope, intake into underground inlets,
        pipe surcharge, and returns cell water depth matrix (cm) and risk categories.
        """
        # Step 1: Route runoff downhill along D8 surface flow graph
        accumulated_surface_runoff = np.copy(cell_runoff_m3)
        
        # Process cells in topological order (from peaks downhill to low spots)
        topological_nodes = list(self.flow_engine.surface_graph.nodes())
        topological_nodes.sort(key=lambda node: self.flow_engine.surface_graph.nodes[node]["elevation"], reverse=True)

        for r, c in topological_nodes:
            fdir = self.flow_engine.flow_dir_matrix[r, c]
            if fdir != -1:
                dr, dc, _ = self.flow_engine.D8_OFFSETS[fdir]
                nr, nc = r + dr, c + dc
                if 0 <= nr < self.rows and 0 <= nc < self.cols:
                    # Pass 80% of uncaptured surface water downhill, 20% stays in micro-depressions
                    downhill_transfer = accumulated_surface_runoff[r, c] * 0.80
                    accumulated_surface_runoff[nr, nc] += downhill_transfer
                    accumulated_surface_runoff[r, c] *= 0.20

        # Step 2: Sum surface runoff arriving at each drainage inlet
        node_inflows_m3_min = {}
        for (r, c), node_id in self.cell_to_node_map.items():
            water_m3_min = accumulated_surface_runoff[r, c] / max(1.0, duration_min)
            node_inflows_m3_min[node_id] = node_inflows_m3_min.get(node_id, 0.0) + water_m3_min

        # Step 3: Solve pipe hydraulic network
        hydraulics_summary = self.drainage_network.solve_hydraulics(node_inflows_m3_min)

        # Step 4: Calculate final excess water depth (cm) per cell
        depth_matrix_cm = np.zeros((self.rows, self.cols), dtype=np.float64)

        for r in range(self.rows):
            for c in range(self.cols):
                assigned_node = self.cell_to_node_map[(r, c)]
                node_overflow = hydraulics_summary[assigned_node]["surface_overflow_m3"]

                # Total cell surface water volume (local uncaptured runoff + pipe back-up)
                cell_water_vol_m3 = (accumulated_surface_runoff[r, c] * 0.5) + (node_overflow * 0.1)
                
                # Depth in cm = (Volume m3 / Area m2) * 100
                depth_cm = (cell_water_vol_m3 / self.cell_area) * 100.0
                depth_matrix_cm[r, c] = depth_cm

        return {
            "depth_matrix_cm": np.round(depth_matrix_cm, 2),
            "hydraulics_summary": hydraulics_summary,
            "max_depth_cm": float(np.max(depth_matrix_cm)),
            "mean_depth_cm": float(np.mean(depth_matrix_cm))
        }
