import pytest
import numpy as np
from drain_monitor.terrain.dem_generator import DEMGenerator
from drain_monitor.terrain.flow_engine import TerrainFlowEngine

def test_dem_generator():
    generator = DEMGenerator(rows=20, cols=20)
    dem = generator.generate_dem()
    assert dem.shape == (20, 20)
    assert np.min(dem) > 200.0  # Masl height bound
    assert np.max(dem) < 225.0

    landuse, c_matrix = generator.generate_landuse_and_runoff_coefficients()
    assert landuse.shape == (20, 20)
    assert c_matrix.shape == (20, 20)
    assert np.all(c_matrix >= 0.10)
    assert np.all(c_matrix <= 0.95)

def test_terrain_flow_engine():
    generator = DEMGenerator(rows=15, cols=15)
    dem = generator.generate_dem()
    engine = TerrainFlowEngine(dem)

    summary = engine.get_summary()
    assert summary["total_nodes"] == 225
    assert summary["total_flow_edges"] > 0
    assert summary["max_flow_accumulation_cells"] >= 1.0

    # Test flow graph properties
    assert engine.surface_graph.number_of_nodes() == 225
    first_node = (0, 0)
    assert "elevation" in engine.surface_graph.nodes[first_node]
    assert "slope" in engine.surface_graph.nodes[first_node]
