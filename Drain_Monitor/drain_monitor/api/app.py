"""
FastAPI REST Application for Urban Flood Intelligence & RL Safe Routing system.
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os

from drain_monitor.terrain.dem_generator import DEMGenerator
from drain_monitor.terrain.flow_engine import TerrainFlowEngine
from drain_monitor.hydrology.runoff_engine import RunoffEngine
from drain_monitor.drainage.drainage_graph import DrainageNetworkGraph
from drain_monitor.drainage.surface_coupling import SurfaceDrainageCoupler
from drain_monitor.predictor.flood_model import FloodPredictionEngine
from drain_monitor.rl_engine.route_agent import RLRouteOptimizer
from drain_monitor.genai.intelligence import GenAICityIntelligenceEngine

app = FastAPI(
    title="DrainMonitor: Mandi House -> Rajiv Chowk AI Flood Intelligence API",
    version="1.0.0",
    description="Physics-informed hydrology, D8 terrain flow, 1D pipe hydraulics, ML surrogate flood predictor, RL safe route optimizer, and GenAI city intelligence."
)

# Global State Container
class SystemState:
    def __init__(self):
        self.dem_gen = DEMGenerator()
        self.dem = self.dem_gen.generate_dem()
        self.landuse, self.c_matrix = self.dem_gen.generate_landuse_and_runoff_coefficients()
        
        self.flow_engine = TerrainFlowEngine(self.dem)
        self.runoff_engine = RunoffEngine(self.c_matrix)
        self.drainage_net = DrainageNetworkGraph()
        self.coupler = SurfaceDrainageCoupler(self.flow_engine, self.drainage_net)
        
        self.flood_predictor = FloodPredictionEngine()
        
        self.rl_optimizer = RLRouteOptimizer()
        self.rl_optimizer.train_agent(episodes=300)
        
        self.genai_engine = GenAICityIntelligenceEngine()

        self.current_rainfall_mm_hr = 40.0
        self.active_blockages = {}
        self.latest_reports = []

state = SystemState()

# Request Schemas
class FloodPredictRequest(BaseModel):
    rainfall_mm_hr: float = 50.0
    duration_min: float = 15.0

class RouteRequest(BaseModel):
    origin: str = "Mandi House"
    destination: str = "Rajiv Chowk Outer Circle"

class ReportRequest(BaseModel):
    report_text: str

# API Endpoints
@app.get("/api/v1/health")
def health_check():
    return {
        "status": "online",
        "pilot_area": "Mandi House -> Rajiv Chowk Corridor",
        "dem_size": f"{state.flow_engine.rows}x{state.flow_engine.cols}",
        "rl_agent_trained": True
    }

@app.post("/api/v1/predict-flood")
def predict_flood(req: FloodPredictRequest):
    state.current_rainfall_mm_hr = req.rainfall_mm_hr
    
    # 1. Physics Runoff Computation
    runoff_m3 = state.runoff_engine.compute_cell_runoff(req.rainfall_mm_hr, req.duration_min)
    
    # 2. Hydraulics & Surface Coupling Simulation
    coupling_res = state.coupler.simulate_surface_drainage_coupling(runoff_m3, req.duration_min)
    
    # 3. ML Surrogate Predictions for Landmarks
    landmarks_pred = state.flood_predictor.predict_all_landmarks(
        req.rainfall_mm_hr,
        blockages=state.active_blockages
    )

    return {
        "rainfall_mm_hr": req.rainfall_mm_hr,
        "duration_min": req.duration_min,
        "max_surface_depth_cm": coupling_res["max_depth_cm"],
        "mean_surface_depth_cm": coupling_res["mean_depth_cm"],
        "landmarks": landmarks_pred,
        "active_blockages": state.active_blockages
    }

@app.post("/api/v1/safe-route")
def get_safe_route(req: RouteRequest):
    # Predict landmark flood depths
    preds = state.flood_predictor.predict_all_landmarks(
        state.current_rainfall_mm_hr,
        blockages=state.active_blockages
    )
    
    route_result = state.rl_optimizer.find_optimal_safe_route(
        origin=req.origin,
        destination=req.destination,
        flood_predictions=preds
    )
    
    return route_result

@app.post("/api/v1/process-report")
def process_citizen_report(req: ReportRequest):
    # 1. GenAI Extraction
    extracted_event = state.genai_engine.process_report(req.report_text)
    
    # 2. Update System Blockage State
    loc = extracted_event.location
    state.active_blockages[loc] = extracted_event.blockage_ratio
    state.latest_reports.append(extracted_event.model_dump())

    # 3. Update Drainage Graph node blockage
    node_id_map = {
        "Mandi House": "MH_MandiHouse",
        "Barakhamba Rd Metro": "MH_Barakhamba",
        "KG Marg Junction": "MH_KGMarg",
        "Tolstoy Marg Junction": "MH_Tolstoy",
        "Janpath Junction": "MH_Janpath",
        "Rajiv Chowk Outer Circle": "MH_RajivChowk",
        "Connaught Place Inner Circle": "MH_CPInner"
    }

    if loc in node_id_map:
        state.drainage_net.set_node_blockage(node_id_map[loc], extracted_event.blockage_ratio)

    # 4. Trigger Instant Re-prediction & Safe Route Rerouting
    updated_preds = state.flood_predictor.predict_all_landmarks(
        state.current_rainfall_mm_hr,
        blockages=state.active_blockages
    )

    rerouted_result = state.rl_optimizer.find_optimal_safe_route(
        origin="Mandi House",
        destination="Rajiv Chowk Outer Circle",
        flood_predictions=updated_preds
    )

    return {
        "extracted_event": extracted_event.model_dump(),
        "updated_active_blockages": state.active_blockages,
        "updated_predictions": updated_preds,
        "new_safe_route": rerouted_result
    }

@app.get("/api/v1/terrain-flow")
def get_terrain_flow_summary():
    return state.flow_engine.get_summary()

@app.get("/api/v1/drainage-network")
def get_drainage_network_summary():
    nodes = list(state.drainage_net.graph.nodes(data=True))
    edges = list(state.drainage_net.graph.edges(data=True))
    return {
        "nodes": [{"id": n, **data} for n, data in nodes],
        "edges": [{"from": u, "to": v, **data} for u, v, data in edges]
    }

dashboard_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "dashboard")

@app.get("/", response_class=HTMLResponse)
def serve_dashboard():
    index_file = os.path.join(dashboard_dir, "index.html")
    if os.path.exists(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>DrainMonitor API Server Online</h1><p>Dashboard HTML loading...</p>"
# Mount static files (CSS, JS) from the dashboard directory
app.mount("/", StaticFiles(directory=dashboard_dir), name="dashboard-static")
