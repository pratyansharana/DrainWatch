import axios from 'axios';

// Realistic fallback spatial & telemetry data for NCT of Delhi
export const FALLBACK_SEGMENTS = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "delhi-seg-1",
      properties: {
        id: "delhi-seg-1",
        name: "Yamuna Floodplain & Kashmere Gate (ISBT)",
        code: "DEL-YAM-01",
        elevation_m: 204,
        current_water_level_cm: 88,
        risk_level: "CRITICAL",
        population: 320000,
        critical_infrastructure: ["Kashmere Gate Metro & ISBT", "Monastery Market", "Old Yamuna Railway Bridge (Loha Pul)"]
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.2200, 28.6650],
            [77.2500, 28.6680],
            [77.2550, 28.6400],
            [77.2300, 28.6380],
            [77.2200, 28.6650]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "delhi-seg-2",
      properties: {
        id: "delhi-seg-2",
        name: "Minto Bridge & Central Connaught Place",
        code: "DEL-CP-02",
        elevation_m: 214,
        current_water_level_cm: 75,
        risk_level: "CRITICAL",
        population: 410000,
        critical_infrastructure: ["Minto Bridge Underpass", "New Delhi Railway Station", "Connaught Place Inner Circle"]
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.2100, 28.6250],
            [77.2350, 28.6280],
            [77.2380, 28.6450],
            [77.2150, 28.6420],
            [77.2100, 28.6250]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "delhi-seg-3",
      properties: {
        id: "delhi-seg-3",
        name: "ITO Junction & Pragati Maidan / Bhairon Marg",
        code: "DEL-ITO-03",
        elevation_m: 206,
        current_water_level_cm: 45,
        risk_level: "HIGH",
        population: 280000,
        critical_infrastructure: ["Delhi Police HQ", "Supreme Court of India", "ITO Drain Outfall Regulator 12"]
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.2350, 28.6150],
            [77.2600, 28.6180],
            [77.2550, 28.6380],
            [77.2300, 28.6350],
            [77.2350, 28.6150]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "delhi-seg-4",
      properties: {
        id: "delhi-seg-4",
        name: "Najafgarh Drain Basin & West Delhi",
        code: "DEL-NAJ-04",
        elevation_m: 218,
        current_water_level_cm: 42,
        risk_level: "MODERATE",
        population: 580000,
        critical_infrastructure: ["Najafgarh Outfall Channel", "Janakpuri Super Speciality Hospital", "Uttam Nagar Terminal"]
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.0800, 28.6200],
            [77.1400, 28.6250],
            [77.1350, 28.6700],
            [77.0750, 28.6650],
            [77.0800, 28.6200]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "delhi-seg-5",
      properties: {
        id: "delhi-seg-5",
        name: "Barapullah Basin & South Delhi (Nizamuddin)",
        code: "DEL-BAR-05",
        elevation_m: 212,
        current_water_level_cm: 48,
        risk_level: "MODERATE",
        population: 460000,
        critical_infrastructure: ["Barapullah Elevated Corridor", "Hazrat Nizamuddin Station", "Sarai Kale Khan RRTS Hub"]
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.2200, 28.5700],
            [77.2650, 28.5750],
            [77.2680, 28.6050],
            [77.2250, 28.6000],
            [77.2200, 28.5700]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "delhi-seg-8",
      properties: {
        id: "delhi-seg-8",
        name: "Pul Prahladpur & Okhla Industrial Canal",
        code: "DEL-OKH-08",
        elevation_m: 215,
        current_water_level_cm: 65,
        risk_level: "HIGH",
        population: 390000,
        critical_infrastructure: ["Pul Prahladpur Railway Underpass", "Okhla Barrage Sluice", "Apollo Hospital Sarita Vihar"]
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.2600, 28.5100],
            [77.3100, 28.5150],
            [77.3120, 28.5550],
            [77.2650, 28.5500],
            [77.2600, 28.5100]
          ]
        ]
      }
    }
  ]
};

