import React, { useState } from 'react';
import { Navigation, AlertTriangle, ShieldCheck, ShieldAlert, Truck, Ambulance, Compass, ChevronRight, MapPin, Edit3, Check } from 'lucide-react';
import axios from 'axios';

const VEHICLES = [
  { id: 'AMBULANCE', name: 'CATS Paramedic Ambulance', clearance: '22 cm max', icon: Ambulance, speed: '42 km/h' },
  { id: 'FIRE_TRUCK', name: 'Delhi Fire Service Tender', clearance: '50 cm max', icon: Truck, speed: '35 km/h' },
  { id: 'RESCUE_TRUCK', name: 'NDRF 8th Bn 4x4 Rescue Truck', clearance: '85 cm max', icon: Truck, speed: '30 km/h' },
  { id: 'POLICE_CRUISER', name: 'Delhi Police PCR Interceptor', clearance: '18 cm max', icon: Compass, speed: '45 km/h' }
];

export const DELHI_EMERGENCY_BASES = [
  {
    id: 'base-aiims',
    name: 'AIIMS New Delhi Apex Trauma Center (Ring Road)',
    sector: 'South Delhi (Safdarjung)',
    coords: [77.2100, 28.5670]
  },
  {
    id: 'base-ddma',
    name: 'DDMA Central Disaster Command Base (Civil Lines)',
    sector: 'North Delhi (Vikas Bhawan)',
    coords: [77.2250, 28.6750]
  },
  {
    id: 'base-dfs-cp',
    name: 'Delhi Fire Service HQ (Connaught Place / Barakhamba)',
    sector: 'Central Delhi',
    coords: [77.2280, 28.6310]
  },
  {
    id: 'base-ndrf',
    name: 'NDRF 8th Battalion Staging Base (NCR Sector)',
    sector: 'Ghaziabad / East Delhi Perimeter',
    coords: [77.3400, 28.6800]
  },
  {
    id: 'base-dp-hq',
    name: 'Delhi Police Command HQ (Jai Singh Road / CP)',
    sector: 'Central Delhi',
    coords: [77.2150, 28.6250]
  },
  {
    id: 'base-rml',
    name: 'Dr. RML Hospital Emergency Dispatch Post',
    sector: 'Central Delhi (Baba Kharak Singh Marg)',
    coords: [77.2010, 28.6240]
  },
  {
    id: 'base-gtb',
    name: 'GTB Hospital Emergency Hub (Shahdara / Dilshad Garden)',
    sector: 'East Delhi / Trans-Yamuna',
    coords: [77.3080, 28.6850]
  },
  {
    id: 'base-west',
    name: 'Janakpuri Super Speciality Base (West Delhi)',
    sector: 'West Delhi (Najafgarh Catchment)',
    coords: [77.0860, 28.6250]
  }
];

