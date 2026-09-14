import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCorridorRoadCoordinates } from './roadGeometryData';

// Default API Base URL: Environment variable with local IPv4 fallback
const DEFAULT_API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.111.218.31:8000';
const STORAGE_KEY_API_URL = '@drainwatch_api_base_url';

let currentBaseUrl: string = DEFAULT_API_BASE_URL;

// Initialize base URL from AsyncStorage if available
AsyncStorage.getItem(STORAGE_KEY_API_URL).then((stored) => {
  if (stored && stored.trim()) {
    currentBaseUrl = stored.replace(/\s+/g, '').replace(/\/+$/, '');
    console.log(`[DrainApi] Loaded custom API URL from storage: ${currentBaseUrl}`);
  }
}).catch(() => {});

export function getApiBaseUrl(): string {
  return currentBaseUrl;
}

export async function setApiBaseUrl(newUrl: string): Promise<void> {
  let cleaned = newUrl.replace(/\s+/g, '').replace(/\/+$/, '');
  if (cleaned && !cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  currentBaseUrl = cleaned;
  await AsyncStorage.setItem(STORAGE_KEY_API_URL, cleaned);
  console.log(`[DrainApi] Cleaned and updated API base URL to: ${cleaned}`);
}

// Landmark Coordinates mapped to Pilot Corridor (Mandi House -> Rajiv Chowk)
export const CORRIDOR_LANDMARKS: Record<string, { latitude: number; longitude: number; elevation_m: number }> = {
  "Mandi House": { latitude: 28.6258, longitude: 77.2342, elevation_m: 215.5 },
  "Barakhamba Rd Metro": { latitude: 28.6292, longitude: 77.2275, elevation_m: 214.2 },
  "KG Marg Junction": { latitude: 28.6265, longitude: 77.2235, elevation_m: 214.8 },
  "Tolstoy Marg Junction": { latitude: 28.6278, longitude: 77.2210, elevation_m: 215.2 },
  "Janpath Junction": { latitude: 28.6290, longitude: 77.2185, elevation_m: 214.5 },
  "Rajiv Chowk Outer Circle": { latitude: 28.6328, longitude: 77.2195, elevation_m: 212.8 },
  "Connaught Place Inner Circle": { latitude: 28.6315, longitude: 77.2190, elevation_m: 212.4 },
};

// Response & Request Types
export interface LandmarkPrediction {
  landmark: string;
  predicted_depth_cm: number;
  flood_probability: number;
  time_to_flood_min: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
}

export interface FloodPredictionResponse {
  rainfall_mm_hr: number;
  duration_min: number;
  max_surface_depth_cm: number;
  mean_surface_depth_cm: number;
  landmarks: LandmarkPrediction[];
  active_blockages: Record<string, number>;
  isFallback?: boolean;
}

export interface SafeRouteResponse {
  origin: string;
  destination: string;
  rl_safe_route: string[];
  rl_travel_time_min: number;
  rl_max_flood_depth_cm: number;
  naive_route: string[];
  naive_travel_time_min: number;
  naive_max_flood_depth_cm: number;
  hazard_avoided: boolean;
  recommendation_reason: string;
  isFallback?: boolean;
}

export interface ExtractedEvent {
  location: string;
  blockage_ratio: number;
  hazard_type: string;
  urgency: string;
  confidence: number;
}

export interface CitizenReportResponse {
  extracted_event: ExtractedEvent;
  updated_active_blockages: Record<string, number>;
  updated_predictions: LandmarkPrediction[];
  new_safe_route: SafeRouteResponse;
  isFallback?: boolean;
}

export interface HealthResponse {
  status: string;
  pilot_area: string;
  dem_size: string;
  rl_agent_trained: boolean;
  isFallback?: boolean;
}

// Timeout fetch wrapper (avoids infinite hangs on unreachable network)
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 6000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const customHeaders = {
      'Bypass-Tunnel-Reminder': 'true',
      'User-Agent': 'DrainWatchApp',
      ...((options.headers as Record<string, string>) || {}),
    };
    const response = await fetch(url, {
      ...options,
      headers: customHeaders,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

// 1. Health Check
export async function checkBackendHealth(): Promise<HealthResponse> {
  const base = getApiBaseUrl();
  try {
    const res = await fetchWithTimeout(`${base}/api/v1/health`, { method: 'GET' }, 4000);
    if (res.ok) {
      const data = await res.json();
      return { ...data, isFallback: false };
    }
    throw new Error(`Health check returned status ${res.status}`);
  } catch (error: any) {
    console.warn(`[DrainApi] Backend health check failed (${error?.message}). Using offline state.`);
    return {
      status: 'offline',
      pilot_area: 'Mandi House -> Rajiv Chowk Corridor',
      dem_size: '30x30',
      rl_agent_trained: false,
      isFallback: true,
    };
  }
}

// 2. Flood Prediction
export async function fetchFloodPredictions(
  rainfallMmHr: number = 60.0,
  durationMin: number = 15.0
): Promise<FloodPredictionResponse> {
  const base = getApiBaseUrl();
  console.log(`[DrainApi] Fetching flood predictions (${base}) for ${rainfallMmHr} mm/hr...`);

  try {
    const response = await fetchWithTimeout(`${base}/api/v1/predict-flood`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rainfall_mm_hr: rainfallMmHr, duration_min: durationMin }),
    }, 6000);

    if (response.ok) {
      const data = await response.json();
      console.log(`[DrainApi] Successfully fetched ${data.landmarks?.length ?? 0} landmarks from FastAPI`);
      return { ...data, isFallback: false };
    }
    throw new Error(`Status ${response.status}`);
  } catch (error: any) {
    console.warn(`[DrainApi] Predict flood failed (${error?.message}). Falling back to simulation cache.`);
    return getFallbackFloodPredictions(rainfallMmHr, durationMin);
  }
}

