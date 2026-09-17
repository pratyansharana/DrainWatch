import React, { useState } from 'react';
import {
  Waves,
  Gauge,
  Power,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../Common/Card';
import Badge from '../Common/Badge';
import Button from '../Common/Button';

export default function DrainageSection({
  drainageData,
  onUpdatePump
}) {
  const [updatingId, setUpdatingId] = useState(null);

  const pipelines = drainageData?.pipelines?.features || [];
  const pumpStations = drainageData?.pumpStations || [];

  const handleTogglePump = async (pump) => {
    try {
      setUpdatingId(pump.id);
      const isMax = pump.active_pumps >= pump.total_pumps;
      const newActive = isMax ? Math.max(1, pump.total_pumps - 1) : pump.total_pumps;
      const newStatus = isMax ? 'RUNNING_OPTIMAL' : 'RUNNING_MAX';

      await onUpdatePump(pump.id, {
        active_pumps: newActive,
        status: newStatus
      });
    } catch (err) {
      console.error('Failed to update pump:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSluiceChange = async (pump, newPct) => {
    try {
      setUpdatingId(pump.id);
      await onUpdatePump(pump.id, {
        sluice_gate_open_pct: newPct
      });
    } catch (err) {
      console.error('Failed to adjust sluice gate:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Drainage Pumps & Canal Status</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Live Monitoring
          </span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time flow levels in major Delhi drainage canals and active pump stations.
        </p>
      </div>

      {/* 2. Trunk Drainage Canals Progress */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Waves className="w-4 h-4 text-blue-600" />
          <span>Primary Trunk Storm Drainage Canals</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pipelines.map((feature) => {
            const p = feature.properties;
            const load = p.load_percentage || 50;
            const isCrit = load >= 85;
            const isHigh = load >= 70 && load < 85;

            return (
              <Card key={p.id}>
                <div className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {p.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Diameter: {p.diameter_mm} mm
                      </span>
                    </div>
                    <Badge
                      variant={isCrit ? 'critical' : isHigh ? 'warning' : 'success'}
                      size="sm"
                    >
                      {load}% Load
                    </Badge>
                  </div>

                  {/* Flow progress bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCrit
                            ? 'bg-red-500'
                            : isHigh
                            ? 'bg-amber-500'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(100, load)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>Flow: {p.current_flow_m3s} m³/s</span>
                      <span>Capacity: {p.flow_capacity_m3s} m³/s</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 3. SCADA Dewatering Pump Stations */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-emerald-600" />
            <span>High-Discharge Dewatering Pump Stations (DJB / PWD)</span>
          </h3>
          <span className="text-xs font-semibold text-slate-500 font-mono">
            {pumpStations.length} Active Stations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pumpStations.map((pump) => {
            const isAllRunning = pump.active_pumps >= pump.total_pumps;

            return (
              <Card key={pump.id}>
                <div className="p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {pump.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Discharge Capacity: {pump.capacity_lps?.toLocaleString()} L/sec
                      </p>
                    </div>

                    <Badge variant={isAllRunning ? 'success' : 'info'} size="sm" dot>
                      {pump.active_pumps} / {pump.total_pumps} Active
                    </Badge>
                  </div>

                  {/* Sluice Gate Position Controller */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-blue-600" />
                        Sluice Gate Aperture
                      </span>
                      <span className="font-mono font-bold text-blue-700">
                        {pump.sluice_gate_open_pct}% Open
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={pump.sluice_gate_open_pct}
                      onChange={(e) => handleSluiceChange(pump, parseInt(e.target.value, 10))}
                      className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>

                  {/* Discharge Rate & Force Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                        Discharge Rate
                      </span>
                      <span className="font-mono font-bold text-slate-800 text-xs">
                        {pump.current_discharge_lps?.toLocaleString()} Liters / sec
                      </span>
                    </div>

                    <Button
                      variant={isAllRunning ? 'secondary' : 'primary'}
                      size="sm"
                      icon={Power}
                      loading={updatingId === pump.id}
                      onClick={() => handleTogglePump(pump)}
                    >
                      {isAllRunning ? 'Throttle to Optimal' : 'Max Force Dewater'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
