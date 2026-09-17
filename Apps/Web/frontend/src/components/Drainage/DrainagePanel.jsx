import React, { useState } from 'react';
import { Waves, Sliders, Play, Square, CheckCircle, AlertCircle, Gauge, Activity } from 'lucide-react';
import axios from 'axios';

export default function DrainagePanel({ drainageData, onPumpUpdated }) {
  const [loadingPumpId, setLoadingPumpId] = useState(null);

  if (!drainageData) return null;
  const { pipelines, pumpStations } = drainageData;

  const handleTogglePump = async (pump, newStatus, newActivePumps, newSluicePct) => {
    setLoadingPumpId(pump.id);
    try {
      await axios.post(`/api/drainage/pumps/${pump.id}/toggle`, {
        status: newStatus || pump.status,
        active_pumps: newActivePumps !== undefined ? newActivePumps : pump.active_pumps,
        sluice_gate_open_pct: newSluicePct !== undefined ? newSluicePct : pump.sluice_gate_open_pct
      });
      if (onPumpUpdated) onPumpUpdated();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPumpId(null);
    }
  };

  const totalCityDischarge = pumpStations?.reduce((sum, p) => sum + p.current_discharge_lps, 0) || 0;

  return (
    <div className="bg-command-card border border-command-border rounded-xl p-4 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-command-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Waves className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              Storm Drainage Infrastructure & Outfalls
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                SCADA Active
              </span>
            </h3>
            <span className="text-xs text-slate-400">Total Outfall Discharge: <b className="font-mono text-cyan-300">{totalCityDischarge.toLocaleString()} L/s</b></span>
          </div>
        </div>
      </div>

      {/* Pump Stations SCADA Control Cards */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>High-Flow Sump & Storm Pump Stations ({pumpStations?.length || 0})</span>
          <span className="text-[11px] text-slate-500 font-mono">Dynamic Valve Telemetry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pumpStations?.map((pump) => {
            const isMax = pump.status === 'RUNNING_MAX';
            const isStandby = pump.status === 'STANDBY_READY';

            return (
              <div
                key={pump.id}
                className="bg-command-bg/70 border border-command-border/70 rounded-lg p-3 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-xs text-slate-100 truncate">{pump.name}</div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                    isMax
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : isStandby
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {pump.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-command-card/80 p-2 rounded border border-command-border/40">
                    <span className="text-slate-400 text-[10px] block">Turbine Pumps</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {pump.active_pumps} / {pump.total_pumps} Active
                    </span>
                  </div>
                  <div className="bg-command-card/80 p-2 rounded border border-command-border/40">
                    <span className="text-slate-400 text-[10px] block">Current Discharge</span>
                    <span className="text-cyan-300 font-bold text-sm">
                      {pump.current_discharge_lps} L/s
                    </span>
                  </div>
                </div>

                {/* Sluice Gate Indicator */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Sluice Gate Aperture</span>
                    <span className="font-mono text-amber-300 font-bold">{pump.sluice_gate_open_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-amber-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${pump.sluice_gate_open_pct}%` }}
                    />
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    disabled={loadingPumpId === pump.id}
                    onClick={() => handleTogglePump(pump, 'RUNNING_MAX', pump.total_pumps, 100)}
                    className="flex-1 py-1 rounded text-[10px] font-bold bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 transition"
                  >
                    Max Power (100%)
                  </button>
                  <button
                    disabled={loadingPumpId === pump.id}
                    onClick={() => handleTogglePump(pump, 'RUNNING_OPTIMAL', Math.ceil(pump.total_pumps / 2), 60)}
                    className="flex-1 py-1 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
                  >
                    Auto Optimal
                  </button>
                  <button
                    disabled={loadingPumpId === pump.id}
                    onClick={() => handleTogglePump(pump, 'STANDBY_READY', 0, 15)}
                    className="px-2 py-1 rounded text-[10px] font-bold bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 transition"
                  >
                    Standby
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trunk Pipelines Status */}
      <div className="space-y-2 pt-1 border-t border-command-border">
        <span className="text-xs font-semibold text-slate-300 block">
          Main Underground Storm Drain Pipelines
        </span>
        <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
          {pipelines?.features?.map((f) => {
            const p = f.properties;
            const isHigh = p.load_percentage >= 80;
            return (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 rounded bg-command-bg/50 border border-command-border/40 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-200">{p.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Ø {p.diameter_mm}mm | Flow: {p.current_flow_m3s} / {p.flow_capacity_m3s} m³/s
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-mono font-bold text-xs ${isHigh ? 'text-red-400' : 'text-cyan-400'}`}>
                    {p.load_percentage}% Load
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
