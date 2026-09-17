import React from 'react';
import { Waves, CloudRain, Cpu, AlertTriangle, UserCheck, ShieldAlert } from 'lucide-react';

export default function TelemetryStrip({
  weatherData,
  predictionData,
  segmentsGeoJson,
  drainageData,
  grievances
}) {
  const criticalCount = segmentsGeoJson?.features?.filter(f => f.properties.risk_level === 'CRITICAL' || f.properties.risk_level === 'HIGH').length || 0;
  const pendingGrievanceCount = grievances?.filter(g => g.status === 'PENDING_REVIEW').length || 0;
  const totalPumps = drainageData?.pumpStations?.reduce((sum, p) => sum + p.total_pumps, 0) || 19;
  const activePumps = drainageData?.pumpStations?.reduce((sum, p) => sum + p.active_pumps, 0) || 17;
  const totalDischarge = drainageData?.pumpStations?.reduce((sum, p) => sum + p.current_discharge_lps, 0) || 50600;

  return (
    <div className="bg-[#090F1C] border-b border-command-border/80 px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto custom-scrollbar whitespace-nowrap">
        {/* Metric 1: Yamuna Level */}
        <div className="flex items-center gap-2 pr-4 border-r border-command-border/60">
          <div className="p-1 rounded bg-red-500/20 text-red-400">
            <Waves className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Yamuna River Level:</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="font-bold text-red-400 text-xs">208.45 m</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-red-950 text-red-300 font-bold border border-red-500/40">
                +3.12m DANGER
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: IMD Rainfall */}
        <div className="flex items-center gap-2 px-4 border-r border-command-border/60">
          <div className="p-1 rounded bg-cyan-500/20 text-cyan-400">
            <CloudRain className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">IMD Doppler Radar:</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="font-bold text-cyan-300 text-xs">
                {weatherData?.precipitation_rate_mm_hr || 48.5} mm/h
              </span>
              <span className="text-[10px] text-amber-400 font-medium">
                {weatherData?.storm_alert_level || 'RED_ALERT'}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: DJB Pumps */}
        <div className="flex items-center gap-2 px-4 border-r border-command-border/60">
          <div className="p-1 rounded bg-blue-500/20 text-blue-400">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">DJB Outfall Sump Turbines:</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="font-bold text-emerald-400 text-xs">
                {activePumps} / {totalPumps} Active
              </span>
              <span className="text-[10px] text-slate-400">
                ({totalDischarge.toLocaleString()} L/s)
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: Critical Flood Sectors */}
        <div className="flex items-center gap-2 px-4 border-r border-command-border/60">
          <div className="p-1 rounded bg-red-500/20 text-red-400">
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Inundated Choke Points:</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="font-bold text-red-400 text-xs">{criticalCount} Sectors High Risk</span>
            </div>
          </div>
        </div>

        {/* Metric 5: Citizen Grievances */}
        <div className="flex items-center gap-2 pl-4">
          <div className="p-1 rounded bg-amber-500/20 text-amber-400">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Citizen Inundation Reports:</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="font-bold text-amber-300 text-xs">{pendingGrievanceCount} Pending Review</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}