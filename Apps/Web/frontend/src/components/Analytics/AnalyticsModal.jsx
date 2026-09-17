import React, { useEffect, useState } from 'react';
import { BarChart3, X, TrendingUp, Droplets, CheckCircle2, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';

export default function AnalyticsModal({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get('/api/analytics/overview');
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-command-card border border-command-border rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-command-border bg-command-bg/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                Flood & Drainage Telemetry Analytics
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  EXECUTIVE BRIEFING
                </span>
              </h2>
              <p className="text-xs text-slate-400">Precipitation correlation, drainage loading, and citizen resolution speed</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar space-y-5 flex-1">
          {loading || !data ? (
            <div className="py-20 text-center text-slate-400">Loading analytics model...</div>
          ) : (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-command-bg/80 p-3 rounded-lg border border-command-border">
                  <span className="text-xs text-slate-400 block">Total Active Pumps</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    {data.pumps?.active} / {data.pumps?.total}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Discharge: {data.pumps?.totalDischargeLps?.toLocaleString()} L/s</span>
                </div>

                <div className="bg-command-bg/80 p-3 rounded-lg border border-command-border">
                  <span className="text-xs text-slate-400 block">Citizen Grievances</span>
                  <span className="text-xl font-bold font-mono text-cyan-300">
                    {data.grievanceStats?.total}
                  </span>
                  <span className="text-[10px] text-amber-400 block mt-0.5">{data.grievanceStats?.pending} Pending Ground Review</span>
                </div>

                <div className="bg-command-bg/80 p-3 rounded-lg border border-command-border">
                  <span className="text-xs text-slate-400 block">Actioned / Dispatched</span>
                  <span className="text-xl font-bold font-mono text-indigo-400">
                    {data.grievanceStats?.dispatched}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">NDRF & Drainage field squads</span>
                </div>

                <div className="bg-command-bg/80 p-3 rounded-lg border border-command-border">
                  <span className="text-xs text-slate-400 block">Broadcasted Alerts</span>
                  <span className="text-xl font-bold font-mono text-red-400">
                    {data.alertsCount}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Public emergency bulletins</span>
                </div>
              </div>

              {/* Chart 1: Rainfall vs Inundation Depth */}
              <div className="bg-command-bg/70 p-4 rounded-xl border border-command-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-cyan-400" /> Hourly Rainfall (mm/h) vs Average Inundation Depth (cm)
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">Past 6 Hours</span>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.hourlyTrend}>
                      <defs>
                        <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDepth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.5}/>
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                      <YAxis stroke="#64748B" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0B111E', borderColor: '#202E48', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="rainfall_mm" name="Rainfall (mm/h)" stroke="#00E5FF" fillOpacity={1} fill="url(#colorRain)" />
                      <Area type="monotone" dataKey="avg_inundation_cm" name="Avg Depth (cm)" stroke="#EF4444" fillOpacity={1} fill="url(#colorDepth)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Sector Depth Comparison */}
              <div className="bg-command-bg/70 p-4 rounded-xl border border-command-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">Current Inundation by City Sector (Water Depth cm)</span>
                  <span className="text-slate-400 font-mono text-[11px]">Topographic Analysis</span>
                </div>

                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.sectorVulnerability}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="code" stroke="#64748B" fontSize={11} />
                      <YAxis stroke="#64748B" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0B111E', borderColor: '#202E48', fontSize: '12px' }} />
                      <Bar dataKey="depth_cm" name="Water Depth (cm)" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-command-border bg-command-bg/80 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