export const FALLBACK_PIPELINES = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "del-pipe-1",
      properties: {
        id: "del-pipe-1",
        name: "Najafgarh Trunk Storm Outfall Drain",
        diameter_mm: 5500,
        flow_capacity_m3s: 90.0,
        current_flow_m3s: 78.5,
        load_percentage: 87,
        status: "HIGH_LOAD"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.0650, 28.6100],
          [77.1100, 28.6450],
          [77.1650, 28.6800],
          [77.2100, 28.7100],
          [77.2350, 28.7180]
        ]
      }
    },
    {
      type: "Feature",
      id: "del-pipe-2",
      properties: {
        id: "del-pipe-2",
        name: "Barapullah Storm Trunk Drain",
        diameter_mm: 4200,
        flow_capacity_m3s: 60.0,
        current_flow_m3s: 52.8,
        load_percentage: 88,
        status: "HIGH_LOAD"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.1850, 28.5650],
          [77.2200, 28.5820],
          [77.2500, 28.5900],
          [77.2650, 28.5940]
        ]
      }
    },
    {
      type: "Feature",
      id: "del-pipe-3",
      properties: {
        id: "del-pipe-3",
        name: "Supplementary Drain (Rohini to Wazirabad)",
        diameter_mm: 3800,
        flow_capacity_m3s: 55.0,
        current_flow_m3s: 29.0,
        load_percentage: 52,
        status: "NORMAL"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.1050, 28.7200],
          [77.1500, 28.7150],
          [77.1950, 28.7120],
          [77.2350, 28.7180]
        ]
      }
    },
    {
      type: "Feature",
      id: "del-pipe-4",
      properties: {
        id: "del-pipe-4",
        name: "Shahdara Outfall Drain (Trans-Yamuna Trunk)",
        diameter_mm: 4000,
        flow_capacity_m3s: 50.0,
        current_flow_m3s: 43.5,
        load_percentage: 87,
        status: "HIGH_LOAD"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.2950, 28.6750],
          [77.2980, 28.6250],
          [77.3020, 28.5600],
          [77.3080, 28.5400]
        ]
      }
    }
  ]
};

export const FALLBACK_PUMPS = [
  {
    id: "del-pump-1",
    name: "Delhi Jal Board ITO Drain Regulator 12 Pump House",
    coordinates: [77.2480, 28.6280],
    total_pumps: 6,
    active_pumps: 6,
    capacity_lps: 18000,
    current_discharge_lps: 17200,
    status: "RUNNING_MAX",
    sluice_gate_open_pct: 100
  },
  {
    id: "del-pump-2",
    name: "Minto Bridge High-Discharge Dewatering Sump",
    coordinates: [77.2220, 28.6360],
    total_pumps: 4,
    active_pumps: 4,
    capacity_lps: 12000,
    current_discharge_lps: 11400,
    status: "RUNNING_MAX",
    sluice_gate_open_pct: 100
  },
  {
    id: "del-pump-3",
    name: "Wazirabad Barrage Flood Relief Lift Station",
    coordinates: [77.2350, 28.7180],
    total_pumps: 5,
    active_pumps: 4,
    capacity_lps: 15000,
    current_discharge_lps: 12200,
    status: "RUNNING_OPTIMAL",
    sluice_gate_open_pct: 80
  },
  {
    id: "del-pump-4",
    name: "Okhla Barrage Outfall Sluice & Drainage Pump",
    coordinates: [77.3080, 28.5400],
    total_pumps: 4,
    active_pumps: 3,
    capacity_lps: 14000,
    current_discharge_lps: 9800,
    status: "RUNNING_OPTIMAL",
    sluice_gate_open_pct: 75
  }
];

