import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';

import Navbar from './components/Navbar';
import TelemetryStrip from './components/TelemetryStrip';
import MapLibreView from './components/Map/MapLibreView';
import WeatherWidget from './components/Weather/WeatherWidget';
import MLPredictionPanel from './components/ML/MLPredictionPanel';
import DrainagePanel from './components/Drainage/DrainagePanel';
import GrievancesReview from './components/Grievances/GrievancesReview';
import EmergencyRoutingPanel from './components/Emergency/EmergencyRoutingPanel';
import AnalyticsTab from './components/Analytics/AnalyticsTab';
import PingAuthoritiesModal from './components/Modals/PingAuthoritiesModal';
import CitizenAlertModal from './components/Modals/CitizenAlertModal';
import AnalyticsModal from './components/Analytics/AnalyticsModal';
import AuthorityChatbot from './components/Chat/AuthorityChatbot';
import LoginPage from './components/Auth/LoginPage';

import { CloudRain, Waves, Navigation, UserCheck, BarChart3, ShieldAlert, Cpu } from 'lucide-react';

function DashboardContent() {
  const { user, isAuthenticated } = useAuth();
  const { lastPrediction, lastWeatherCheck, liveAlerts, livePings, liveGrievances } = useSocket();

  const [segmentsGeoJson, setSegmentsGeoJson] = useState(null);
  const [drainageData, setDrainageData] = useState(null);
  const [grievances, setGrievances] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [emergencyRoute, setEmergencyRoute] = useState(null);

  const [showAuthPage, setShowAuthPage] = useState(false);
  const [layoutMode, setLayoutMode] = useState('SPLIT'); // 'SPLIT' | 'FULL_MAP' | 'GRID'
  const [activeOpsTab, setActiveOpsTab] = useState('HYDRO'); // 'HYDRO' | 'DRAINAGE' | 'ROUTING' | 'GRIEVANCES' | 'ANALYTICS'

  const [isPingModalOpen, setIsPingModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);

  // Fetch initial telemetry
  const fetchAllData = async () => {
    try {
      const [segRes, drainRes, grvRes, authRes, altRes, wthRes, mlRes] = await Promise.all([
        axios.get('/api/segments'),
        axios.get('/api/drainage/network'),
        axios.get('/api/grievances'),
        axios.get('/api/pings/authorities'),
        axios.get('/api/alerts'),
        axios.get('/api/weather/live'),
        axios.get('/api/ml/status')
      ]);

      setSegmentsGeoJson(segRes.data);
      setDrainageData(drainRes.data);
      setGrievances(grvRes.data);
      setAuthorities(authRes.data);
      setAlerts(altRes.data);
      setWeatherData(wthRes.data);
      setPredictionData(mlRes.data.latestPrediction || mlRes.data.engineStatus);
    } catch (err) {
      console.error('Failed to load Delhi telemetry:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Update on Socket.IO events
  useEffect(() => {
    if (lastPrediction) {
      setPredictionData(lastPrediction);
      axios.get('/api/segments').then(r => setSegmentsGeoJson(r.data)).catch(console.error);
    }
  }, [lastPrediction]);

  useEffect(() => {
    if (lastWeatherCheck) {
      axios.get('/api/weather/live').then(r => setWeatherData(r.data)).catch(console.error);
    }
  }, [lastWeatherCheck]);

  useEffect(() => {
    if (liveAlerts && liveAlerts.length > 0) {
      setAlerts(prev => [liveAlerts[0], ...prev.filter(a => a.id !== liveAlerts[0].id)]);
    }
  }, [liveAlerts]);

  useEffect(() => {
    if (livePings && livePings.length > 0) {
      setAuthorities(prev => {
        const updated = [...prev];
        const pinged = livePings[0];
        const idx = updated.findIndex(a => a.id === pinged.id);
        if (idx !== -1) updated[idx] = pinged;
        return updated;
      });
    }
  }, [livePings]);

  useEffect(() => {
    if (liveGrievances && liveGrievances.length > 0) {
      setGrievances(prev => [liveGrievances[0], ...prev.filter(g => g.id !== liveGrievances[0].id)]);
    }
  }, [liveGrievances]);

  const criticalCount = segmentsGeoJson?.features?.filter(f => f.properties.risk_level === 'CRITICAL' || f.properties.risk_level === 'HIGH').length || 0;
  const pendingGrievanceCount = grievances?.filter(g => g.status === 'PENDING_REVIEW').length || 0;

  if (showAuthPage) {
    return (
      <LoginPage
        onLoginSuccess={() => {
          setShowAuthPage(false);
          fetchAllData();
        }}
      />
    );
  }

  const OPS_TABS = [
    { id: 'HYDRO', label: 'Hydro & Weather', icon: CloudRain, count: null },
    { id: 'DRAINAGE', label: 'Drainage', icon: Waves, count: `${drainageData?.pumpStations?.length || 4} pumps` },
    { id: 'ROUTING', label: 'Emergency Routes', icon: Navigation, count: emergencyRoute ? 'Active' : null },
    { id: 'GRIEVANCES', label: 'Citizen Reports', icon: UserCheck, count: pendingGrievanceCount > 0 ? `${pendingGrievanceCount} Pending` : null, alert: pendingGrievanceCount > 0 },
    { id: 'ANALYTICS', label: 'Analytics', icon: BarChart3, count: null }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#070D18] text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* 1. Top Command Header */}
      <Navbar
        onOpenPingModal={() => setIsPingModalOpen(true)}
        onOpenAlertModal={() => setIsAlertModalOpen(true)}
        onOpenAnalyticsModal={() => setIsAnalyticsModalOpen(true)}
        onOpenAuthPage={() => setShowAuthPage(true)}
        layoutMode={layoutMode}
        setLayoutMode={setLayoutMode}
        criticalCount={criticalCount}
        pendingGrievanceCount={pendingGrievanceCount}
      />

      {/* 2. Real-time Telemetry Strip */}
      <TelemetryStrip
        weatherData={weatherData}
        predictionData={predictionData}
        segmentsGeoJson={segmentsGeoJson}
        drainageData={drainageData}
        grievances={grievances}
      />

      {/* 3. Main Command Workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-4">
        {/* VIEW 1: ORGANIZED SPLIT COMMAND (DEFAULT) */}
        {layoutMode === 'SPLIT' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left 7 Columns: Interactive GIS Map */}
            <div className="lg:col-span-7 h-[680px] w-full sticky top-16">
              <MapLibreView
                segmentsGeoJson={segmentsGeoJson}
                pipelinesGeoJson={drainageData?.pipelines}
                pumpStations={drainageData?.pumpStations}
                grievances={grievances}
                emergencyRoute={emergencyRoute}
                onSelectSegment={(seg) => console.log('Selected segment:', seg)}
                onSelectGrievance={(grv) => {
                  setActiveOpsTab('GRIEVANCES');
                }}
                onSelectPump={(pump) => {
                  setActiveOpsTab('DRAINAGE');
                }}
              />
            </div>

            {/* Right 5 Columns: Operations Control Desk with Tabs */}
            <div className="lg:col-span-5 h-[680px] flex flex-col bg-command-card border border-command-border rounded-xl shadow-2xl overflow-hidden">
              {/* Organized Operations Tab Bar */}
              <div className="flex items-center gap-1 p-1.5 bg-[#090F1D] border-b border-command-border overflow-x-auto custom-scrollbar">
                {OPS_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeOpsTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveOpsTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                      {tab.count && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          tab.alert ? 'bg-amber-500/30 text-amber-300' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Operations Active Pane Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-4">
                {activeOpsTab === 'HYDRO' && (
                  <div className="space-y-4">
                    <WeatherWidget
                      weatherData={weatherData}
                      onRefresh={() => axios.get('/api/weather/live').then(r => setWeatherData(r.data))}
                    />
                    <MLPredictionPanel
                      predictionData={predictionData}
                      onPredictionTriggered={() => {
                        axios.get('/api/ml/status').then(r => setPredictionData(r.data.latestPrediction));
                        axios.get('/api/segments').then(r => setSegmentsGeoJson(r.data));
                      }}
                    />
                  </div>
                )}

                {activeOpsTab === 'DRAINAGE' && (
                  <DrainagePanel
                    drainageData={drainageData}
                    onPumpUpdated={() => axios.get('/api/drainage/network').then(r => setDrainageData(r.data))}
                  />
                )}

                {activeOpsTab === 'ROUTING' && (
                  <EmergencyRoutingPanel
                    grievances={grievances}
                    onRouteCalculated={(route) => setEmergencyRoute(route)}
                  />
                )}

                {activeOpsTab === 'GRIEVANCES' && (
                  <GrievancesReview
                    grievances={grievances}
                    onGrievanceUpdated={() => axios.get('/api/grievances').then(r => setGrievances(r.data))}
                  />
                )}

                {activeOpsTab === 'ANALYTICS' && (
                  <AnalyticsTab />
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: FULL MAP VIEW */}
        {layoutMode === 'FULL_MAP' && (
          <div className="h-[750px] w-full">
            <MapLibreView
              segmentsGeoJson={segmentsGeoJson}
              pipelinesGeoJson={drainageData?.pipelines}
              pumpStations={drainageData?.pumpStations}
              grievances={grievances}
              emergencyRoute={emergencyRoute}
              onSelectSegment={(seg) => console.log('Selected segment:', seg)}
              onSelectGrievance={(grv) => {
                setLayoutMode('SPLIT');
                setActiveOpsTab('GRIEVANCES');
              }}
              onSelectPump={(pump) => {
                setLayoutMode('SPLIT');
                setActiveOpsTab('DRAINAGE');
              }}
            />
          </div>
        )}

        {/* VIEW 3: MODULAR DASHBOARD GRID */}
        {layoutMode === 'GRID' && (
          <div className="space-y-4">
            <div className="h-[480px] w-full">
              <MapLibreView
                segmentsGeoJson={segmentsGeoJson}
                pipelinesGeoJson={drainageData?.pipelines}
                pumpStations={drainageData?.pumpStations}
                grievances={grievances}
                emergencyRoute={emergencyRoute}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <WeatherWidget weatherData={weatherData} onRefresh={() => axios.get('/api/weather/live').then(r => setWeatherData(r.data))} />
              <MLPredictionPanel predictionData={predictionData} onPredictionTriggered={() => axios.get('/api/ml/status').then(r => setPredictionData(r.data.latestPrediction))} />
              <DrainagePanel drainageData={drainageData} onPumpUpdated={() => axios.get('/api/drainage/network').then(r => setDrainageData(r.data))} />
              <EmergencyRoutingPanel grievances={grievances} onRouteCalculated={(route) => setEmergencyRoute(route)} />
              <GrievancesReview grievances={grievances} onGrievanceUpdated={() => axios.get('/api/grievances').then(r => setGrievances(r.data))} />
              <AnalyticsTab />
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <PingAuthoritiesModal
        isOpen={isPingModalOpen}
        onClose={() => setIsPingModalOpen(false)}
        authorities={authorities}
        onPingSent={() => axios.get('/api/pings/authorities').then(r => setAuthorities(r.data))}
      />

      <CitizenAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        alerts={alerts}
        onAlertBroadcasted={() => axios.get('/api/alerts').then(r => setAlerts(r.data))}
      />

      <AnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
      />

      {/* Authority Copilot AI */}
      <AuthorityChatbot
        onActionExecuted={() => {
          fetchAllData();
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <DashboardContent />
      </SocketProvider>
    </AuthProvider>
  );
}