// 3. Safe Route Optimization
export async function fetchSafeRoute(
  origin: string = "Mandi House",
  destination: string = "Rajiv Chowk Outer Circle"
): Promise<SafeRouteResponse> {
  const base = getApiBaseUrl();
  console.log(`[DrainApi] Requesting RL safe route from "${origin}" to "${destination}" via ${base}...`);

  try {
    const response = await fetchWithTimeout(`${base}/api/v1/safe-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination }),
    }, 6000);

    if (response.ok) {
      const data = await response.json();
      console.log(`[DrainApi] RL safe route received:`, data.rl_safe_route);
      return { ...data, isFallback: false };
    }
    throw new Error(`Status ${response.status}`);
  } catch (error: any) {
    console.warn(`[DrainApi] Safe route request failed (${error?.message}). Using surrogate RL cache.`);
    return getFallbackSafeRoute(origin, destination);
  }
}

// Memory cache for road geometries
const roadGeometryCache = new Map<string, { latitude: number; longitude: number }[]>();

// 3b. Real Street-Level Road Polyline Geometry (OSRM Routing Engine + Corridor Geometry)
export async function fetchRoadGeometry(
  nodeNames: string[]
): Promise<{ latitude: number; longitude: number }[]> {
  if (!nodeNames || nodeNames.length < 2) return [];

  // 1. Check precomputed real street geometry for Central Delhi Pilot Corridor (instant & offline)
  const localRoadCoords = getCorridorRoadCoordinates(nodeNames);
  if (localRoadCoords && localRoadCoords.length > 0) {
    console.log(`[DrainApi] Applied real road geometry (${localRoadCoords.length} pts) for route: ${nodeNames.join(' -> ')}`);
    return localRoadCoords;
  }

  const cacheKey = nodeNames.join('->');
  if (roadGeometryCache.has(cacheKey)) {
    return roadGeometryCache.get(cacheKey)!;
  }

  // Collect waypoints
  const points = nodeNames
    .map((name) => CORRIDOR_LANDMARKS[name])
    .filter(Boolean)
    .map((c) => `${c.longitude},${c.latitude}`);

  if (points.length < 2) return [];

  try {
    const coordsStr = points.join(';');
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
    const res = await fetchWithTimeout(osrmUrl, { method: 'GET' }, 3500);

    if (res.ok) {
      const json = await res.json();
      if (json.routes && json.routes[0]?.geometry?.coordinates) {
        const rawCoords: [number, number][] = json.routes[0].geometry.coordinates;
        const mapped = rawCoords.map(([lon, lat]) => ({
          latitude: lat,
          longitude: lon,
        }));
        roadGeometryCache.set(cacheKey, mapped);
        console.log(`[DrainApi] Mapped ${mapped.length} exact road asphalt coordinates for "${cacheKey}"`);
        return mapped;
      }
    }
  } catch (err: any) {
    console.warn(`[DrainApi] OSRM road geometry lookup fallback (${err?.message})`);
  }

  // Fallback: direct landmark waypoints
  const fallbackCoords = nodeNames
    .map((name) => {
      const c = CORRIDOR_LANDMARKS[name];
      return c ? { latitude: c.latitude, longitude: c.longitude } : null;
    })
    .filter(Boolean) as { latitude: number; longitude: number }[];

  return fallbackCoords;
}

// 4. Process Citizen Telemetry Report (GenAI NLP)
export async function processCitizenReport(reportText: string): Promise<CitizenReportResponse> {
  const base = getApiBaseUrl();
  console.log(`[DrainApi] Submitting citizen report to GenAI engine: "${reportText}"...`);

  try {
    const response = await fetchWithTimeout(`${base}/api/v1/process-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_text: reportText }),
    }, 8000);

    if (response.ok) {
      const data = await response.json();
      console.log(`[DrainApi] GenAI extraction success:`, data.extracted_event);
      return { ...data, isFallback: false };
    }
    throw new Error(`Status ${response.status}`);
  } catch (error: any) {
    console.warn(`[DrainApi] Process report failed (${error?.message}). Using local heuristic parser.`);
    return getFallbackCitizenReport(reportText);
  }
}

