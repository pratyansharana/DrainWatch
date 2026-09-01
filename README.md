# DrainWatch: Real-Time Urban Flood Nowcasting System

[![Python Version](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://python.org)
[![React Native](https://img.shields.io/badge/React_Native-Expo-black.svg)](https://expo.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

## Overview
Urban flooding in highly concretized metropolitan areas is a hyper-local phenomenon dictated by micro-topography and underground drainage constraints. Traditional Numerical Weather Prediction (NWP) models forecast rainfall volume but fail to predict street-level inundation. 

DrainWatch is a high-resolution, 0–3 hour real-time urban flood nowcasting system. By replacing computationally heavy 1D/2D hydrodynamic simulations (EPA SWMM) with an Attention-based Spatial-Temporal Graph Convolutional Network (ASTGCN), this system predicts localized street flooding in milliseconds and dynamically reroutes traffic away from hazardous zones.

## Key Features
*   **AI Surrogate Engine:** Replaces slow physical equations with a trained Graph Neural Network for instant water depth predictions.
*   **Dynamic API Routing:** Integrates with mapping navigation algorithms to automatically apply infinite cost weights to road edges predicting >15cm of water.
*   **Real-Time Dashboard:** A React Native-powered mobile interface and web GIS dashboard showing street-by-street inundation heatmaps.
*   **1D/2D Coupled Topology:** Maps physical city infrastructure, treating manholes/catch basins as nodes and underground pipes as directed graph edges.

## System Architecture
1.  **Offline Ground Truth Generation:** Physical simulation of synthetic storms using EPA SWMM to model 1D underground pipe surcharge and 2D surface overland flow.
2.  **Online GNN Surrogate:** Live Doppler radar feeds directly into the trained ASTGCN model to output real-time hydraulic head and node surcharge volumes.
3.  **Frontend/API Distribution:** Live flood depth vectors are synchronized via Firebase to power the React Native GIS dashboard and update OSMnx road network weights.

## Tech Stack
*   **Backend & Data Processing:** Python, Pandas, GeoPandas, OSMnx, NetworkX
*   **Machine Learning:** PyTorch / TensorFlow (ASTGCN implementation)
*   **Hydraulic Modeling (Offline):** EPA SWMM, PySWMM
*   **Frontend & Dashboard:** React Native, Expo, Firebase (Firestore & Cloud Functions)
*   **Mapping UI:** Mapbox GL / Deck.gl

## Data Sources 
*   **Meteorological Data:** ISRO MOSDAC (GSMaP) & IMD Doppler Weather Radar feeds.
*   **Terrain (DEM):** ISRO Bhuvan CartoDEM (30m) & LULC datasets.
*   **Road Networks:** OpenStreetMap (OSM) via Python OSMnx.
*   **Drainage Topology:** Extracted Municipal `.kml`/`.kmz` vector graphics mapped to mathematical graphs.



## Roadmap
- [x] Extract 1D drainage `.kml` files into directed graphs.
- [x] Configure PySWMM offline coupling for historical rain data.
- [ ] Train ASTGCN surrogate on generated node-surcharge dataset.
- [ ] Deploy dynamic edge-weight routing API.
- [ ] Finalize React Native EAS build for mobile dashboard.

## Developed By
**Team MKB-BAAD**  
Artificial Intelligence & Machine Learning  

---
*Built for civic resilience and safer urban navigation.*