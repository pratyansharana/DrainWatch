# 🌊 Flood & Furious | NCT of Delhi Flood Disaster Authority Command & Control System

> A mission-critical, full-stack real-time situational awareness, flood forecasting, and emergency dispatch platform built exclusively for the **National Capital Territory of Delhi (NCT of Delhi)** flood management authorities: **DDMA**, **I&FC Department**, **NDRF 8th Battalion**, **Delhi Traffic Police**, **Delhi Fire Service**, **DJB**, **PWD Delhi**, and **MCD**.

Built directly according to the project architecture diagram and enterprise specifications:
- **Frontend**: React.js 18 + Tailwind CSS (100% SVG & Lucide vector graphics, **zero PNGs/photos**)
- **GIS / Maps**: MapLibre GL JS (Vector Map, GeoJSON Polygons & Drainage Lines for NCT of Delhi)
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL + PostGIS (Spatial queries with explicit PostGIS `SELECT` statements and high-fidelity fallback)
- **Caching**: Redis (with automatic in-memory TTL fallback)
- **Real-Time Gateway**: Socket.IO / WebSockets
- **Authentication**: JWT & Role-Based Access Control
- **Routing**: Safe Emergency Service Routing with OSRM + flood ground clearance avoidance
- **Deployment**: Docker (`docker-compose.yml`) + AWS Production Architecture

---

## 🎯 Architecture Diagram Mapping & Features

| Diagram Component | Implementation in Platform |
| :--- | :--- |
| **W API (Weather API)** | Real-time weather telemetry from IMD Safdarjung & Palam with automated **15-minute rainfall checks**, Doppler storm alert levels, and precipitation forecasts. |
| **ML Model (Prediction - Realtime)** | **5-minute hydrodynamic flood prediction engine** calculating runoff ($Q = C \times I \times A$), drainage outflow, soil absorption, and sector flood risk. |
| **Static Data - Pipelines, Network** | Delhi stormwater drainage network GeoJSON (Najafgarh Trunk Drain, Barapullah Drain, Supplementary Drain, Shahdara Drain) with pipe diameters, flow ($m^3/s$), load %, and pump station SCADA controls. |
| **Live Segmented View of City Map** | Interactive **MapLibre GL JS** vector map displaying color-coded Delhi segments (Yamuna Floodplain, Kashmere Gate ISBT, Minto Bridge, ITO Junction, Pul Prahladpur, Mayur Vihar). |
| **Ping Concerned Auth.** | Direct encrypted inter-agency dispatch hotlines for **DDMA, I&FC, NDRF 8th Battalion, Delhi Traffic Police, DFS, DJB, PWD, and MCD** with live acknowledgment tracking. |
| **Alerts to the Citizen** | Multi-channel broadcast composer (Citizen App Push, Emergency SMS, Traffic VMS Roadside Displays, Public Sirens). |
| **Citizen's Grievances Desk** | Crowdsourced grievance review desk inspecting waterlogged locations, water depth in cm, and **Vehicle Ground Clearance** warnings. |
| **Routes for Emergency Services** | OSRM routing engine with **vehicle ground clearance thresholds** (CATS Ambulance: 22cm, PCR Cruiser: 18cm, Fire Tender: 50cm, NDRF 4x4 Truck: 85cm) dynamically bypassing flooded sectors. |
| **Chatbot for Manual Options & Updates** | Authority AI Command Copilot allowing operators to query live flood metrics, trigger warnings, adjust pumps, or run cloudburst simulations in plain English. |
| **Analytics ---** | Executive charts correlating hourly rainfall vs waterlogging depth, Yamuna river level at Old Railway Bridge (Danger mark 205.33m), and incident resolution velocity. |

---

## 📁 Repository Structure

```
flood-authority-platform/
├── backend/
│   ├── src/
│   │   ├── config/          # PostgreSQL + PostGIS & Redis clients with fallback
│   │   ├── controllers/     # Business logic
│   │   ├── data/            # Spatial GeoJSON seed data (segments, pipelines, pumps)
│   │   ├── routes/          # REST API endpoints (auth, segments, weather, drainage, etc.)
│   │   ├── services/        # 5-min ML prediction loop, OSRM safe router, Socket.IO
│   │   └── server.js        # Express + HTTP + Socket.IO server
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Analytics/   # Recharts telemetry graphs
│   │   │   ├── Chat/        # Authority AI Copilot chatbot
│   │   │   ├── Drainage/    # Pump station SCADA & pipeline load gauges
│   │   │   ├── Emergency/   # Safe transit route planner with clearance filters
│   │   │   ├── Grievances/  # Citizen waterlogging review queue
│   │   │   ├── Map/         # MapLibre GL JS vector command map
│   │   │   ├── ML/          # 5-min ML prediction countdown & cloudburst slider
│   │   │   ├── Modals/      # Ping authorities modal & Citizen alert broadcaster
│   │   │   ├── Weather/     # Live W API widget & 15-min check
│   │   │   └── Navbar.jsx   # Top command bar with role switcher
│   │   ├── context/         # AuthContext & SocketContext
│   │   ├── App.jsx          # Main operations view
│   │   └── index.css        # Custom styles & MapLibre popup themes
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── aws/
│   └── DEPLOYMENT_GUIDE.md  # AWS ECS Fargate, RDS PostGIS, ElastiCache, S3 CloudFront
├── docker-compose.yml       # Complete multi-container orchestration
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Start the Backend API & WebSocket Server
```bash
cd backend
npm install
npm start
```
*The backend starts on `http://localhost:5000` with real-time Socket.IO and the 5-minute prediction engine.*

### 2. Start the Frontend React Application
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
*Open `http://localhost:3000` in your browser.*

---

## 🐳 Quick Start with Docker Compose

To launch the complete containerized environment with PostgreSQL + PostGIS, Redis, Backend, and Frontend:
```bash
docker-compose up --build -d
```
- **Authority Dashboard**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`

---

## 🛡️ Pre-Configured Authority User Profiles

Use the role switcher in the top right navbar to test different authority viewpoints:
1. **Sunil Shinde** (`MUNICIPAL_DISASTER_COMMISSIONER`) - Municipal Disaster Management
2. **Col. R. K. Verma** (`NDRF_COMMANDER`) - 5th Battalion Rescue Operations
3. **Sneha Sawant** (`TRAFFIC_POLICE_DCP`) - City Traffic Control & Diversions