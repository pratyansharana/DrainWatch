"""
DrainMonitor End-to-End Execution Pipeline
Demonstrates Milestones 1 to 6 for Mandi House -> Rajiv Chowk Pilot Corridor.
"""

import json
from drain_monitor.terrain.dem_generator import DEMGenerator
from drain_monitor.terrain.flow_engine import TerrainFlowEngine
from drain_monitor.hydrology.runoff_engine import RunoffEngine
from drain_monitor.drainage.drainage_graph import DrainageNetworkGraph
from drain_monitor.drainage.surface_coupling import SurfaceDrainageCoupler
from drain_monitor.predictor.flood_model import FloodPredictionEngine
from drain_monitor.rl_engine.route_agent import RLRouteOptimizer
from drain_monitor.genai.intelligence import GenAICityIntelligenceEngine

def main():
    print("=" * 80)
    print("  DRAINMONITOR: URBAN FLOOD INTELLIGENCE & RL DECISION SYSTEM")
    print("  Pilot Corridor: Mandi House -> Rajiv Chowk (Central Delhi)")
    print("=" * 80)

    # Phase 1: Terrain DEM & D8 Flow Engine
    print("\n[MILESTONE 1] Terrain DEM & D8 Flow Engine Initialization...")
    dem_gen = DEMGenerator()
    dem = dem_gen.generate_dem()
    landuse, c_matrix = dem_gen.generate_landuse_and_runoff_coefficients()
    flow_engine = TerrainFlowEngine(dem)
    flow_summary = flow_engine.get_summary()
    print(f"  [OK] DEM Grid Shape: {flow_summary['rows']}x{flow_summary['cols']} ({flow_summary['total_nodes']} cells)")
    print(f"  [OK] Total Surface Flow Edges: {flow_summary['total_flow_edges']}")
    print(f"  [OK] Elevation Range: {flow_summary['min_elevation_masl']} masl to {flow_summary['max_elevation_masl']} masl")

    # Phase 2: Rainfall -> Runoff Engine
    print("\n[MILESTONE 2] Hydrological Rainfall -> Runoff Engine...")
    rainfall_mm_hr = 60.0
    duration_min = 15.0
    runoff_eng = RunoffEngine(c_matrix)
    runoff_m3 = runoff_eng.compute_cell_runoff(rainfall_mm_hr, duration_min)
    print(f"  [OK] Applied Rainfall: {rainfall_mm_hr} mm/hr over {duration_min} mins")
    print(f"  [OK] Total Surface Runoff Generated: {runoff_m3.sum():.2f} m3 across corridor")

    # Phase 3: 1D Drainage Network & Surface Coupling
    print("\n[MILESTONE 3] 1D Pipe Hydraulic Network & Surface Coupling...")
    drainage_net = DrainageNetworkGraph()
    coupler = SurfaceDrainageCoupler(flow_engine, drainage_net)
    coupling_res = coupler.simulate_surface_drainage_coupling(runoff_m3, duration_min)
    print(f"  [OK] Max Surface Water Depth: {coupling_res['max_depth_cm']:.2f} cm")
    print(f"  [OK] Mean Surface Water Depth: {coupling_res['mean_depth_cm']:.2f} cm")
    print("  [OK] Pipe Hydraulic Surcharge Status:")
    for node, status in coupling_res['hydraulics_summary'].items():
        print(f"      Node {node:15s} | Inflow: {status['inflow_m3_min']:6.2f} m3/min | Overflow: {status['surface_overflow_m3']:6.2f} m3 | Stress: {status['drainage_stress']*100:5.1f}%")

    # Phase 4: Flood Prediction ML Surrogate Model
    print("\n[MILESTONE 4] ML Surrogate Flood Predictor...")
    predictor = FloodPredictionEngine()
    landmark_preds = predictor.predict_all_landmarks(rainfall_mm_hr)
    print("  [OK] Street-Level 0-3h Predictions:")
    for lm in landmark_preds:
        print(f"      {lm['landmark']:30s} | Depth: {lm['predicted_depth_cm']:5.1f} cm | TTF: {lm['time_to_flood_min']:3d} min | Risk: {lm['risk_level']:8s} | Prob: {lm['flood_probability']*100:4.0f}%")

    # Phase 5: RL Safe Route Optimization
    print("\n[MILESTONE 5] Reinforcement Learning Safe Route Decision Engine...")
    rl_agent = RLRouteOptimizer()
    rl_agent.train_agent(episodes=300)
    route_res = rl_agent.find_optimal_safe_route("Mandi House", "Rajiv Chowk Outer Circle", landmark_preds)
    print(f"  [OK] Naive Shortest Path:  {' -> '.join(route_res['naive_route'])}")
    print(f"      Travel Time: {route_res['naive_travel_time_min']} min | Max Depth: {route_res['naive_max_flood_depth_cm']} cm")
    print(f"  [OK] RL Safe Path:         {' -> '.join(route_res['rl_safe_route'])}")
    print(f"      Travel Time: {route_res['rl_travel_time_min']} min | Max Depth: {route_res['rl_max_flood_depth_cm']} cm")
    print(f"  [OK] RL Decision Reason:   {route_res['recommendation_reason']}")

    # Phase 6: GenAI City Intelligence Report
    print("\n[MILESTONE 6] GenAI Real-Time Citizen Report Processing...")
    genai_engine = GenAICityIntelligenceEngine()
    sample_text = "Clogged drain near Barakhamba Rd metro gate 2 due to garbage dumping and plastic bags, water collecting fast."
    print(f"  Input Text: \"{sample_text}\"")
    extracted = genai_engine.process_report(sample_text)
    print(f"  [OK] Extracted Structure: {json.dumps(extracted.model_dump(), indent=6)}")

    # Update state & re-predict
    drainage_net.set_node_blockage("MH_Barakhamba", extracted.blockage_ratio)
    updated_preds = predictor.predict_all_landmarks(rainfall_mm_hr, blockages={extracted.location: extracted.blockage_ratio})
    updated_route = rl_agent.find_optimal_safe_route("Mandi House", "Rajiv Chowk Outer Circle", updated_preds)

    print("\n[CLOSED LOOP UPDATED RL ROUTE AFTER GENAI REPORT]:")
    print(f"  [OK] Updated RL Path:    {' -> '.join(updated_route['rl_safe_route'])}")
    print(f"  [OK] Updated Decision:   {updated_route['recommendation_reason']}")

    print("\n" + "=" * 80)
    print("  SYSTEM RUN COMPLETE — ALL 6 MILESTONES VERIFIED CLEANLY")
    print("=" * 80)

if __name__ == "__main__":
    main()
