import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Droplets, ShieldAlert, Cpu } from 'lucide-react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';

export default function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  if (loading || !data) {
    return (
      <div className="bg-command-card border border-command-border rounded-xl p-8 text-center text-slate-400 text-xs">
        Loading Delhi Hydrodynamic Analytics...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick KPI Overview */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-command-card border border-command-border p-3 rounded-lg">
          <span className="text-slate-400 text-[10px] block">Yamuna Outfall Discharge</span>
          <span className="text-lg font-bold font-mono text-cyan-300">
            {data.pumps?.totalDischargeLps?.toLocaleString()} L/s
          </span>
          <span className="text-[10px] text-emerald-400 block mt-0.5 font-mono">
            {data.pumps?.active} of {data.pumps?.total} Turbines Active
          </span>
        </div>

        <div className="bg-command-card border border-command-border p-3 rounded-lg">
          <span className="text-slate-400 text-[10px] block">Grievances Resolved</span>
          <span className="text-lg font-bold font-mono text-emerald-400">
            {data.grievanceStats?.resolved} / {data.grievanceStats?.total}
          </span>
          <span className="text-[10px] text-amber-400 block mt-0.5 font-mono">
            {data.grievanceStats?.pending} In Ground Review
          </span>
        </div>
      </div>

      {/* Hourly Rainfall vs Inundation Depth */}
      <div className="bg-command-card border border-command-border p-3.5 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Rainfall (mm/h) vs Waterlogging Depth (cm)
          </span>
          <span className="text-slate-400 font-mono text-[10px]">Past 6 Hours</span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.hourlyTrend}>
              <defs>
                <linearGradient id="colorRainTab" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDepthTab" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
              <YAxis stroke="#64748B" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#0B111E', borderColor: '#202E48', fontSize: '11px' }} />
              <Area type="monotone" dataKey="rainfall_mm" name="Rainfall mm/h" stroke="#00E5FF" fillOpacity={1} fill="url(#colorRainTab)" />
              <Area type="monotone" dataKey="avg_inundation_cm" name="Avg Depth cm" stroke="#EF4444" fillOpacity={1} fill="url(#colorDepthTab)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Delhi Sector Inundation Levels */}
      <div className="bg-command-card border border-command-border p-3.5 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-200">Current Inundation by Delhi Sector</span>
          <span className="text-slate-400 font-mono text-[10px]">Water Depth (cm)</span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.sectorVulnerability}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="code" stroke="#64748B" fontSize={9} />
              <YAxis stroke="#64748B" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#0B111E', borderColor: '#202E48', fontSize: '11px' }} />
              <Bar dataKey="depth_cm" name="Depth (cm)" fill="#38BDF8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}