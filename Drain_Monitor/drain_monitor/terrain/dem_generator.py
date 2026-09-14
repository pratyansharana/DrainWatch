"""
Digital Elevation Model (DEM) and Land Cover Generator for Mandi House -> Rajiv Chowk Corridor.
"""

import numpy as np
from drain_monitor.config import GRID_ROWS, GRID_COLS, LANDMARKS, RUNOFF_COEFFICIENTS

class DEMGenerator:
    """
    Generates realistic elevation (DEM) and land-use rasters for Mandi House -> Rajiv Chowk pilot corridor.
    """
    def __init__(self, rows: int = GRID_ROWS, cols: int = GRID_COLS):
        self.rows = rows
        self.cols = cols
        self.cell_area_m2 = 35.0 * 40.0  # Cell spatial area (~1400 m2)

    def generate_dem(self) -> np.ndarray:
        """
        Creates elevation matrix in meters above sea level (masl).
        Mandi House (East, high) -> Rajiv Chowk (West/Northwest, low) with local depressions.
        """
        r_indices = np.arange(self.rows).reshape(-1, 1)
        c_indices = np.arange(self.cols).reshape(1, -1)

        # Regional slope gradient: High elevation at East (cols=29) and South (rows=29)
        # Drop towards Northwest (Rajiv Chowk area, rows 5-10, cols 5-10)
        base_elevation = 216.0 - (29 - c_indices) * 0.10 - (29 - r_indices) * 0.04

        # Add specific micro-topographical features
        dem = base_elevation.astype(np.float64)

        # Feature 1: Rajiv Chowk / CP Low Bowl (Subway underpass low point)
        rc_r, rc_c = LANDMARKS["Rajiv Chowk Outer Circle"]["grid_pos"]
        dist_rc = np.sqrt((r_indices - rc_r)**2 + (c_indices - rc_c)**2)
        dem -= 1.8 * np.exp(-dist_rc**2 / 18.0)  # Low depression around CP circle

        # Feature 2: Connaught Place Inner Circle subway core drop
        cp_r, cp_c = LANDMARKS["Connaught Place Inner Circle"]["grid_pos"]
        dist_cp = np.sqrt((r_indices - cp_r)**2 + (c_indices - cp_c)**2)
        dem -= 1.2 * np.exp(-dist_cp**2 / 10.0)

        # Feature 3: Tolstoy Marg ridge (High ground barrier)
        tm_r, tm_c = LANDMARKS["Tolstoy Marg Junction"]["grid_pos"]
        dist_tm = np.sqrt((r_indices - tm_r)**2 + (c_indices - tm_c)**2)
        dem += 0.8 * np.exp(-dist_tm**2 / 15.0)

        # Feature 4: Barakhamba Metro underpass local low spot
        bk_r, bk_c = LANDMARKS["Barakhamba Rd Metro"]["grid_pos"]
        dist_bk = np.sqrt((r_indices - bk_r)**2 + (c_indices - bk_c)**2)
        dem -= 0.7 * np.exp(-dist_bk**2 / 8.0)

        return np.round(dem, 2)

    def generate_landuse_and_runoff_coefficients(self) -> tuple[np.ndarray, np.ndarray]:
        """
        Generates land-use category map and corresponding Rational Method runoff coefficient (C) map.
        Categories: road_asphalt (0.90), building_dense (0.85), paved_walkway (0.70), park_green (0.15)
        """
        landuse = np.full((self.rows, self.cols), "building_dense", dtype=object)
        c_matrix = np.full((self.rows, self.cols), RUNOFF_COEFFICIENTS["building_dense"], dtype=np.float64)

        # Define main road corridors (Barakhamba Rd, Kasturba Gandhi Marg, Tolstoy Marg, Janpath, CP Circle)
        # Barakhamba Rd (Mandi House (24,27) -> Barakhamba Metro (16,19) -> CP (7,7))
        for t in np.linspace(0, 1, 50):
            r1 = int(round(24 * (1 - t) + 16 * t))
            c1 = int(round(27 * (1 - t) + 19 * t))
            r2 = int(round(16 * (1 - t) + 7 * t))
            c2 = int(round(19 * (1 - t) + 7 * t))
            for dr in [-1, 0, 1]:
                for dc in [-1, 0, 1]:
                    if 0 <= r1+dr < self.rows and 0 <= c1+dc < self.cols:
                        landuse[r1+dr, c1+dc] = "road_asphalt"
                        c_matrix[r1+dr, c1+dc] = RUNOFF_COEFFICIENTS["road_asphalt"]
                    if 0 <= r2+dr < self.rows and 0 <= c2+dc < self.cols:
                        landuse[r2+dr, c2+dc] = "road_asphalt"
                        c_matrix[r2+dr, c2+dc] = RUNOFF_COEFFICIENTS["road_asphalt"]

        # Tolstoy Marg Corridor (KG Marg (22,13) -> Tolstoy (19,9) -> Janpath (16,6))
        for t in np.linspace(0, 1, 40):
            r = int(round(22 * (1 - t) + 16 * t))
            c = int(round(13 * (1 - t) + 6 * t))
            for dr in [-1, 0, 1]:
                for dc in [-1, 0, 1]:
                    if 0 <= r+dr < self.rows and 0 <= c+dc < self.cols:
                        landuse[r+dr, c+dc] = "road_asphalt"
                        c_matrix[r+dr, c+dc] = RUNOFF_COEFFICIENTS["road_asphalt"]

        # Greenery / Central Parks around Central Park CP and Mandi House circle
        for r, c in [(7, 7), (8, 7), (7, 8), (24, 27), (25, 27), (24, 28)]:
            if 0 <= r < self.rows and 0 <= c < self.cols:
                landuse[r, c] = "park_green"
                c_matrix[r, c] = RUNOFF_COEFFICIENTS["park_green"]

        return landuse, c_matrix
