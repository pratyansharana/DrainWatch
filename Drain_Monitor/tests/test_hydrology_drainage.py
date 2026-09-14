import pytest
import numpy as np
from drain_monitor.terrain.dem_generator import DEMGenerator
from drain_monitor.terrain.flow_engine import TerrainFlowEngine
from drain_monitor.hydrology.runoff_engine import RunoffEngine
from drain_monitor.drainage.drainage_graph import DrainageNetworkGraph
from drain_monitor.drainage.surface_coupling import SurfaceDrainageCoupler

def test_runoff_engine():
    generator = DEMGenerator(rows=10, cols=10)
    _, c_matrix = generator.generate_landuse_and_runoff_coefficients()
    runoff_eng = RunoffEngine(c_matrix)

    # 40 mm/hr rainfall test
    runoff_m3 = runoff_eng.compute_cell_runoff(rainfall_mm_hr=40.0, duration_min=15.0)
    assert runoff_m3.shape == (10, 10)
    assert np.all(runoff_m3 >= 0.0)
    assert np.sum(runoff_m3) > 0.0

def test_drainage_network_and_coupling():
    dem_gen = DEMGenerator(rows=15, cols=15)
    dem = dem_gen.generate_dem()
    _, c_matrix = dem_gen.generate_landuse_and_runoff_coefficients()

    flow_engine = TerrainFlowEngine(dem)
    runoff_engine = RunoffEngine(c_matrix)
    drainage_net = DrainageNetworkGraph()
    coupler = SurfaceDrainageCoupler(flow_engine, drainage_net)

    runoff_m3 = runoff_engine.compute_cell_runoff(rainfall_mm_hr=60.0, duration_min=15.0)
    coupling_result = coupler.simulate_surface_drainage_coupling(runoff_m3, duration_min=15.0)

    assert "depth_matrix_cm" in coupling_result
    assert coupling_result["depth_matrix_cm"].shape == (15, 15)
    assert coupling_result["max_depth_cm"] >= 0.0
    assert "MH_Barakhamba" in coupling_result["hydraulics_summary"]
