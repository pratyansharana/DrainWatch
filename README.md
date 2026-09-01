# DrainWatch: Real-Time Urban Flood Nowcasting System

[![Python Version](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://python.org)
[![React Native](https://img.shields.io/badge/React_Native-Expo-black.svg)](https://expo.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

## Overview
Urban flooding in highly concretized metropolitan areas is a hyper-local phenomenon dictated by micro-topography and underground drainage constraints. Traditional Numerical Weather Prediction (NWP) models forecast rainfall volume but fail to predict street-level inundation. 

DrainWatch is a high-resolution, 0–3 hour real-time urban flood nowcasting system. By replacing computationally heavy 1D/2D hydrodynamic simulations (EPA SWMM) with an Attention-based Spatial-Temporal Graph Convolutional Network (ASTGCN), this system predicts localized street flooding in milliseconds and dynamically reroutes traffic away from hazardous zones.

## Key Features
*   **AI Surrogate Engine (MI Model):** Replaces slow physical equations with a trained machine learning model for instant water depth predictions, updating every 5 minutes.
*   **Citizen's App:** 
    *   Calculates optimal paths with path flagging capabilities.
    *   Displays overall flood maps and offline maps.
    *   Shows which vehicles can pass on certain routes based on ground clearance.
    *   Includes a reporting system with gamification, SOS emergency contacts, and pop-up alerts.
*   **Admin Web Dashboard:** 
    *   Provides a live segmented view of the city map and drainage map.
    *   Displays live and forecasted weather updates.
    *   Features analytics, real-time predictions, citizen grievance tracking, and emergency service routes.
    *   Includes capabilities to ping concerned authorities, alert citizens, and a chatbot for manual update options.
*   **1D/2D Coupled Topology (Static Data):** Maps physical city infrastructure, utilizing constantly updated pipelines and network data.

## System Architecture
The architecture relies on multiple data pipelines feeding into a centralized Web Dashboard, which then interfaces with the Citizen's App and concerned authorities:
1.  **Data Ingestion:** WAPI (Weather API), Maps API, Static Data pipelines (networks, constant updates), and the MI (Machine Intelligence) model feed into the web dashboard.
2.  **Web Dashboard Centralization:** Acts as the hub, processing analytics, generating 5-minute prediction updates, and handling citizen reports/reviews.
3.  **Outputs:** Pings concerned authorities with real-time predictions and provides the Citizen's App with traffic data, optimal paths, and emergency routing.

## Tech Stack
*   **Backend & Data Processing:** Python, Pandas, GeoPandas, OSMnx, NetworkX
*   **Machine Learning:** PyTorch / TensorFlow (ASTGCN implementation)
*   **Hydraulic Modeling (Offline):** EPA SWMM, PySWMM
*   **Frontend & Dashboard:** React Native, Expo, Firebase (Firestore & Cloud Functions)
*   **Mapping UI:** Mapbox GL / Deck.gl

## Data Sources 
*   **Meteorological Data:** ISRO MOSDAC (GSMaP) & IMD Doppler Weather Radar feeds (WAPI).
*   **Terrain (DEM):** ISRO Bhuvan CartoDEM (30m) & LULC datasets.
*   **Road Networks:** OpenStreetMap (OSM) via Python OSMnx (Maps API).
*   **Drainage Topology:** Extracted Municipal `.kml`/`.kmz` vector graphics mapped to mathematical graphs (Static Data).



## Developed By
**Team-MKB_BAAD**  
Artificial Intelligence & Machine Learning  

---
*Built for civic resilience and safer urban navigation.*