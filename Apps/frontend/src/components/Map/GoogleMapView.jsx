import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import {
  Layers,
  Car,
  Maximize2,
  Minimize2,
  Navigation2,
  MapPin,
  AlertTriangle,
  Waves,
  Eye,
  Crosshair,
  ExternalLink,
  ShieldAlert,
  Info
} from 'lucide-react';

const DELHI_CENTER = { lat: 28.6289, lng: 77.2205 };

// Professional Dark Tactical Map Style for Google Maps
const GOOGLE_MAPS_DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0F172A' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0B111E' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38BDF8' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748B' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#132338' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#34D399' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1E293B' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0F172A' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#CBD5E1' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#334155' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1E293B' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#F1F5F9' }]
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#1E293B' }]
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38BDF8' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0369A1' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#7DD3FC' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#082F49' }]
  }
];

export default function GoogleMapView({
  apiKey,
  segmentsGeoJson,
  drainageData,
  grievances = [],
  selectedHotspot,
  onSelectHotspot,
  onOpenApiKeyModal
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const trafficLayerRef = useRef(null);
  const polygonsRef = useRef([]);
  const polylinesRef = useRef([]);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [mapType, setMapType] = useState('dark'); // 'dark' | 'satellite' | 'terrain'
  const [showTraffic, setShowTraffic] = useState(true);
  const [showFloodPolygons, setShowFloodPolygons] = useState(true);
  const [showDrains, setShowDrains] = useState(true);
  const [showPumps, setShowPumps] = useState(true);
  const [inspectItem, setInspectItem] = useState(null);

  // Fallback vector map state
  const [fallbackZoom, setFallbackZoom] = useState(1);
  const [fallbackPan, setFallbackPan] = useState({ x: 0, y: 0 });

  // Initialize Google Maps
  useEffect(() => {
    let isCancelled = false;

    async function initGoogleMap() {
      // If no valid key provided, we set load error to prompt fallback or key configuration
      const keyToUse = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

      if (!keyToUse) {
        setLoadError('NO_KEY');
        setMapLoaded(false);
        return;
      }

      try {
        setLoadError(null);
        const loader = new Loader({
          apiKey: keyToUse,
          version: 'weekly',
          libraries: ['places', 'geometry']
        });

        await loader.load();

        if (isCancelled || !mapContainerRef.current) return;

        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: DELHI_CENTER,
          zoom: 12,
          mapTypeId: mapType === 'satellite' ? 'hybrid' : mapType === 'terrain' ? 'terrain' : 'roadmap',
          styles: mapType === 'dark' ? GOOGLE_MAPS_DARK_STYLE : [],
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: true,
          fullscreenControl: false,
          backgroundColor: '#0F172A'
        });

        const trafficLayer = new window.google.maps.TrafficLayer();
        if (showTraffic) {
          trafficLayer.setMap(map);
        }
        trafficLayerRef.current = trafficLayer;

        infoWindowRef.current = new window.google.maps.InfoWindow();

        mapInstanceRef.current = map;
        setMapLoaded(true);
      } catch (err) {
        console.warn('Google Maps failed to initialize:', err);
        if (!isCancelled) {
          setLoadError(err.message || 'FAILED_TO_LOAD');
          setMapLoaded(false);
        }
      }
    }

    initGoogleMap();

    return () => {
      isCancelled = true;
      // Cleanup markers & layers
      markersRef.current.forEach((m) => m.setMap(null));
      polygonsRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current.forEach((pl) => pl.setMap(null));
      if (trafficLayerRef.current) trafficLayerRef.current.setMap(null);
      mapInstanceRef.current = null;
    };
  }, [apiKey]);

  // Handle map style changes
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;
    const map = mapInstanceRef.current;

    if (mapType === 'satellite') {
      map.setMapTypeId('hybrid');
      map.setOptions({ styles: [] });
    } else if (mapType === 'terrain') {
      map.setMapTypeId('terrain');
      map.setOptions({ styles: [] });
    } else {
      map.setMapTypeId('roadmap');
      map.setOptions({ styles: GOOGLE_MAPS_DARK_STYLE });
    }
  }, [mapType]);

  // Handle Traffic Layer Toggle
  useEffect(() => {
    if (!trafficLayerRef.current || !mapInstanceRef.current) return;
    trafficLayerRef.current.setMap(showTraffic ? mapInstanceRef.current : null);
  }, [showTraffic]);

  // Render Flood Polygons on Google Map
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;
    const map = mapInstanceRef.current;

    // Clear existing
    polygonsRef.current.forEach((p) => p.setMap(null));
    polygonsRef.current = [];

    if (!showFloodPolygons || !segmentsGeoJson?.features) return;

    segmentsGeoJson.features.forEach((feature) => {
      const coords = feature.geometry.coordinates[0];
      const path = coords.map((c) => ({ lat: c[1], lng: c[0] }));

      const risk = feature.properties.risk_level;
      let fillColor = '#10B981';
      let strokeColor = '#059669';

      if (risk === 'CRITICAL') {
        fillColor = '#EF4444';
        strokeColor = '#B91C1C';
      } else if (risk === 'HIGH') {
        fillColor = '#F59E0B';
        strokeColor = '#D97706';
      } else if (risk === 'MODERATE') {
        fillColor = '#3B82F6';
        strokeColor = '#1D4ED8';
      }

      const polygon = new window.google.maps.Polygon({
        paths: path,
        strokeColor: strokeColor,
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: fillColor,
        fillOpacity: 0.3,
        map: map,
        zIndex: 1
      });

      polygon.addListener('click', (e) => {
        setInspectItem({
          type: 'ZONE',
          data: feature.properties,
          position: e.latLng
        });
      });

      polygon.addListener('mouseover', () => {
        polygon.setOptions({ fillOpacity: 0.5, strokeWeight: 3 });
      });

      polygon.addListener('mouseout', () => {
        polygon.setOptions({ fillOpacity: 0.3, strokeWeight: 2 });
      });

      polygonsRef.current.push(polygon);
    });
  }, [mapLoaded, segmentsGeoJson, showFloodPolygons]);

  // Render Drainage Lines & Pumps on Google Map
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;
    const map = mapInstanceRef.current;

    // Clear lines
    polylinesRef.current.forEach((pl) => pl.setMap(null));
    polylinesRef.current = [];

    if (showDrains && drainageData?.pipelines?.features) {
      drainageData.pipelines.features.forEach((feature) => {
        const coords = feature.geometry.coordinates;
        const path = coords.map((c) => ({ lat: c[1], lng: c[0] }));
        const load = feature.properties.load_percentage || 50;

        const strokeColor = load > 85 ? '#F43F5E' : load > 70 ? '#38BDF8' : '#0284C7';

        const polyline = new window.google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: strokeColor,
          strokeOpacity: 0.85,
          strokeWeight: 4,
          map: map,
          zIndex: 2
        });

        polyline.addListener('click', (e) => {
          setInspectItem({
            type: 'DRAIN',
            data: feature.properties,
            position: e.latLng
          });
        });

        polylinesRef.current.push(polyline);
      });
    }
  }, [mapLoaded, drainageData, showDrains]);

  // Render Markers (Waterlogged Hotspots + Pump Stations)
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;
    const map = mapInstanceRef.current;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // 1. Waterlogged Hotspot Markers
    grievances.forEach((g) => {
      const isSelected = selectedHotspot?.id === g.id;
      const isCritical = g.urgency === 'CRITICAL' || g.water_depth_cm >= 70;

      const marker = new window.google.maps.Marker({
        position: { lat: g.coordinates[1], lng: g.coordinates[0] },
        map: map,
        title: `${g.location_name} (${g.water_depth_cm}cm)`,
        zIndex: isSelected ? 100 : 10,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 12 : 9,
          fillColor: isCritical ? '#EF4444' : '#F59E0B',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      });

      marker.addListener('click', () => {
        onSelectHotspot(g);
        setInspectItem({
          type: 'HOTSPOT',
          data: g,
          position: marker.getPosition()
        });
      });

      markersRef.current.push(marker);
    });

    // 2. Pump Stations Markers
    if (showPumps && drainageData?.pumpStations) {
      drainageData.pumpStations.forEach((pump) => {
        const marker = new window.google.maps.Marker({
          position: { lat: pump.coordinates[1], lng: pump.coordinates[0] },
          map: map,
          title: pump.name,
          zIndex: 8,
          icon: {
            path: 'M 0,-6 L 6,6 L -6,6 Z', // Triangle
            scale: 2,
            fillColor: pump.status === 'RUNNING_MAX' ? '#10B981' : '#06B6D4',
            fillOpacity: 0.95,
            strokeColor: '#0F172A',
            strokeWeight: 1.5
          }
        });

        marker.addListener('click', () => {
          setInspectItem({
            type: 'PUMP',
            data: pump,
            position: marker.getPosition()
          });
        });

        markersRef.current.push(marker);
      });
    }
  }, [mapLoaded, grievances, drainageData, selectedHotspot, showPumps]);

  // Smooth Pan to Selected Hotspot
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedHotspot?.coordinates) return;
    const target = {
      lat: selectedHotspot.coordinates[1],
      lng: selectedHotspot.coordinates[0]
    };
    mapInstanceRef.current.panTo(target);
    mapInstanceRef.current.setZoom(15);

    setInspectItem({
      type: 'HOTSPOT',
      data: selectedHotspot,
      position: target
    });
  }, [selectedHotspot]);

  // Quick Delhi Landmark Presets
  const quickJump = (lat, lng, zoom = 14) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat, lng });
      mapInstanceRef.current.setZoom(zoom);
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 bg-[#090D16] shadow-2xl flex flex-col">
      {/* Top Floating GIS Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        {/* Quick Hotspot Jump Pills */}
        <div className="flex items-center gap-1.5 bg-[#0F172A]/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/80 shadow-lg pointer-events-auto overflow-x-auto custom-scrollbar">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 mr-1">
            <Crosshair className="w-3 h-3 text-cyan-400" /> Focus:
          </span>
          <button
            onClick={() => quickJump(28.636, 77.222, 16)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 transition flex items-center gap-1"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
            Minto Bridge (75cm)
          </button>
          <button
            onClick={() => quickJump(28.665, 77.234, 15)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 transition"
          >
            Kashmere Gate (88cm)
          </button>
          <button
            onClick={() => quickJump(28.629, 77.242, 15)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition"
          >
            ITO Junction (45cm)
          </button>
          <button
            onClick={() => quickJump(28.512, 77.288, 15)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition"
          >
            Pul Prahladpur (65cm)
          </button>
          <button
            onClick={() => quickJump(28.6289, 77.2205, 12)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            All NCT Delhi
          </button>
        </div>

        {/* Map Mode & Layer Switchers */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Map Layer Toggles */}
          <div className="flex items-center gap-1 bg-[#0F172A]/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg">
            <button
              onClick={() => setShowTraffic(!showTraffic)}
              title="Toggle Live Traffic Layer"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                showTraffic
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Traffic</span>
            </button>
            <button
              onClick={() => setShowFloodPolygons(!showFloodPolygons)}
              title="Toggle Flood Inundation Zones"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                showFloodPolygons
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Risk Zones</span>
            </button>
            <button
              onClick={() => setShowDrains(!showDrains)}
              title="Toggle Storm Drains"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                showDrains
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              <span>Drains</span>
            </button>
          </div>

          {/* Map Type: Dark / Satellite / Terrain */}
          <div className="flex items-center gap-1 bg-[#0F172A]/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg">
            <button
              onClick={() => setMapType('dark')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                mapType === 'dark' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tactical Dark
            </button>
            <button
              onClick={() => setMapType('satellite')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                mapType === 'satellite' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Google Satellite
            </button>
            <button
              onClick={() => setMapType('terrain')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                mapType === 'terrain' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Terrain
            </button>
          </div>
        </div>
      </div>

      {/* Primary Google Map Viewport */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 relative">
        {/* If Google Maps API key is missing or load failed, show Interactive Fallback Canvas */}
        {(!mapLoaded || loadError) && (
          <div className="absolute inset-0 bg-[#090D16] flex flex-col justify-between p-6 z-10 overflow-hidden">
            {/* Fallback Header Notice */}
            <div className="bg-[#121B2F]/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-4 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Navigation2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    Delhi Flood GIS & Hydrological Vector Radar
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                      Offline Mode Active
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Showing real-time NCT Delhi flood segments, waterlogged underpasses, and drainage telemetry.
                  </p>
                </div>
              </div>
              <button
                onClick={onOpenApiKeyModal}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5 shrink-0"
              >
                <span>Activate Google Maps API</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive Vector GIS Delhi Map */}
            <div className="flex-1 relative my-4 rounded-xl border border-slate-800 bg-[#0B111E] overflow-hidden flex items-center justify-center">
              <svg
                viewBox="77.05 28.48 0.3 0.28"
                className="w-full h-full transform scale-y-[-1] transition-transform duration-300"
                style={{
                  filter: 'drop-shadow(0 0 15px rgba(2, 132, 199, 0.15))'
                }}
              >
                {/* Background Grid */}
                <defs>
                  <pattern id="grid" width="0.02" height="0.02" patternUnits="userSpaceOnUse">
                    <path d="M 0.02 0 L 0 0 0 0.02" fill="none" stroke="#1E293B" strokeWidth="0.0005" />
                  </pattern>
                </defs>
                <rect x="77.0" y="28.4" width="0.4" height="0.4" fill="url(#grid)" />

                {/* Yamuna River Curve Simulation */}
                <path
                  d="M 77.21 28.75 Q 77.23 28.68 77.25 28.62 T 77.31 28.50"
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="0.0035"
                  strokeDasharray="0.002, 0.001"
                />

                {/* Delhi Flood Polygons */}
                {segmentsGeoJson?.features?.map((f) => {
                  const pts = f.geometry.coordinates[0].map((c) => `${c[0]},${c[1]}`).join(' ');
                  const isCrit = f.properties.risk_level === 'CRITICAL';
                  const isHigh = f.properties.risk_level === 'HIGH';
                  const fill = isCrit ? '#EF4444' : isHigh ? '#F59E0B' : '#0284C7';

                  return (
                    <polygon
                      key={f.id}
                      points={pts}
                      fill={fill}
                      fillOpacity="0.25"
                      stroke={fill}
                      strokeWidth="0.001"
                      className="cursor-pointer hover:fill-opacity-50 transition"
                      onClick={() => setInspectItem({ type: 'ZONE', data: f.properties })}
                    />
                  );
                })}

                {/* Drainage lines */}
                {drainageData?.pipelines?.features?.map((pl) => {
                  const pts = pl.geometry.coordinates.map((c) => `${c[0]},${c[1]}`).join(' ');
                  return (
                    <polyline
                      key={pl.id}
                      points={pts}
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="0.0015"
                      strokeDasharray="0.003 0.0015"
                    />
                  );
                })}

                {/* Hotspot Markers */}
                {grievances.map((g) => {
                  const isCrit = g.urgency === 'CRITICAL';
                  const isSelected = selectedHotspot?.id === g.id;
                  return (
                    <g
                      key={g.id}
                      className="cursor-pointer"
                      onClick={() => {
                        onSelectHotspot(g);
                        setInspectItem({ type: 'HOTSPOT', data: g });
                      }}
                    >
                      <circle
                        cx={g.coordinates[0]}
                        cy={g.coordinates[1]}
                        r={isSelected ? 0.006 : 0.004}
                        fill={isCrit ? '#EF4444' : '#F59E0B'}
                        stroke="#FFFFFF"
                        strokeWidth="0.0008"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Waterlogged Callout Badges Overlaid on Canvas */}
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 pointer-events-none">
                {grievances.slice(0, 3).map((g) => (
                  <div
                    key={g.id}
                    className="pointer-events-auto bg-[#0F172A]/90 border border-slate-700/80 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs shadow-lg cursor-pointer hover:border-cyan-500 transition"
                    onClick={() => {
                      onSelectHotspot(g);
                      setInspectItem({ type: 'HOTSPOT', data: g });
                    }}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="font-semibold text-slate-200">{g.location_name}</span>
                    <span className="font-mono text-rose-400 font-bold">{g.water_depth_cm}cm</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Legend */}
            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                  <span>Critical Flooding (&gt;70cm)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                  <span>High Waterlogging</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
                  <span>Yamuna River & Trunk Drains</span>
                </div>
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                NCT Delhi Center: 28.6289° N, 77.2205° E
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Selected Feature Inspection Flyout */}
      {inspectItem && (
        <div className="absolute bottom-5 right-5 z-30 w-80 bg-[#0D1424]/95 backdrop-blur-md border border-cyan-500/40 rounded-xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                {inspectItem.type === 'HOTSPOT' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                ) : inspectItem.type === 'PUMP' ? (
                  <Waves className="w-4 h-4 text-emerald-400" />
                ) : (
                  <MapPin className="w-4 h-4 text-cyan-400" />
                )}
              </span>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {inspectItem.type}
                </span>
                <h4 className="text-xs font-bold text-slate-100 leading-tight">
                  {inspectItem.data.location_name || inspectItem.data.name}
                </h4>
              </div>
            </div>
            <button
              onClick={() => setInspectItem(null)}
              className="text-slate-400 hover:text-slate-200 text-xs px-1 rounded hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="py-2.5 space-y-1.5 text-xs">
            {inspectItem.type === 'HOTSPOT' && (
              <>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Water Inundation Depth:</span>
                  <span className="font-mono font-bold text-rose-400">
                    {inspectItem.data.water_depth_cm} cm
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Ground Clearance Advisory:</span>
                  <span className="text-[11px] text-amber-300 font-medium truncate max-w-[150px]">
                    {inspectItem.data.clearance_issue || 'Cars will stall'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Current Status:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/20 text-cyan-300">
                    {inspectItem.data.status}
                  </span>
                </div>
              </>
            )}

            {inspectItem.type === 'ZONE' && (
              <>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Risk Level:</span>
                  <span className="font-bold text-rose-400">{inspectItem.data.risk_level}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Estimated Water Level:</span>
                  <span className="font-mono">{inspectItem.data.current_water_level_cm} cm</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Population at Risk:</span>
                  <span>{inspectItem.data.population?.toLocaleString()} citizens</span>
                </div>
              </>
            )}

            {inspectItem.type === 'PUMP' && (
              <>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Active Pumps:</span>
                  <span className="font-bold text-emerald-400">
                    {inspectItem.data.active_pumps} / {inspectItem.data.total_pumps}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Discharge Rate:</span>
                  <span className="font-mono text-cyan-400">
                    {inspectItem.data.current_discharge_lps} L/s
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Sluice Gates:</span>
                  <span>{inspectItem.data.sluice_gate_open_pct}% Open</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
