import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, Eye, ShieldAlert, Waves, Navigation, AlertTriangle, CheckCircle, RefreshCw, Sun, Moon, Map as MapIcon } from 'lucide-react';

const RISK_COLORS = {
  NORMAL: '#10B981',
  LOW: '#06B6D4',
  MODERATE: '#F59E0B',
  HIGH: '#F97316',
  CRITICAL: '#EF4444'
};

const MAP_STYLES = {
  NORMAL: {
    name: 'Normal Street Map',
    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    brightness: 1.0,
    contrast: 0.0,
    saturation: 0.0
  },
  DARK: {
    name: 'Tactical Dark Command',
    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    brightness: 0.65,
    contrast: 0.15,
    saturation: -0.75
  },
  SATELLITE: {
    name: 'Satellite Aerial',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    brightness: 0.9,
    contrast: 0.1,
    saturation: 0.0
  }
};

export default function MapLibreView({
  segmentsGeoJson,
  pipelinesGeoJson,
  pumpStations,
  grievances,
  emergencyRoute,
  onSelectSegment,
  onSelectGrievance,
  onSelectPump
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const [activeMapTheme, setActiveMapTheme] = useState('NORMAL'); // 'NORMAL' | 'DARK' | 'SATELLITE'
  const [layersVisible, setLayersVisible] = useState({
    segments: true,
    pipelines: true,
    pumps: true,
    grievances: true,
    emergencyRoute: true
  });
  const [activeSegmentHover, setActiveSegmentHover] = useState(null);

  // Initialize MapLibre GL for Delhi
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'base-raster-tiles': {
            type: 'raster',
            tiles: MAP_STYLES[activeMapTheme].tiles,
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors | Delhi Jal Board | DDMA GIS'
          }
        },
        layers: [
          {
            id: 'base-tiles-layer',
            type: 'raster',
            source: 'base-raster-tiles',
            minzoom: 0,
            maxzoom: 19,
            paint: {
              'raster-brightness-max': MAP_STYLES[activeMapTheme].brightness,
              'raster-contrast': MAP_STYLES[activeMapTheme].contrast,
              'raster-saturation': MAP_STYLES[activeMapTheme].saturation
            }
          }
        ]
      },
      // Delhi Center Coordinates
      center: [77.2090, 28.6139],
      zoom: 11.8,
      pitch: 30,
      bearing: -5
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl(), 'bottom-right');

    mapRef.current = map;

    map.on('load', () => {
      // 1. City Segments Layer
      map.addSource('city-segments', {
        type: 'geojson',
        data: segmentsGeoJson || { type: 'FeatureCollection', features: [] }
      });

      map.addLayer({
        id: 'city-segments-fill',
        type: 'fill',
        source: 'city-segments',
        paint: {
          'fill-color': [
            'match',
            ['get', 'risk_level'],
            'CRITICAL', '#EF4444',
            'HIGH', '#F97316',
            'MODERATE', '#F59E0B',
            'LOW', '#06B6D4',
            '#10B981'
          ],
          'fill-opacity': 0.42
        }
      });

      map.addLayer({
        id: 'city-segments-line',
        type: 'line',
        source: 'city-segments',
        paint: {
          'line-color': [
            'match',
            ['get', 'risk_level'],
            'CRITICAL', '#EF4444',
            'HIGH', '#F97316',
            'MODERATE', '#F59E0B',
            'LOW', '#06B6D4',
            '#10B981'
          ],
          'line-width': 2.8
        }
      });

      // Hover and Click on segments
      map.on('click', 'city-segments-fill', (e) => {
        if (e.features && e.features[0] && onSelectSegment) {
          onSelectSegment(e.features[0].properties);
        }
      });

      map.on('mousemove', 'city-segments-fill', (e) => {
        if (e.features && e.features[0]) {
          map.getCanvas().style.cursor = 'pointer';
          setActiveSegmentHover(e.features[0].properties);
        }
      });

      map.on('mouseleave', 'city-segments-fill', () => {
        map.getCanvas().style.cursor = '';
        setActiveSegmentHover(null);
      });

      // 2. Delhi Drainage Trunk Pipelines Layer (Najafgarh, Barapullah, Supplementary, Shahdara)
      map.addSource('drainage-pipelines', {
        type: 'geojson',
        data: pipelinesGeoJson || { type: 'FeatureCollection', features: [] }
      });

      map.addLayer({
        id: 'drainage-pipelines-glow',
        type: 'line',
        source: 'drainage-pipelines',
        paint: {
          'line-color': '#00E5FF',
          'line-width': 7,
          'line-opacity': 0.4,
          'line-blur': 4
        }
      });

      map.addLayer({
        id: 'drainage-pipelines-line',
        type: 'line',
        source: 'drainage-pipelines',
        paint: {
          'line-color': '#0284C7',
          'line-width': 3.5,
          'line-dasharray': [3, 2]
        }
      });

      // 3. Emergency Safe Route Layer
      map.addSource('emergency-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: emergencyRoute?.route || { type: 'LineString', coordinates: [] }
        }
      });

      map.addLayer({
        id: 'emergency-route-line',
        type: 'line',
        source: 'emergency-route',
        paint: {
          'line-color': '#10B981',
          'line-width': 5.5,
          'line-opacity': 0.95
        }
      });
    });

    return () => {
      map.remove();
    };
  }, []);

  // Update Base Map Theme (Normal Map vs Dark Tactical vs Satellite)
  const handleChangeMapTheme = (themeKey) => {
    setActiveMapTheme(themeKey);
    const map = mapRef.current;
    if (!map) return;

    const theme = MAP_STYLES[themeKey];
    if (map.getSource('base-raster-tiles')) {
      // Update raster layer paint properties
      map.setPaintProperty('base-tiles-layer', 'raster-brightness-max', theme.brightness);
      map.setPaintProperty('base-tiles-layer', 'raster-contrast', theme.contrast);
      map.setPaintProperty('base-tiles-layer', 'raster-saturation', theme.saturation);

      // If switching to satellite, update tiles url
      const source = map.getSource('base-raster-tiles');
      if (source && source.setTiles) {
        source.setTiles(theme.tiles);
      }
    }
  };

  // Sync GeoJSON updates
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (map.getSource('city-segments') && segmentsGeoJson) {
      map.getSource('city-segments').setData(segmentsGeoJson);
    }
  }, [segmentsGeoJson]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (map.getSource('drainage-pipelines') && pipelinesGeoJson) {
      map.getSource('drainage-pipelines').setData(pipelinesGeoJson);
    }
  }, [pipelinesGeoJson]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (map.getSource('emergency-route')) {
      map.getSource('emergency-route').setData({
        type: 'Feature',
        geometry: emergencyRoute?.route || { type: 'LineString', coordinates: [] }
      });
    }
  }, [emergencyRoute]);

  // Update Delhi Pump Stations & Grievance Pins
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // 1. Delhi Jal Board Pump Stations
    if (layersVisible.pumps && pumpStations) {
      pumpStations.forEach(pump => {
        const el = document.createElement('div');
        el.className = 'cursor-pointer transform hover:scale-125 transition duration-200';
        el.innerHTML = `
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-blue-950 border-2 border-cyan-400 shadow-[0_0_14px_#00E5FF] text-cyan-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
            <span class="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div class="space-y-1.5 text-xs">
            <div class="font-bold text-cyan-400 text-sm">${pump.name}</div>
            <div class="text-slate-300">Capacity: <span class="font-mono text-white">${pump.capacity_lps} L/s</span></div>
            <div class="text-slate-300">Active Pumps: <span class="font-mono text-emerald-400 font-bold">${pump.active_pumps}/${pump.total_pumps} Turbines</span></div>
            <div class="text-slate-300">Yamuna Outfall Discharge: <span class="font-mono text-cyan-300 font-bold">${pump.current_discharge_lps} L/s</span></div>
            <div class="text-slate-300">Sluice Gate Aperture: <span class="font-mono text-amber-300">${pump.sluice_gate_open_pct}% Open</span></div>
            <div class="pt-1">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-cyan-300 border border-cyan-500/30">${pump.status}</span>
            </div>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(pump.coordinates)
          .setPopup(popup)
          .addTo(map);

        el.addEventListener('click', () => {
          if (onSelectPump) onSelectPump(pump);
        });

        markersRef.current.push(marker);
      });
    }

    // 2. Delhi Grievances (Minto Bridge, Kashmere Gate, ITO, Pul Prahladpur)
    if (layersVisible.grievances && grievances) {
      grievances.forEach(grv => {
        const el = document.createElement('div');
        el.className = 'cursor-pointer transform hover:scale-125 transition duration-200';
        const isCritical = grv.water_depth_cm >= 60;
        
        el.innerHTML = `
          <div class="flex flex-col items-center">
            <div class="px-2 py-0.5 text-[10px] font-bold font-mono rounded border ${
              isCritical
                ? 'bg-red-950/90 text-red-300 border-red-500 shadow-[0_0_10px_#EF4444]'
                : 'bg-amber-950/90 text-amber-300 border-amber-500 shadow-[0_0_10px_#F59E0B]'
            }">
              ${grv.water_depth_cm} cm
            </div>
            <div class="w-2.5 h-2.5 rounded-full ${isCritical ? 'bg-red-500' : 'bg-amber-400'} ring-2 ring-white/60"></div>
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div class="space-y-1.5 text-xs max-w-[250px]">
            <div class="flex items-center justify-between gap-2">
              <span class="font-bold text-red-400">${grv.id}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded font-mono ${
                grv.status === 'PENDING_REVIEW' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }">${grv.status}</span>
            </div>
            <div class="font-semibold text-slate-100">${grv.location_name}</div>
            <div class="text-slate-300 text-[11px] leading-relaxed">${grv.description}</div>
            <div class="p-1.5 bg-slate-900/80 rounded border border-slate-800 text-[10px]">
              <span class="text-amber-400 font-bold">Clearance Warning:</span> ${grv.clearance_issue}
            </div>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(grv.coordinates)
          .setPopup(popup)
          .addTo(map);

        el.addEventListener('click', () => {
          if (onSelectGrievance) onSelectGrievance(grv);
        });

        markersRef.current.push(marker);
      });
    }
  }, [layersVisible, pumpStations, grievances]);

  const toggleLayer = (key, layerIds) => {
    setLayersVisible(prev => {
      const nextVal = !prev[key];
      if (mapRef.current) {
        layerIds.forEach(layerId => {
          if (mapRef.current.getLayer(layerId)) {
            mapRef.current.setLayoutProperty(layerId, 'visibility', nextVal ? 'visible' : 'none');
          }
        });
      }
      return { ...prev, [key]: nextVal };
    });
  };

  return (
    <div className="relative w-full h-full min-h-[540px] rounded-xl overflow-hidden border border-command-border bg-[#090F1D] shadow-2xl">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[540px]" />

      {/* Top Left: Normal Map vs Dark Tactical Map Switcher & GIS Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2.5">
        {/* Map Style Theme Selector (Normal Map vs Dark Tactical) */}
        <div className="bg-command-card/95 backdrop-blur-md border border-command-border rounded-lg p-2 shadow-2xl text-xs flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-mono pl-1 uppercase font-bold">Map Style:</span>
          <button
            onClick={() => handleChangeMapTheme('NORMAL')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
              activeMapTheme === 'NORMAL'
                ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Standard daylight street map with full road network and landmarks"
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Normal Map</span>
          </button>

          <button
            onClick={() => handleChangeMapTheme('DARK')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
              activeMapTheme === 'DARK'
                ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Tactical dark command map with high contrast flood layers"
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Tactical Dark</span>
          </button>

          <button
            onClick={() => handleChangeMapTheme('SATELLITE')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
              activeMapTheme === 'SATELLITE'
                ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Aerial satellite imagery for river floodplains"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Satellite</span>
          </button>
        </div>

        {/* GIS Layers Overlay */}
        <div className="bg-command-card/95 backdrop-blur-md border border-command-border rounded-lg p-3 shadow-2xl text-xs space-y-2 max-w-xs">
          <div className="flex items-center justify-between border-b border-command-border pb-1.5">
            <span className="font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Delhi GIS Layers
            </span>
            <span className="text-[10px] text-slate-400 font-mono">MapLibre GL</span>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center justify-between cursor-pointer hover:text-white">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-red-500/80 border border-red-400"></span>
                Delhi Flood Risk Sectors
              </span>
              <input
                type="checkbox"
                checked={layersVisible.segments}
                onChange={() => toggleLayer('segments', ['city-segments-fill', 'city-segments-line'])}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0"
              />
            </label>

            {/* Delhi Drainage Pipeline Network */}
            <label className="flex items-center justify-between cursor-pointer hover:text-white">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-1 bg-cyan-400 shadow-[0_0_6px_#00E5FF]"></span>
                Delhi Trunk Drains (Najafgarh/Barapullah)
              </span>
              <input
                type="checkbox"
                checked={layersVisible.pipelines}
                onChange={() => toggleLayer('pipelines', ['drainage-pipelines-glow', 'drainage-pipelines-line'])}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer hover:text-white">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-cyan-300"></span>
                Delhi Jal Board Storm Regulators
              </span>
              <input
                type="checkbox"
                checked={layersVisible.pumps}
                onChange={() => setLayersVisible(p => ({ ...p, pumps: !p.pumps }))}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer hover:text-white">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                Citizen Inundation Pins (Minto/Kashmere)
              </span>
              <input
                type="checkbox"
                checked={layersVisible.grievances}
                onChange={() => setLayersVisible(p => ({ ...p, grievances: !p.grievances }))}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer hover:text-white">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-1 bg-emerald-400"></span>
                Emergency Safe Transit Route
              </span>
              <input
                type="checkbox"
                checked={layersVisible.emergencyRoute}
                onChange={() => toggleLayer('emergencyRoute', ['emergency-route-line'])}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0"
              />
            </label>
          </div>
        </div>

        {/* Risk Thresholds Legend */}
        <div className="bg-command-card/95 backdrop-blur-md border border-command-border rounded-lg p-2.5 shadow-xl text-[11px] flex items-center gap-2 font-mono">
          <span className="text-slate-400 text-[10px]">RISK:</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>&lt;15cm</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400"></span>15-30</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span>30-50</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span>50-75</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>&gt;75cm</span>
        </div>
      </div>

      {/* Top Right: Delhi Segment Hover Inspector */}
      {activeSegmentHover && (
        <div className="absolute top-4 right-14 z-10 bg-command-card/95 backdrop-blur-md border border-command-border rounded-lg p-3 shadow-2xl text-xs space-y-1.5 max-w-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-slate-100">{activeSegmentHover.name}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold" style={{
              backgroundColor: `${RISK_COLORS[activeSegmentHover.risk_level]}25`,
              color: RISK_COLORS[activeSegmentHover.risk_level],
              borderColor: `${RISK_COLORS[activeSegmentHover.risk_level]}50`,
              borderWidth: '1px'
            }}>
              {activeSegmentHover.risk_level}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Inundation Depth</span>
              <span className="font-mono font-bold text-sm text-cyan-300">{activeSegmentHover.current_water_level_cm} cm</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Delhi Elevation</span>
              <span className="font-mono text-slate-200">{activeSegmentHover.elevation_m} m AMSL</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Outfall Capacity</span>
              <span className="font-mono text-slate-200">{activeSegmentHover.drainage_capacity_m3s} m³/s</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Ward Population</span>
              <span className="font-mono text-slate-200">{Number(activeSegmentHover.population).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Emergency Transit Status */}
      {emergencyRoute && layersVisible.emergencyRoute && (
        <div className="absolute bottom-4 left-4 right-4 z-10 bg-command-card/95 backdrop-blur-md border border-emerald-500/40 rounded-lg p-2.5 shadow-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-100 flex items-center gap-2">
                Delhi Emergency Transit Corridor Active
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300">
                  {emergencyRoute.vehicle?.name}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 flex items-center gap-3 font-mono">
                <span>Distance: <b className="text-white">{emergencyRoute.summary?.distanceKm} km</b></span>
                <span>ETA: <b className="text-emerald-400">{emergencyRoute.summary?.durationMinutes} mins</b></span>
                <span className="text-amber-400">Avoided {emergencyRoute.summary?.avoidedSegmentsCount} flooded Delhi choke-points</span>
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Delhi Traffic Clear
          </span>
        </div>
      )}
    </div>
  );
}