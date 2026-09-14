# DrainMonitor: Urban Flood Intelligence & RL Decision System

> **Pilot Corridor**: Mandi House ➔ Rajiv Chowk (Central Delhi)  
> Physics-informed hydrology, D8 terrain surface flow, 1D pipe hydraulics, ML surrogate flood prediction, Reinforcement Learning safe route optimization, and GenAI city intelligence.

---

## Architecture Overview

```
                         ┌─────────────────────┐
                         │ WEATHER / RAINFALL  │
                         │      NOWCAST        │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ 1. RAINFALL →       │
                         │    RUNOFF ENGINE    │ (Rational Method + Physics Runoff + ML Correction)
                         └──────────┬──────────┘
                                    │
                                    ▼
┌─────────────┐          ┌─────────────────────┐
│ DEM /       │─────────▶│ 2. TERRAIN & WATER  │
│ TOPOGRAPHY  │          │    FLOW ENGINE      │ (D8 Flow Direction, Accumulation, Surface Graph)
└─────────────┘          └──────────┬──────────┘
                                    │
┌─────────────┐                     │
│ DRAINAGE    │─────────────────────┤
│ GRAPH       │                     │
└─────────────┘                     ▼
                         ┌─────────────────────┐
                         │ 3. DRAINAGE COUPLING│
                         │    & HYDRAULICS     │ (Pipe Capacities, Inlets, Surcharge & Excess Water)
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ 4. FLOOD PREDICTION │
                         │    ML SURROGATE     │ (XGBoost/RF Regressor: Depth, Risk, Time-to-Flood)
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ FLOOD STATE (0-3h)  │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┴──────────────┐
                    ▼                              ▼
          ┌───────────────────┐          ┌──────────────────┐
          │ 5. RL DECISION    │          │ 6. GENAI CITY    │
          │ / ROUTE OPTIMIZER │          │ INTELLIGENCE     │
          └─────────┬─────────┘          └────────┬─────────┘
                    │                             │
                    ▼                             ▼
               SAFE ROUTES                  STRUCTURED EVENTS
            (Mandi House ➔                   (Blockages, Construction,
             Rajiv Chowk)                    Capacity Updates)
```

---

## Key Features

1. **Model 1: Rainfall → Runoff Engine** (`drain_monitor/hydrology/runoff_engine.py`)
   - Implements the physics-based Rational Method ($Q = C \cdot I \cdot A$) with land-use imperviousness classification ($C_{\text{asphalt}}=0.90$, $C_{\text{building}}=0.85$, $C_{\text{park}}=0.15$) and an ML error-correction layer.
2. **Model 2: Terrain Water Flow Engine** (`drain_monitor/terrain/flow_engine.py`)
   - Sub-meter DEM topography, D8 steepest-descent flow direction vectors, flow accumulation matrix, and dynamic `NetworkX` Surface Flow Graph.
3. **Model 3: Drainage Graph & Surface Coupling** (`drain_monitor/drainage/surface_coupling.py`)
   - 1D Directed Pipe Network Graph solving Manning hydraulic flow ($Q_{\text{max}} = \frac{1}{n} A R^{2/3} S^{1/2}$), pipe surcharges, and surface water back-ups.
4. **Model 4: Flood Prediction Engine** (`drain_monitor/predictor/flood_model.py`)
   - Fast ML surrogate model predicting continuous street-level depth ($cm$), flood probability, time-to-flood ($min$), drainage stress ($\%$), and risk levels (`LOW` to `CRITICAL`).
5. **Model 5: RL Safe Route Optimization** (`drain_monitor/rl_engine/route_agent.py`)
   - Custom Gymnasium environment (`MandiHouseToRajivChowkEnv`) + Q-learning policy evaluating travel time vs. depth risk penalties (comparing **Naive Shortest Path** vs. **RL Safe Route**).
6. **Model 6: GenAI City Intelligence Layer** (`drain_monitor/genai/intelligence.py`)
   - Natural language extraction parsing unstructured citizen text reports into structured JSON events and triggering live closed-loop rerouting.
7. **Interactive Web Dashboard & REST API** (`dashboard/` & `drain_monitor/api/app.py`)
   - FastAPI server + modern dark-mode canvas dashboard running at `http://localhost:8000`.

---

## Quick Start

### 1. Installation
```bash
git clone https://github.com/DevanshMishra-12/drain_monitor.git
cd drain_monitor
pip install -r requirements.txt
```

### 2. Run Automated Test Suite
```bash
python -m pytest tests/
```

### 3. Run Master End-to-End Pipeline Demo
```bash
python run_pipeline.py
```

### 4. Launch API Server & Interactive Web Dashboard
```bash
uvicorn drain_monitor.api.app:app --host 127.0.0.1 --port 8000
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.
