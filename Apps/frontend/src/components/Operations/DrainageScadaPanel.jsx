import React, { useState } from 'react';
import {
  Waves,
  Gauge,
  Power,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import axios from 'axios';

export default function DrainageScadaPanel({
  drainageData,
  onDrainageUpdated
}) {
  const [updatingPumpId, setUpdatingPumpId] = useState(null);

  const pipelines = drainageData?.pipelines?.features || [];
  const pumpStations = drainageData?.pumpStations || [];

  const handleTogglePump = async (pump) => {
    try {
      setUpdatingPumpId(pump.id);
      // Toggle between optimal and max
      const newActive = pump.active_pumps >= pump.total_pumps ? Math.max(1, pump.total_pumps - 1) : pump.total_pumps;
      const newStatus = newActive === pump.total_pumps ? 'RUNNING_MAX' : 'RUNNING_OPTIMAL';

      await axios.patch(`/api/drainage/pumps/${pump.id}`, {
        active_pumps: newActive,
        status: newStatus
      });

      if (onDrainageUpdated) onDrainageUpdated();
    } catch (err) {
      console.error('Failed to update pump station:', err);
    } finally {
      setUpdatingPumpId(null);
    }
  };

  const handleAdjustSluice = async (pump, newPct) => {
    try {
      setUpdatingPumpId(pump.id);
      await axios.patch(`/api/drainage/pumps/${pump.id}`, {
        sluice_gate_open_pct: newPct
      });
      if (onDrainageUpdated) onDrainageUpdated();
    } catch (err) {
      console.error('Failed to adjust sluice gate:', err);
    } finally {
      setUpdatingPumpId(null);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 overflow-y-auto pr-1 custom-scrollbar">
      {/* 1. Trunk Storm Outfalls Overview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <span>Delhi Trunk Drainage Channels</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            {pipelines.length} Major Outfalls
          </span>
        </div>

        <div className="space-y-2">
          {pipelines.map((f) => {
            const p = f.properties;
            const load = p.load_percentage || 50;
            const isCrit = load >= 85;
            const isHigh = load >= 70 && load < 85;

            return (
              <div
                key={p.id}
                className="p-2.5 rounded-xl bg-[#0D1424] border border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 truncate max-w-[220px]">
                    {p.name}
                  </span>
                  <span
                    className={`font-mono font-bold text-xs ${
                      isCrit
                        ? 'text-rose-400'
                        : isHigh
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {load}% Capacity
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCrit
                        ? 'bg-rose-500'
                        : isHigh
                        ? 'bg-amber-400'
                        : 'bg-cyan-400'
                    }`}
                    style={{ width: `${Math.min(100, load)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                  <span>Flow: {p.current_flow_m3s} / {p.flow_capacity_m3s} m³/s</span>
                  <span>Diameter: {p.diameter_mm} mm</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. High-Discharge Dewatering Pump Stations */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            <span>SCADA Dewatering Pump Stations</span>
          </h3>
          <span className="text-[10px] text-emerald-400 font-mono font-semibold">
            Auto-Sync
          </span>
        </div>

        <div className="space-y-2.5">
          {pumpStations.map((pump) => {
            const isAllRunning = pump.active_pumps >= pump.total_pumps;

            return (
              <div
                key={pump.id}
                className="p-3 rounded-xl bg-[#0D1424] border border-slate-800/90 space-y-2.5 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">
                      {pump.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Discharge: {pump.current_discharge_lps?.toLocaleString()} / {pump.capacity_lps?.toLocaleString()} L/s
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      isAllRunning
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {pump.active_pumps}/{pump.total_pumps} ACTIVE
                  </span>
                </div>

                {/* Sluice Gate Slider / Status */}
                <div className="space-y-1 bg-[#080C16] p-2 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-cyan-400" /> Sluice Gate Position:
                    </span>
                    <span className="font-mono text-cyan-300 font-bold">
                      {pump.sluice_gate_open_pct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={pump.sluice_gate_open_pct}
                    onChange={(e) => handleAdjustSluice(pump, parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 cursor-pointer h-1 bg-slate-700 rounded-lg"
                  />
                </div>

                {/* SCADA Action Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">
                    Status: <strong className="text-slate-300">{pump.status}</strong>
                  </span>

                  <button
                    onClick={() => handleTogglePump(pump)}
                    disabled={updatingPumpId === pump.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      isAllRunning
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{isAllRunning ? 'Throttle' : 'Max Force Dewater'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
