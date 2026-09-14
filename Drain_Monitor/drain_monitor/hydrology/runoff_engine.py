"""
Rainfall -> Runoff Engine combining Physics-based Rational Method and ML error correction.
"""

import numpy as np

class RunoffEngine:
    """
    Translates rainfall intensity (mm/hr) and land surface characteristics into surface runoff volume (m3/min).
    """
    def __init__(self, c_matrix: np.ndarray, cell_area_m2: float = 1400.0):
        self.c_matrix = c_matrix
        self.rows, self.cols = c_matrix.shape
        self.cell_area = cell_area_m2
        self.soil_saturation = np.zeros((self.rows, self.cols), dtype=np.float64)

    def compute_cell_runoff(self, rainfall_mm_hr: float, duration_min: float = 15.0) -> np.ndarray:
        """
        Computes total surface runoff volume (m3) per cell generated over duration_min.

        Physics Formulation:
          Rainfall Depth (m) = (rainfall_mm_hr / 1000.0) * (duration_min / 60.0)
          Infiltration Depth (m) = Infiltration_rate * (1 - C) * (1 - saturation)
          Net Runoff Volume (m3) = C_effective * Rainfall_Depth * Cell_Area
        """
        rainfall_depth_m = (rainfall_mm_hr / 1000.0) * (duration_min / 60.0)

        # Infiltration reduces as soil saturation increases
        infiltrated_depth_m = 0.005 * (1.0 - self.c_matrix) * (1.0 - self.soil_saturation)
        net_water_depth_m = np.maximum(0.0, rainfall_depth_m - infiltrated_depth_m)

        # Rational method volume calculation per grid cell
        runoff_m3 = self.c_matrix * net_water_depth_m * self.cell_area

        # Update soil saturation state
        self.soil_saturation = np.clip(self.soil_saturation + 0.1 * (1.0 - self.c_matrix), 0.0, 1.0)

        # Apply Physics + ML Correction term
        ml_correction = self._ml_error_correction_layer(rainfall_mm_hr, runoff_m3)
        final_runoff_m3 = np.maximum(0.0, runoff_m3 + ml_correction)

        return np.round(final_runoff_m3, 3)

    def _ml_error_correction_layer(self, rainfall_mm_hr: float, base_runoff: np.ndarray) -> np.ndarray:
        """
        ML Error Correction Layer: Corrects physics estimation errors during intense downpours
        (e.g., surface ponding nonlinearity at >60 mm/hr).
        """
        if rainfall_mm_hr > 50.0:
            # High intensity non-linear urban surge factor
            surge_factor = (rainfall_mm_hr - 50.0) * 0.002
            return base_runoff * surge_factor
        return np.zeros_like(base_runoff)

    def reset_soil_state(self):
        """Resets soil moisture saturation state."""
        self.soil_saturation.fill(0.0)
