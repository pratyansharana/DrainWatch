"""
Configuration parameters for the Mandi House -> Rajiv Chowk Urban Flood Intelligence Pilot
"""

import numpy as np

# Bounding Box for Mandi House -> Rajiv Chowk corridor (Central Delhi)
BOUNDS = {
    "min_lat": 28.6240,
    "max_lat": 28.6360,
    "min_lon": 77.2140,
    "max_lon": 77.2360,
}

# Pilot Grid Settings
GRID_ROWS = 30  # North-South resolution (~40m per cell)
GRID_COLS = 30  # East-West resolution (~45m per cell)

# Runoff Coefficients (Rational Method C)
RUNOFF_COEFFICIENTS = {
    "road_asphalt": 0.90,
    "building_dense": 0.85,
    "paved_walkway": 0.70,
    "park_green": 0.15,
    "bare_soil": 0.35,
}

# Soil Infiltration Defaults (Horton / Green-Ampt approximation)
DEFAULT_INFILTRATION_RATE_MM_HR = 5.0

# Road Graph Key Landmarks & Nodes
LANDMARKS = {
    "Mandi House": {"lat": 28.6258, "lon": 77.2342, "elevation_m": 215.5, "grid_pos": (24, 27)},
    "Barakhamba Rd Metro": {"lat": 28.6292, "lon": 77.2275, "elevation_m": 214.2, "grid_pos": (16, 19)},
    "KG Marg Junction": {"lat": 28.6265, "lon": 77.2235, "elevation_m": 214.8, "grid_pos": (22, 13)},
    "Tolstoy Marg Junction": {"lat": 28.6278, "lon": 77.2210, "elevation_m": 215.2, "grid_pos": (19, 9)},
    "Janpath Junction": {"lat": 28.6290, "lon": 77.2185, "elevation_m": 214.5, "grid_pos": (16, 6)},
    "Rajiv Chowk Outer Circle": {"lat": 28.6328, "lon": 77.2195, "elevation_m": 212.8, "grid_pos": (7, 7)},
    "Connaught Place Inner Circle": {"lat": 28.6315, "lon": 77.2190, "elevation_m": 212.4, "grid_pos": (10, 6)},
}

# Road Segments between nodes (distance in meters, normal speed limit km/h)
ROAD_EDGES = [
    ("Mandi House", "Barakhamba Rd Metro", {"distance_m": 750, "speed_kmh": 50, "capacity": 1.0}),
    ("Mandi House", "KG Marg Junction", {"distance_m": 1000, "speed_kmh": 50, "capacity": 1.0}),
    ("Barakhamba Rd Metro", "Rajiv Chowk Outer Circle", {"distance_m": 850, "speed_kmh": 40, "capacity": 1.0}),
    ("KG Marg Junction", "Tolstoy Marg Junction", {"distance_m": 350, "speed_kmh": 40, "capacity": 1.0}),
    ("Tolstoy Marg Junction", "Janpath Junction", {"distance_m": 300, "speed_kmh": 40, "capacity": 1.0}),
    ("Janpath Junction", "Rajiv Chowk Outer Circle", {"distance_m": 450, "speed_kmh": 45, "capacity": 1.0}),
    ("Rajiv Chowk Outer Circle", "Connaught Place Inner Circle", {"distance_m": 150, "speed_kmh": 30, "capacity": 1.0}),
    ("Barakhamba Rd Metro", "Tolstoy Marg Junction", {"distance_m": 600, "speed_kmh": 45, "capacity": 1.0}),
]

# Drainage Network Constants
MANNING_N_CONCRETE_PIPE = 0.013  # Roughness coefficient for concrete storm drains
DEFAULT_PIPE_DIAMETER_M = 1.2    # Standard main trunk drain diameter
DEFAULT_INLET_CAPACITY_M3_MIN = 2.5 # Max intake per street inlet box
