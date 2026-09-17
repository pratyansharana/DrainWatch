import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { SocketProvider, useSocket } from './context/SocketContext';

import Navbar from './components/Layout/Navbar';
import MetricStrip from './components/Layout/MetricStrip';
import Footer from './components/Layout/Footer';

import MapLibreOSMView from './components/Map/MapLibreOSMView';
import HotspotsSection from './components/Hotspots/HotspotsSection';
import ReportModal from './components/Hotspots/ReportModal';
import DrainageSection from './components/Drainage/DrainageSection';
import AdvisorySection from './components/Advisory/AdvisorySection';

import Toast from './components/Common/Toast';
import {
  MapPin,
  AlertTriangle,
  Gauge,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronRight,
  Car,
  Clock
} from 'lucide-react';

function Dashboard() {
  const { liveAlerts, livePings, liveGrievances } = useSocket();

  // Primary Telemetry State
  const [segmentsGeoJson, setSegmentsGeoJson] = useState(null);
  const [drainageData, setDrainageData] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [weather, setWeather] = useState(null);

  // Active View & Selection
  const [activeTab, setActiveTab] = useState('MAP'); // 'MAP' | 'HOTSPOTS' | 'DRAINAGE' | 'ADVISORY'
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Search filter for map sidebar
  const [sidebarSearch, setSidebarSearch] = useState('');

  // Toast notification state
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Load initial data through API service layer
  const loadInitialData = async () => {
    try {
      const [seg, drain, grv, auth, alt, wth] = await Promise.all([
        api.getSegments(),
        api.getDrainage(),
        api.getHotspots(),
        api.getAuthorities(),
        api.getAlerts(),
        api.getWeather()
      ]);

      setSegmentsGeoJson(seg);
      setDrainageData(drain);
      setHotspots(grv);
      setAuthorities(auth);
      setAlerts(alt);
      setWeather(wth);
    } catch (err) {
      console.error('Data initialization error:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // WebSockets real-time sync
  useEffect(() => {
    if (liveGrievances && liveGrievances.length > 0) {
      setHotspots((prev) => [liveGrievances[0], ...prev.filter((g) => g.id !== liveGrievances[0].id)]);
      showToast(`New waterlogging reported: ${liveGrievances[0].location_name}`, 'info');
    }
  }, [liveGrievances]);

  useEffect(() => {
    if (liveAlerts && liveAlerts.length > 0) {
      setAlerts((prev) => [liveAlerts[0], ...prev.filter((a) => a.id !== liveAlerts[0].id)]);
      showToast(`New public advisory: ${liveAlerts[0].title}`, 'warning');
    }
  }, [liveAlerts]);

  // Handlers
  const handleSelectHotspot = (item) => {
    setSelectedHotspot(item);
    if (activeTab !== 'MAP') {
      setActiveTab('MAP');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    await api.updateHotspotStatus(id, status);
    setHotspots((prev) =>
      prev.map((h) => (h.id === id ? { ...h, status } : h))
    );
    showToast(`Hotspot status updated to ${status}`);
  };

  const handleSubmitReport = async (reportData) => {
    const created = await api.submitHotspot(reportData);
    setHotspots((prev) => [created, ...prev]);
    showToast('Incident reported successfully. Teams notified.', 'success');
  };

  const handleUpdatePump = async (pumpId, payload) => {
    await api.updatePump(pumpId, payload);
    setDrainageData((prev) => {
      if (!prev?.pumpStations) return prev;
      return {
        ...prev,
        pumpStations: prev.pumpStations.map((p) =>
          p.id === pumpId ? { ...p, ...payload } : p
        )
      };
    });
    showToast('Pump SCADA telemetry updated successfully.');
  };

  const handlePingAuthority = async (authId) => {
    await api.pingAuthority(authId);
    showToast('Direct hotline ping dispatched to emergency control.');
  };

  const handleBroadcastAlert = async (alertPayload) => {
    const created = await api.broadcastAlert(alertPayload);
    setAlerts((prev) => [created, ...prev]);
    showToast('Emergency advisory broadcasted across active channels.');
  };

  const criticalHotspots = hotspots.filter(
    (h) => h.urgency === 'CRITICAL' || h.water_depth_cm >= 70
  );

  const filteredSidebarHotspots = hotspots.filter((h) =>
    h.location_name?.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
    h.clearance_issue?.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Global Navigation Header */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        criticalCount={criticalHotspots.length}
      />

      {/* 2. Hydrological Gauge & Key Metric Strip */}
      <MetricStrip
        yamunaLevel={205.82}
        hotspotsCount={hotspots.length}
        criticalHotspotsCount={criticalHotspots.length}
        activePumps={17}
        totalPumps={19}
        rainfallRate={weather?.rainfall_rate_mmh || 58.4}
      />

      {/* 3. Main Structured Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs Bar for Clear Section Hierarchy */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3.5 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-2">
            {[
              { id: 'MAP', label: 'Live Flood Map', icon: MapPin },
              { id: 'HOTSPOTS', label: `Flooded Locations (${hotspots.length})`, icon: AlertTriangle },
              { id: 'DRAINAGE', label: 'Drainage Pumps', icon: Gauge },
              { id: 'ADVISORY', label: 'Emergency Coordination', icon: ShieldCheck }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>NCT Delhi Emergency Telemetry Active</span>
          </div>
        </div>

        {/* VIEW 1: STRUCTURED SIDE-BY-SIDE RADAR VIEW */}
        {activeTab === 'MAP' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Real-Time Situational Inundation Radar
                </h2>
                <p className="text-xs text-slate-500">
                  Interactive spatial telemetry, flood risk sectors, critical underpasses, and dewatering pumps.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold self-start sm:self-auto">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                  {criticalHotspots.length} Critical Underpasses Closed
                </span>
              </div>
            </div>

            {/* Structured 12-Column Grid: Map + Side Hotspots Queue */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left 8 Columns: High-Definition Map */}
              <div className="lg:col-span-8">
                <MapLibreOSMView
                  segmentsGeoJson={segmentsGeoJson}
                  drainageData={drainageData}
                  grievances={hotspots}
                  selectedHotspot={selectedHotspot}
                  onSelectHotspot={handleSelectHotspot}
                />
              </div>

              {/* Right 4 Columns: Structured Operations Desk */}
              <div className="lg:col-span-4 space-y-4">
                {/* Active Inundation Incidents Queue */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Inundated Sites ({hotspots.length})
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Click to Pan Map
                    </span>
                  </div>

                  {/* Filter input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Quick filter sites..."
                      value={sidebarSearch}
                      onChange={(e) => setSidebarSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Hotspots scroll list */}
                  <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1 custom-scrollbar">
                    {filteredSidebarHotspots.map((item) => {
                      const isSelected = selectedHotspot?.id === item.id;
                      const isCrit = item.urgency === 'CRITICAL' || item.water_depth_cm >= 70;

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectHotspot(item)}
                          className={`p-3 rounded-xl border transition cursor-pointer space-y-1.5 ${
                            isSelected
                              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-sm'
                              : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 line-clamp-1">
                              {item.location_name}
                            </span>
                            <span
                              className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                                isCrit
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.water_depth_cm} cm
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                            <Car className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{item.clearance_issue}</span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                            <span>Status: <strong className="text-slate-700 font-semibold">{item.status}</strong></span>
                            <span className="text-blue-600 font-semibold flex items-center gap-0.5 hover:underline">
                              Locate <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SCADA Sump Pumps Quick Status */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Primary Dewatering Sumps
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      17/19 Online
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="font-semibold text-slate-800">ITO Drain Regulator 12</span>
                      <span className="font-mono text-emerald-700 font-bold">17,200 L/s</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="font-semibold text-slate-800">Minto Bridge Dewatering Sump</span>
                      <span className="font-mono text-emerald-700 font-bold">11,400 L/s</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="font-semibold text-slate-800">Wazirabad Flood Relief</span>
                      <span className="font-mono text-emerald-700 font-bold">12,200 L/s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: HOTSPOTS / GRIEVANCES SECTION */}
        {activeTab === 'HOTSPOTS' && (
          <HotspotsSection
            hotspots={hotspots}
            selectedHotspot={selectedHotspot}
            onSelectHotspot={handleSelectHotspot}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {/* VIEW 3: DRAINAGE & SCADA PUMPS */}
        {activeTab === 'DRAINAGE' && (
          <DrainageSection
            drainageData={drainageData}
            onUpdatePump={handleUpdatePump}
          />
        )}

        {/* VIEW 4: EMERGENCY ADVISORIES */}
        {activeTab === 'ADVISORY' && (
          <AdvisorySection
            authorities={authorities}
            alerts={alerts}
            onPingAuthority={handlePingAuthority}
            onBroadcastAlert={handleBroadcastAlert}
          />
        )}
      </main>

      {/* 4. Reporting Modal Dialog */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitReport={handleSubmitReport}
      />

      {/* 5. Non-intrusive Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* 6. Authoritative Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <Dashboard />
    </SocketProvider>
  );
}