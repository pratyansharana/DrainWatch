import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import {
  Layers,
  MapPin,
  Waves,
  Gauge,
  Crosshair,
  AlertTriangle,
  Compass,
  Image,
  Navigation
} from 'lucide-react';
import Badge from '../Common/Badge';

const DELHI_CENTER = [77.2205, 28.6289]; // [lng, lat]

const MAP_THEMES = {
  crisp: {
    id: 'crisp',
    label: 'Crisp City',
    tiles: [
      'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
      'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
      'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'
    ],
    maxzoom: 19
  },
  satellite: {
    id: 'satellite',
    label: 'Satellite View',
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    ],
    maxzoom: 18
  },
  street: {
    id: 'street',
    label: 'Street Network',
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
    ],
    maxzoom: 18
  }
};

export default function MapLibreOSMView({
  segmentsGeoJson,
  drainageData,
  grievances = [],
  selectedHotspot,
  onSelectHotspot
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapTheme, setMapTheme] = useState('crisp'); // 'crisp' | 'satellite' | 'street'
  const [showZones, setShowZones] = useState(true);
  const [showDrains, setShowDrains] = useState(true);
  const [showPumps, setShowPumps] = useState(true);
  const [activeInspector, setActiveInspector] = useState(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialTheme = MAP_THEMES.crisp;

    const mapStyle = {
      version: 8,
      sources: {
        'base-tiles-source': {
          type: 'raster',
          tiles: initialTheme.tiles,
          tileSize: 256,
          maxzoom: initialTheme.maxzoom
        }
      },
      layers: [
        {
          id: 'base-tiles-layer',
          type: 'raster',
          source: 'base-tiles-source',
          minzoom: 0,
          maxzoom: 20
        }
      ]
    };

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: DELHI_CENTER,
      zoom: 12,
      maxZoom: 18,
      minZoom: 9
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    map.on('load', () => {
      mapInstanceRef.current = map;
      setMapLoaded(true);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Change Map Theme (Crisp City / Satellite / Street)
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const theme = MAP_THEMES[mapTheme];
    if (!theme) return;

    try {
      if (map.getLayer('base-tiles-layer')) {
        map.removeLayer('base-tiles-layer');
      }
      if (map.getSource('base-tiles-source')) {
        map.removeSource('base-tiles-source');
      }

      map.addSource('base-tiles-source', {
        type: 'raster',
        tiles: theme.tiles,
        tileSize: 256,
        maxzoom: theme.maxzoom
      });

      // Insert base layer at the bottom
      const firstLayerId = map.getStyle().layers?.[0]?.id;
      map.addLayer(
        {
          id: 'base-tiles-layer',
          type: 'raster',
          source: 'base-tiles-source',
          minzoom: 0,
          maxzoom: 20
        },
        firstLayerId !== 'base-tiles-layer' ? firstLayerId : undefined
      );
    } catch (err) {
      console.warn('Theme switch warning:', err);
    }
  }, [mapTheme, mapLoaded]);

  // Render Flood Risk Polygons
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !segmentsGeoJson) return;
    const map = mapInstanceRef.current;

    const sourceId = 'delhi-flood-zones';
    const fillLayerId = 'delhi-flood-zones-fill';
    const lineLayerId = 'delhi-flood-zones-line';

    if (map.getSource(sourceId)) {
      map.getSource(sourceId).setData(segmentsGeoJson);
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: segmentsGeoJson
      });

      map.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': [
            'match',
            ['get', 'risk_level'],
            'CRITICAL', '#EF4444',
            'HIGH', '#F59E0B',
            'MODERATE', '#3B82F6',
            '#10B981'
          ],
          'fill-opacity': mapTheme === 'satellite' ? 0.35 : 0.22
        }
      });

      map.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': [
            'match',
            ['get', 'risk_level'],
            'CRITICAL', '#DC2626',
            'HIGH', '#D97706',
            'MODERATE', '#2563EB',
            '#059669'
          ],
          'line-width': 2.5,
          'line-opacity': 0.9
        }
      });

      map.on('click', fillLayerId, (e) => {
        if (e.features && e.features[0]) {
          setActiveInspector({
            type: 'ZONE',
            properties: e.features[0].properties
          });
        }
      });

      map.on('mouseenter', fillLayerId, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', fillLayerId, () => {
        map.getCanvas().style.cursor = '';
      });
    }

    if (map.getLayer(fillLayerId)) {
      map.setLayoutProperty(fillLayerId, 'visibility', showZones ? 'visible' : 'none');
      map.setLayoutProperty(lineLayerId, 'visibility', showZones ? 'visible' : 'none');
    }
  }, [mapLoaded, segmentsGeoJson, showZones, mapTheme]);

  // Render Drainage Lines
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !drainageData?.pipelines) return;
    const map = mapInstanceRef.current;

    const sourceId = 'delhi-drains';
    const lineLayerId = 'delhi-drains-lines';

    if (map.getSource(sourceId)) {
      map.getSource(sourceId).setData(drainageData.pipelines);
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: drainageData.pipelines
      });

      map.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': [
            'case',
            ['>=', ['get', 'load_percentage'], 85], '#E11D48',
            ['>=', ['get', 'load_percentage'], 70], '#0284C7',
            '#0EA5E9'
          ],
          'line-width': 3.5,
          'line-opacity': 0.9,
          'line-dasharray': [2, 1]
        }
      });

      map.on('click', lineLayerId, (e) => {
        if (e.features && e.features[0]) {
          setActiveInspector({
            type: 'DRAIN',
            properties: e.features[0].properties
          });
        }
      });
    }

    if (map.getLayer(lineLayerId)) {
      map.setLayoutProperty(lineLayerId, 'visibility', showDrains ? 'visible' : 'none');
    }
  }, [mapLoaded, drainageData, showDrains]);

  // Render Markers
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Waterlogged Hotspot Markers
    grievances.forEach((g) => {
      const isSelected = selectedHotspot?.id === g.id;
      const isCrit = g.urgency === 'CRITICAL' || g.water_depth_cm >= 70;

      const el = document.createElement('div');
      el.className = 'cursor-pointer transform hover:scale-110 transition-transform duration-150';
      el.innerHTML = `
        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-md font-bold text-xs ${
          isCrit
            ? 'bg-red-600 text-white border-red-700 ring-2 ring-red-300'
            : 'bg-amber-500 text-white border-amber-600'
        } ${isSelected ? 'ring-4 ring-blue-500 scale-110' : ''}">
          <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
          <span>${g.water_depth_cm} cm</span>
        </div>
      `;

      el.addEventListener('click', () => {
        onSelectHotspot(g);
        setActiveInspector({
          type: 'HOTSPOT',
          properties: g
        });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(g.coordinates)
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Dewatering Pump Markers
    if (showPumps && drainageData?.pumpStations) {
      drainageData.pumpStations.forEach((pump) => {
        const el = document.createElement('div');
        el.className = 'cursor-pointer transform hover:scale-110 transition-transform duration-150';
        el.innerHTML = `
          <div class="p-1.5 rounded-lg border shadow-sm flex items-center justify-center ${
            pump.status === 'RUNNING_MAX'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-sky-600 text-white border-sky-700'
          }" title="${pump.name}">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
        `;

        el.addEventListener('click', () => {
          setActiveInspector({
            type: 'PUMP',
            properties: pump
          });
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(pump.coordinates)
          .addTo(map);

        markersRef.current.push(marker);
      });
    }
  }, [mapLoaded, grievances, drainageData, selectedHotspot, showPumps]);

  // Smooth Fly-To Selected Hotspot
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedHotspot?.coordinates) return;
    mapInstanceRef.current.flyTo({
      center: selectedHotspot.coordinates,
      zoom: 15.2,
      essential: true,
      speed: 1.2
    });

    setActiveInspector({
      type: 'HOTSPOT',
      properties: selectedHotspot
    });
  }, [selectedHotspot]);

  const flyToPreset = (lng, lat, zoom = 14.5) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [lng, lat],
        zoom: zoom,
        essential: true,
        speed: 1.2
      });
    }
  };

  return (
    <div className="relative w-full h-[540px] lg:h-[620px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col">
      {/* 1. Top Quick Landmark Focus Bar */}
      <div className="absolute top-3 left-3 right-14 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm pointer-events-auto overflow-x-auto custom-scrollbar">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Crosshair className="w-3.5 h-3.5 text-blue-600" /> Focus:
          </span>

          <button
            onClick={() => flyToPreset(77.222, 28.636, 16)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200/80 transition flex items-center gap-1.5 shrink-0"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            Minto Bridge (75cm)
          </button>

          <button
            onClick={() => flyToPreset(77.234, 28.665, 15.2)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200/80 transition shrink-0"
          >
            Kashmere Gate (88cm)
          </button>

          <button
            onClick={() => flyToPreset(77.242, 28.629, 15.2)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80 transition shrink-0"
          >
            ITO Junction (45cm)
          </button>

          <button
            onClick={() => flyToPreset(77.288, 28.512, 15.2)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80 transition shrink-0"
          >
            Pul Prahladpur (65cm)
          </button>

          <button
            onClick={() => flyToPreset(DELHI_CENTER[0], DELHI_CENTER[1], 12)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition shrink-0"
          >
            All NCT Delhi
          </button>
        </div>
      </div>

      {/* 2. Map Container */}
      <div ref={mapContainerRef} className="w-full h-full flex-1" />

      {/* 3. Bottom Controls: Layer Toggles & Map Style Switcher */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Layer Toggles */}
        <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3 text-xs pointer-events-auto">
          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
            <input
              type="checkbox"
              checked={showZones}
              onChange={(e) => setShowZones(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
            />
            <span>Flood Sectors</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
            <input
              type="checkbox"
              checked={showDrains}
              onChange={(e) => setShowDrains(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
            />
            <span>Trunk Drains</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
            <input
              type="checkbox"
              checked={showPumps}
              onChange={(e) => setShowPumps(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
            />
            <span>Pumps</span>
          </label>
        </div>

        {/* Clear Map Theme Selector (Crisp City / Satellite / Street) */}
        <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-1 pointer-events-auto">
          {Object.values(MAP_THEMES).map((th) => (
            <button
              key={th.id}
              onClick={() => setMapTheme(th.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                mapTheme === th.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {th.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Selected Inspector Drawer Flyout */}
      {activeInspector && (
        <div className="absolute top-16 right-3 z-20 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-start justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-blue-50 text-blue-600">
                {activeInspector.type === 'HOTSPOT' ? (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                ) : activeInspector.type === 'PUMP' ? (
                  <Gauge className="w-4 h-4 text-emerald-600" />
                ) : (
                  <MapPin className="w-4 h-4 text-blue-600" />
                )}
              </span>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {activeInspector.type} Overview
                </span>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  {activeInspector.properties.location_name || activeInspector.properties.name}
                </h4>
              </div>
            </div>
            <button
              onClick={() => setActiveInspector(null)}
              className="text-slate-400 hover:text-slate-700 text-xs p-1 rounded hover:bg-slate-100"
            >
              ✕
            </button>
          </div>

          <div className="py-2.5 space-y-2 text-xs">
            {activeInspector.type === 'HOTSPOT' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Water Depth:</span>
                  <span className="font-mono font-bold text-red-600 text-sm">
                    {activeInspector.properties.water_depth_cm} cm
                  </span>
                </div>
                <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-2 text-[11px] text-amber-800">
                  <strong className="block mb-0.5">Ground Clearance Advisory:</strong>
                  {activeInspector.properties.clearance_issue}
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Dispatch Status:</span>
                  <Badge variant="warning" size="sm">
                    {activeInspector.properties.status}
                  </Badge>
                </div>
              </>
            )}

            {activeInspector.type === 'ZONE' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Risk Assessment:</span>
                  <Badge
                    variant={activeInspector.properties.risk_level === 'CRITICAL' ? 'critical' : 'warning'}
                    size="sm"
                  >
                    {activeInspector.properties.risk_level}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Inundation Level:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {activeInspector.properties.current_water_level_cm} cm
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Estimated Population:</span>
                  <span className="font-semibold text-slate-800">
                    {Number(activeInspector.properties.population).toLocaleString()} residents
                  </span>
                </div>
              </>
            )}

            {activeInspector.type === 'PUMP' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Operating Status:</span>
                  <Badge variant="success" size="sm">
                    {activeInspector.properties.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Active Pumps:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {activeInspector.properties.active_pumps} / {activeInspector.properties.total_pumps}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Discharge Flow:</span>
                  <span className="font-mono text-emerald-700 font-semibold">
                    {Number(activeInspector.properties.current_discharge_lps).toLocaleString()} L/s
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Sluice Gate Aperture:</span>
                  <span className="font-mono font-bold text-blue-600">
                    {activeInspector.properties.sluice_gate_open_pct}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