export default function EmergencyRoutingPanel({ grievances, onRouteCalculated }) {
  const [selectedVehicle, setSelectedVehicle] = useState('AMBULANCE');
  const [isCustomOrigin, setIsCustomOrigin] = useState(false);
  const [selectedBaseIndex, setSelectedBaseIndex] = useState(0);
  
  // Custom Origin Coordinates
  const [customOriginName, setCustomOriginName] = useState('Delhi Field Station');
  const [customLng, setCustomLng] = useState('77.2100');
  const [customLat, setCustomLat] = useState('28.5670');

  const [destinationIndex, setDestinationIndex] = useState(0);
  const [routingResult, setRoutingResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Delhi Destinations list
  const defaultDelhiDestinations = [
    { name: 'Minto Bridge Underpass (Critical Submersion)', coords: [77.2220, 28.6360] },
    { name: 'Kashmere Gate ISBT & Monastery Market (River Overflow)', coords: [77.2340, 28.6650] },
    { name: 'ITO Vikas Minar & IP Marg Junction', coords: [77.2420, 28.6290] },
    { name: 'Pul Prahladpur Railway Underpass (MB Road)', coords: [77.2880, 28.5120] }
  ];

  const destinations = grievances && grievances.length > 0 ? [
    ...grievances.map(g => ({
      name: `${g.id}: ${g.location_name} (${g.water_depth_cm}cm)`,
      coords: g.coordinates
    })),
    ...defaultDelhiDestinations
  ] : defaultDelhiDestinations;

  const handleComputeRoute = async () => {
    setIsCalculating(true);
    try {
      let originCoords;
      if (isCustomOrigin) {
        originCoords = [parseFloat(customLng) || 77.2100, parseFloat(customLat) || 28.5670];
      } else {
        originCoords = DELHI_EMERGENCY_BASES[selectedBaseIndex].coords;
      }

      const destinationCoords = destinations[destinationIndex]?.coords || [77.2220, 28.6360];

      const res = await axios.post('/api/routes/emergency', {
        origin: originCoords,
        destination: destinationCoords,
        vehicleType: selectedVehicle
      });

      setRoutingResult(res.data);
      if (onRouteCalculated) onRouteCalculated(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="bg-command-card border border-command-border rounded-xl p-4 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-command-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              Delhi Emergency Transit Corridors
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                OSRM / ORS Engine
              </span>
            </h3>
            <span className="text-xs text-slate-400">Flood Inundation &amp; Ground Clearance Avoidance</span>
          </div>
        </div>
      </div>

      {/* Fleet Vehicle Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 block">
          Select Emergency Fleet Vehicle (Ground Clearance Filter):
        </label>
        <div className="grid grid-cols-2 gap-2">
          {VEHICLES.map((v) => {
            const Icon = v.icon;
            const isSelected = selectedVehicle === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setSelectedVehicle(v.id)}
                className={`p-2.5 rounded-lg border text-left transition flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'bg-command-bg/60 border-command-border/60 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className={`p-1.5 rounded ${isSelected ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">{v.name}</div>
                  <div className="text-[10px] text-amber-400 font-mono">Clearance: {v.clearance}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Emergency Dispatch Base (Origin) Selector */}
      <div className="space-y-2 bg-command-bg/80 p-3 rounded-lg border border-command-border">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            Emergency Dispatch Base (Origin):
          </label>
          {/* Toggle between Delhi Presets vs Custom Lat/Lng */}
          <button
            type="button"
            onClick={() => setIsCustomOrigin(!isCustomOrigin)}
            className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline underline-offset-2"
          >
            {isCustomOrigin ? '← Switch to Official Delhi Bases' : '+ Set Custom Location / Coords'}
          </button>
        </div>

        {!isCustomOrigin ? (
          <div className="space-y-1">
            <select
              value={selectedBaseIndex}
              onChange={(e) => setSelectedBaseIndex(Number(e.target.value))}
              className="w-full bg-command-card border border-command-border rounded-lg p-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none font-sans"
            >
              {DELHI_EMERGENCY_BASES.map((b, idx) => (
                <option key={b.id} value={idx}>
                  {b.name} [{b.sector}]
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-400 font-mono block pl-1">
              Departing Coords: [{DELHI_EMERGENCY_BASES[selectedBaseIndex].coords.join(', ')}]
            </span>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400">Custom Origin Label / Landmark:</span>
              <input
                type="text"
                value={customOriginName}
                onChange={(e) => setCustomOriginName(e.target.value)}
                placeholder="e.g. Kashmiri Gate Police Post or Delhi Gate"
                className="w-full bg-command-card border border-command-border rounded p-1.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Longitude (°E):</span>
                <input
                  type="text"
                  value={customLng}
                  onChange={(e) => setCustomLng(e.target.value)}
                  className="w-full bg-command-card border border-command-border rounded p-1.5 text-cyan-300 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Latitude (°N):</span>
                <input
                  type="text"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  className="w-full bg-command-card border border-command-border rounded p-1.5 text-cyan-300 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Incident Destination Selector */}
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Incident Grievance Site (Destination in Delhi):</label>
        <select
          value={destinationIndex}
          onChange={(e) => setDestinationIndex(Number(e.target.value))}
          className="w-full bg-command-bg border border-command-border rounded-lg p-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none font-sans"
        >
          {destinations.map((d, idx) => (
            <option key={idx} value={idx}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Calculate Route Button */}
      <button
        onClick={handleComputeRoute}
        disabled={isCalculating}
        className="w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Navigation className="w-4 h-4" />
        {isCalculating ? 'Calculating Safe Delhi Bypass Corridor...' : 'Calculate Safe Transit Route'}
      </button>

      {/* Routing Results Banner */}
      {routingResult && (
        <div className="bg-command-bg/80 border border-emerald-500/40 rounded-lg p-3 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> Safe Transit Path Computed
            </div>
            <div className="text-slate-300 font-mono text-[11px]">
              Distance: <b className="text-white">{routingResult.summary?.distanceKm} km</b> | ETA: <b className="text-emerald-400">{routingResult.summary?.durationMinutes} min</b>
            </div>
          </div>

          {/* Flooded Choke-Points Avoided */}
          {routingResult.summary?.avoidedSegmentsCount > 0 && (
            <div className="p-2 rounded bg-amber-950/40 border border-amber-500/40 text-amber-200 text-[11px] space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Diverted Away From {routingResult.summary.avoidedSegmentsCount} Flooded Delhi Bottlenecks:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-300">
                {routingResult.summary.avoidedSegments?.slice(0, 3).map((s, idx) => (
                  <li key={idx}>
                    <b>{s.name}</b> (Water depth: <span className="text-amber-400">{s.water_depth_cm}cm</span> &gt; Max vehicle clearance: {s.max_allowed}cm)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Turn-by-Turn Steps Preview */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Turn-by-Turn Safe Navigation:</span>
            <div className="space-y-1 max-h-28 overflow-y-auto custom-scrollbar pr-1">
              {routingResult.steps?.map((step, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-command-card/60">
                  <span className="flex items-center gap-1.5 text-slate-200">
                    <ChevronRight className="w-3 h-3 text-cyan-400" /> {step.instruction}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{step.distance}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}