// --- Physics-Informed Fallback Simulations (Guarantees smooth UX during network/AP isolation) ---

function getFallbackFloodPredictions(rainfallMmHr: number, durationMin: number): FloodPredictionResponse {
  const scale = rainfallMmHr / 50.0;
  const landmarks: LandmarkPrediction[] = [
    { landmark: "Mandi House", predicted_depth_cm: 6.2 * scale, flood_probability: 0.18, time_to_flood_min: 52, risk_level: "LOW", confidence: 0.94 },
    { landmark: "Barakhamba Rd Metro", predicted_depth_cm: 28.4 * scale, flood_probability: 0.88, time_to_flood_min: 14, risk_level: "CRITICAL", confidence: 0.96 },
    { landmark: "KG Marg Junction", predicted_depth_cm: 8.5 * scale, flood_probability: 0.28, time_to_flood_min: 44, risk_level: "LOW", confidence: 0.91 },
    { landmark: "Tolstoy Marg Junction", predicted_depth_cm: 11.2 * scale, flood_probability: 0.42, time_to_flood_min: 35, risk_level: "MEDIUM", confidence: 0.89 },
    { landmark: "Janpath Junction", predicted_depth_cm: 14.8 * scale, flood_probability: 0.55, time_to_flood_min: 28, risk_level: "MEDIUM", confidence: 0.92 },
    { landmark: "Rajiv Chowk Outer Circle", predicted_depth_cm: 32.1 * scale, flood_probability: 0.92, time_to_flood_min: 10, risk_level: "CRITICAL", confidence: 0.97 },
    { landmark: "Connaught Place Inner Circle", predicted_depth_cm: 18.3 * scale, flood_probability: 0.68, time_to_flood_min: 22, risk_level: "HIGH", confidence: 0.90 },
  ];

  return {
    rainfall_mm_hr: rainfallMmHr,
    duration_min: durationMin,
    max_surface_depth_cm: 32.1 * scale,
    mean_surface_depth_cm: 17.1 * scale,
    landmarks,
    active_blockages: { "Barakhamba Rd Metro": 0.65 },
    isFallback: true,
  };
}

function getFallbackSafeRoute(origin: string, destination: string): SafeRouteResponse {
  return {
    origin,
    destination,
    rl_safe_route: [
      "Mandi House",
      "KG Marg Junction",
      "Tolstoy Marg Junction",
      "Janpath Junction",
      "Rajiv Chowk Outer Circle"
    ],
    rl_travel_time_min: 4.8,
    rl_max_flood_depth_cm: 14.8,
    naive_route: [
      "Mandi House",
      "Barakhamba Rd Metro",
      "Rajiv Chowk Outer Circle"
    ],
    naive_travel_time_min: 2.4,
    naive_max_flood_depth_cm: 32.1,
    hazard_avoided: true,
    recommendation_reason: "RL Agent rerouted via KG Marg & Tolstoy Marg to avoid 32.1 cm water hazard on Barakhamba Rd.",
    isFallback: true,
  };
}

function getFallbackCitizenReport(reportText: string): CitizenReportResponse {
  // Simple heuristic location matching
  let location = "Barakhamba Rd Metro";
  const lower = reportText.toLowerCase();
  if (lower.includes("kg") || lower.includes("kasturba")) location = "KG Marg Junction";
  else if (lower.includes("tolstoy")) location = "Tolstoy Marg Junction";
  else if (lower.includes("janpath")) location = "Janpath Junction";
  else if (lower.includes("rajiv") || lower.includes("connaught")) location = "Rajiv Chowk Outer Circle";
  else if (lower.includes("mandi")) location = "Mandi House";

  const extracted: ExtractedEvent = {
    location,
    blockage_ratio: 0.75,
    hazard_type: "Solid Waste Drain Clogging",
    urgency: "HIGH",
    confidence: 0.88,
  };

  const safeRoute = getFallbackSafeRoute("Mandi House", "Rajiv Chowk Outer Circle");

  return {
    extracted_event: extracted,
    updated_active_blockages: { [location]: 0.75 },
    updated_predictions: getFallbackFloodPredictions(60.0, 15.0).landmarks,
    new_safe_route: safeRoute,
    isFallback: true,
  };
}