import React, { useState, useEffect } from 'react';
import {
  Waves,
  ShieldCheck,
  AlertOctagon,
  RefreshCw,
  Key,
  Clock,
  Radio,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

export default function CommandNavbar({
  yamunaLevel = 205.82,
  criticalHotspotsCount = 0,
  activePumpsCount = 17,
  totalPumpsCount = 19,
  onRefreshData,
  onOpenApiKeyModal,
  hasApiKey = false
}) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isDanger = yamunaLevel >= 205.33;

  return (
    <header className="w-full bg-[#0A101D] border-b border-slate-800/80 px-4 py-3 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/40">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
                  DELHI FLOOD COMMAND
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    NCT-DDMA
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400">
                Disaster Response, Drainage SCADA & Rapid Emergency System
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Telemetry Live</span>
          </div>
        </div>

        {/* Center: Hydrological Gauge */}
        <div className="flex items-center gap-4 bg-[#0F172A] border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isDanger ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">
                Yamuna @ Old Railway Bridge (Loha Pul)
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className={`font-mono text-sm font-bold ${isDanger ? 'text-rose-400' : 'text-amber-400'}`}>
                  {yamunaLevel} m
                </span>
                <span className="text-[10px] text-rose-400/80 font-semibold uppercase">
                  (Above Danger Mark 205.33m)
                </span>
              </div>
            </div>
          </div>

          <div className="hidden lg:block h-6 w-[1px] bg-slate-800" />

          <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-300">
            <div>
              <span className="text-slate-500">Warning:</span> 204.50m
            </div>
            <div>
              <span className="text-slate-500">Evacuation:</span> 208.40m
            </div>
          </div>
        </div>

        {/* Right: Quick Actions & Settings */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Google Maps API Key Config Button */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
              hasApiKey
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-slate-800/80 text-cyan-300 border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{hasApiKey ? 'Google API Connected' : 'Configure Google Key'}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefreshData}
            title="Refresh All Telemetry"
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-700 border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Clock */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-[#080C16] border border-slate-800 px-2.5 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{timeStr || 'LIVE'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