export const FALLBACK_HOTSPOTS = [
  {
    id: "DEL-GRV-201",
    citizen_name: "Control Desk",
    citizen_phone: "+91-11-2383-8888",
    location_name: "Minto Bridge Underpass",
    coordinates: [77.2220, 28.6360],
    segment_id: "delhi-seg-2",
    water_depth_cm: 75,
    clearance_issue: "Underpass closed. Minimum 85cm vehicle clearance or rescue boat required.",
    description: "Intense cloudburst runoff accumulating at lowest depression point. 4 pumps operating at maximum.",
    urgency: "CRITICAL",
    status: "DISPATCHED",
    timestamp: new Date().toISOString()
  },
  {
    id: "DEL-GRV-202",
    citizen_name: "Traffic HQ",
    citizen_phone: "+91-11-2584-4444",
    location_name: "Kashmere Gate Ring Road & Monastery Market",
    coordinates: [77.2340, 28.6650],
    segment_id: "delhi-seg-1",
    water_depth_cm: 88,
    clearance_issue: "Yamuna river water overflow onto carriageway. Strict civilian vehicle diversion.",
    description: "Water level above road median. Traffic diverted via Boulevard Road and Tis Hazari.",
    urgency: "CRITICAL",
    status: "DISPATCHED",
    timestamp: new Date().toISOString()
  },
  {
    id: "DEL-GRV-203",
    citizen_name: "MCD Field Officer",
    citizen_phone: "+91-98110-33445",
    location_name: "ITO Vikas Minar & IP Marg Intersection",
    coordinates: [77.2420, 28.6290],
    segment_id: "delhi-seg-3",
    water_depth_cm: 45,
    clearance_issue: "Light hatchbacks and sedans stalling. Buses & heavy vehicles proceeding slowly.",
    description: "Water accumulation on IP Marg. Regulator 12 sluice gates fully open to discharge runoff.",
    urgency: "HIGH",
    status: "IN_PROGRESS",
    timestamp: new Date().toISOString()
  },
  {
    id: "DEL-GRV-204",
    citizen_name: "Traffic Unit South",
    citizen_phone: "+91-98110-88776",
    location_name: "Pul Prahladpur Underpass (MB Road)",
    coordinates: [77.2880, 28.5120],
    segment_id: "delhi-seg-8",
    water_depth_cm: 65,
    clearance_issue: "Railway underpass flooded above wheel hubs. Traffic diverted via Maa Anandmayee Marg.",
    description: "Sump dewatering underway with 3 mobile suction pumps deployed by PWD.",
    urgency: "HIGH",
    status: "IN_PROGRESS",
    timestamp: new Date().toISOString()
  }
];

export const FALLBACK_AUTHORITIES = [
  {
    id: "auth-ddma",
    department: "Delhi Disaster Management Authority (DDMA)",
    unit: "NCT Central Flood Command",
    phone: "+91-11-2383-8888",
    readiness: "RED_ALERT",
    boats_ready: 32,
    personnel_deployed: 180
  },
  {
    id: "auth-ifc",
    department: "Irrigation & Flood Control Dept. (I&FC)",
    unit: "Yamuna Barrage Control",
    phone: "+91-11-2386-0440",
    readiness: "HIGH_ALERT",
    boats_ready: 24,
    personnel_deployed: 210
  },
  {
    id: "auth-ndrf",
    department: "National Disaster Response Force (NDRF)",
    unit: "8th Battalion Base",
    phone: "+91-120-2766-013",
    readiness: "HIGH_ALERT",
    boats_ready: 30,
    personnel_deployed: 120
  },
  {
    id: "auth-traffic",
    department: "Delhi Traffic Police Control Room",
    unit: "Underpass Surveillance Cell",
    phone: "+91-11-2584-4444",
    readiness: "DIVERSIONS_ACTIVE",
    patrol_units: 42
  },
  {
    id: "auth-pwd",
    department: "Public Works Department (PWD)",
    unit: "Underpass Automated Dewatering",
    phone: "+91-11-2349-0123",
    readiness: "RUNNING_MAX",
    portable_pumps_deployed: 50
  }
];

export const FALLBACK_ALERTS = [
  {
    id: "DEL-ALT-301",
    title: "Yamuna Evacuation Advisory: Hathnikund Surge",
    severity: "CRITICAL",
    message: "Yamuna level has crossed 205.82m (above Danger Mark 205.33m). Evacuation of low-lying floodplains underway.",
    channels: ["SMS", "APP_PUSH", "TRAFFIC_VMS"],
    timestamp: new Date().toISOString()
  },
  {
    id: "DEL-ALT-302",
    title: "Traffic Diversion: Minto Bridge Underpass Closed",
    severity: "WARNING",
    message: "Minto Bridge is closed due to 75cm water accumulation. Divert via Barakhamba Road and Ranjit Singh Flyover.",
    channels: ["APP_PUSH", "TRAFFIC_VMS"],
    timestamp: new Date().toISOString()
  }
];

