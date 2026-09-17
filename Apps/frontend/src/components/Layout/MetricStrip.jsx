import React from 'react';
import {
  AlertTriangle,
  Waves,
  Gauge,
  CloudRain,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import Badge from '../Common/Badge';

export default function MetricStrip({
  yamunaLevel = 205.82,
  hotspotsCount = 4,
  criticalHotspotsCount = 2,
  activePumps = 17,
  totalPumps = 19,
  rainfallRate = 58.4
}) {
  const isDanger = yamunaLevel >= 205.33;

  return (
    <section className="bg-slate-50 border-b border-slate-200/80 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Yamuna River Hydro Gauge */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-blue-600" />
                Yamuna (Old Railway Bridge)
              </span>
              <Badge variant={isDanger ? 'critical' : 'warning'} size="sm" dot>
                {isDanger ? 'DANGER LEVEL' : 'WARNING'}
              </Badge>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                  {yamunaLevel.toFixed(2)}
                </span>
                <span className="text-xs font-semibold text-slate-500">meters</span>
              </div>
              <span className="text-[11px] text-red-600 font-medium">
                +0.49m above 205.33m
              </span>
            </div>
          </div>

          {/* 2. Critical Inundation Hotspots */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Flooded Underpasses
              </span>
              <Badge variant="critical" size="sm">
                {criticalHotspotsCount} Critical
              </Badge>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                  {hotspotsCount}
                </span>
                <span className="text-xs font-semibold text-slate-500">active sites</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Peak: 88cm (Kashmere Gate)
              </span>
            </div>
          </div>

          {/* 3. SCADA Dewatering Pumps */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-emerald-600" />
                SCADA Dewatering Sump
              </span>
              <Badge variant="success" size="sm" dot>
                Max Dewatering
              </Badge>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                  {activePumps}/{totalPumps}
                </span>
                <span className="text-xs font-semibold text-slate-500">pumps online</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">
                50,600 L/sec rate
              </span>
            </div>
          </div>

          {/* 4. IMD Precipitation Telemetry */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                IMD Safdarjung Telemetry
              </span>
              <Badge variant="warning" size="sm">
                Orange Alert
              </Badge>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                  {rainfallRate}
                </span>
                <span className="text-xs font-semibold text-slate-500">mm / hr</span>
              </div>
              <span className="text-[11px] text-slate-500">
                15-min check: 14.6mm
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