// Clean Service Layer
export const api = {
  // 1. Flood Inundation Segments
  async getSegments() {
    try {
      const res = await axios.get('/api/segments', { timeout: 3000 });
      return res.data?.features ? res.data : FALLBACK_SEGMENTS;
    } catch {
      return FALLBACK_SEGMENTS;
    }
  },

  // 2. Drainage Network & Pumps
  async getDrainage() {
    try {
      const res = await axios.get('/api/drainage/network', { timeout: 3000 });
      return {
        pipelines: res.data?.pipelines || FALLBACK_PIPELINES,
        pumpStations: res.data?.pumpStations || FALLBACK_PUMPS
      };
    } catch {
      return {
        pipelines: FALLBACK_PIPELINES,
        pumpStations: FALLBACK_PUMPS
      };
    }
  },

  // 3. Hotspots / Grievances
  async getHotspots() {
    try {
      const res = await axios.get('/api/grievances', { timeout: 3000 });
      return Array.isArray(res.data) && res.data.length > 0 ? res.data : FALLBACK_HOTSPOTS;
    } catch {
      return FALLBACK_HOTSPOTS;
    }
  },

  async submitHotspot(reportData) {
    try {
      const res = await axios.post('/api/grievances', reportData, { timeout: 4000 });
      return res.data;
    } catch {
      // Local fallback creation
      const newReport = {
        id: `DEL-GRV-${Math.floor(Math.random() * 900) + 100}`,
        timestamp: new Date().toISOString(),
        status: "PENDING_REVIEW",
        ...reportData
      };
      return newReport;
    }
  },

  async updateHotspotStatus(id, status) {
    try {
      const res = await axios.patch(`/api/grievances/${id}/status`, { status }, { timeout: 3000 });
      return res.data;
    } catch {
      return { id, status };
    }
  },

  // 4. Dewatering Pumps SCADA Update
  async updatePump(id, payload) {
    try {
      const res = await axios.patch(`/api/drainage/pumps/${id}`, payload, { timeout: 3000 });
      return res.data;
    } catch {
      return { id, ...payload };
    }
  },

  // 5. Authorities & Pings
  async getAuthorities() {
    try {
      const res = await axios.get('/api/pings/authorities', { timeout: 3000 });
      return Array.isArray(res.data) && res.data.length > 0 ? res.data : FALLBACK_AUTHORITIES;
    } catch {
      return FALLBACK_AUTHORITIES;
    }
  },

  async pingAuthority(id, reason = "Emergency dewatering mobilization") {
    try {
      const res = await axios.post(`/api/pings/authorities/${id}/ping`, { reason }, { timeout: 3000 });
      return res.data;
    } catch {
      return { id, status: "DISPATCHED" };
    }
  },

  // 6. Alerts & Broadcaster
  async getAlerts() {
    try {
      const res = await axios.get('/api/alerts', { timeout: 3000 });
      return Array.isArray(res.data) && res.data.length > 0 ? res.data : FALLBACK_ALERTS;
    } catch {
      return FALLBACK_ALERTS;
    }
  },

  async broadcastAlert(payload) {
    try {
      const res = await axios.post('/api/alerts', payload, { timeout: 3000 });
      return res.data;
    } catch {
      return { id: `DEL-ALT-${Date.now()}`, ...payload };
    }
  },

  // 7. Weather
  async getWeather() {
    try {
      const res = await axios.get('/api/weather/live', { timeout: 3000 });
      return res.data;
    } catch {
      return {
        station: "IMD Safdarjung & Palam Radar",
        rainfall_rate_mmh: 58.4,
        rainfall_15m_mm: 14.6,
        storm_alert_level: "ORANGE_ALERT",
        wind_speed_kmh: 38,
        humidity_pct: 94
      };
    }
  }
};
