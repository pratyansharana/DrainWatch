import React, { useState } from 'react';
import { Shield, Lock, User, KeyRound, AlertCircle, CheckCircle2, ChevronRight, Building, Radio, Compass } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage({ onLoginSuccess }) {
  const { loginWithCredentials, switchRole } = useAuth();
  const [username, setUsername] = useState('ddma.commander');
  const [password, setPassword] = useState('password123');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const PRESET_OFFICERS = [
    {
      id: 'usr-ddma',
      name: 'Ashwani Kumar, IAS',
      role: 'DDMA_DIVISIONAL_COMMISSIONER',
      title: 'Divisional Commissioner & Secy (Disaster Mgmt)',
      dept: 'Delhi Disaster Management Authority (DDMA)',
      badge: 'DDMA-01',
      username: 'ddma.commander',
      color: 'border-red-500/50 bg-red-950/40 text-red-200'
    },
    {
      id: 'usr-djb',
      name: 'Er. S. K. Gupta',
      role: 'DJB_CHIEF_ENGINEER',
      title: 'Chief Engineer (Drainage & Regulators)',
      dept: 'Delhi Jal Board (DJB Storm Outfalls)',
      badge: 'DJB-EIC',
      username: 'djb.chief',
      color: 'border-cyan-500/50 bg-cyan-950/40 text-cyan-200'
    },
    {
      id: 'usr-traffic',
      name: 'Virender Vij, IPS',
      role: 'DELHI_TRAFFIC_POLICE_DCP',
      title: 'DCP Traffic Command & Control',
      dept: 'Delhi Traffic Police Control HQ',
      badge: 'DTP-HQ',
      username: 'traffic.dcp',
      color: 'border-amber-500/50 bg-amber-950/40 text-amber-200'
    },
    {
      id: 'usr-ndrf',
      name: 'Commandant P. K. Srivastava',
      role: 'NDRF_8TH_BN_COMMANDER',
      title: 'Battalion Commander (Swift Water Rescue)',
      dept: 'NDRF 8th Battalion (Ghaziabad / Delhi Sector)',
      badge: 'NDRF-8BN',
      username: 'ndrf.8bn',
      color: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200'
    },
    {
      id: 'usr-ifc',
      name: 'Er. Rameshwar Dayal',
      role: 'IFC_CHIEF_ENGINEER',
      title: 'Chief Engineer (Yamuna Barrage & Regulators)',
      dept: 'Irrigation & Flood Control Dept. (I&FC)',
      badge: 'IFC-YAM',
      username: 'ifc.chief',
      color: 'border-blue-500/50 bg-blue-950/40 text-blue-200'
    },
    {
      id: 'usr-dfs',
      name: 'Atul Garg',
      role: 'DFS_DIRECTOR',
      title: 'Director (Emergency Dewatering & Rescue Wing)',
      dept: 'Delhi Fire Service (DFS)',
      badge: 'DFS-HQ',
      username: 'dfs.director',
      color: 'border-red-500/50 bg-red-950/40 text-red-200'
    },
    {
      id: 'usr-mcd',
      name: 'Er. Rajesh Mundra',
      role: 'MCD_CHIEF_ENGINEER',
      title: 'Engineer-in-Chief (Nullah Desilting & Pumping)',
      dept: 'Municipal Corporation of Delhi (MCD Flood Cell)',
      badge: 'MCD-FLD',
      username: 'mcd.engineer',
      color: 'border-purple-500/50 bg-purple-950/40 text-purple-200'
    }
  ];

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await axios.post('/api/auth/login', { username, password });
      if (res.data && res.data.token) {
        localStorage.setItem('authority_token', res.data.token);
        localStorage.setItem('authority_user', JSON.stringify(res.data.user));
        if (loginWithCredentials) loginWithCredentials(res.data.user, res.data.token);
        if (onLoginSuccess) onLoginSuccess(res.data.user);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Authorization failed. Please verify badge credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (officer) => {
    setUsername(officer.username);
    setPassword('password123');
    switchRole(officer.role);
    if (onLoginSuccess) {
      onLoginSuccess({
        id: officer.id,
        name: officer.name,
        role: officer.role,
        department: officer.dept,
        designation: officer.title,
        badge: officer.badge
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070D18] p-4 sm:p-6 relative overflow-hidden text-slate-100">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        {/* Left Column: Official Delhi Authority Branding */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              GOVERNMENT OF NCT OF DELHI • SECURE GATEWAY
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Delhi Flood Command &amp; Control
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  Authority Portal
                </span>
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                Integrated mission-critical command center for the Yamuna Flood Basin, Najafgarh Drain, Barapullah System, and Delhi Jal Board stormwater infrastructure.
              </p>
            </div>

            {/* Quick Live Stats Ticker */}
            <div className="p-3.5 rounded-xl bg-[#0B1323] border border-[#1C2942] space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" /> Live Delhi Flood Alert
                </span>
                <span className="font-mono text-red-400 font-bold">RED ALERT</span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Yamuna River Level:</span>
                  <span className="text-red-400 font-bold">208.45 m (Danger: 205.33m)</span>
                </div>
                <div className="flex justify-between">
                  <span>Hathnikund Barrage:</span>
                  <span className="text-amber-300">Active High-Discharge</span>
                </div>
                <div className="flex justify-between">
                  <span>Minto Bridge Dewatering:</span>
                  <span className="text-cyan-400">Turbine Pumps 4/4 Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 space-y-1">
            <p>Protected by Multi-Agency Disaster Protocol (DDMA / DJB / Delhi Police / NDRF / MCD).</p>
            <p className="font-mono text-[11px]">System Clearance: LEVEL-4 INCIDENT COMMANDER</p>
          </div>
        </div>

        {/* Right Column: Authorization Login Form */}
        <div className="lg:col-span-6 bg-command-card/95 border border-command-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-md">
          <div className="border-b border-command-border pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                Officer Authorization
              </h2>
              <p className="text-xs text-slate-400">Enter your official credentials or select officer profile</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Official Officer Username:
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="e.g. ddma.commander"
                className="w-full bg-command-bg border border-command-border rounded-lg px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none transition font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Security Access Token / Password:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full bg-command-bg border border-command-border rounded-lg px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none transition font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_15px_rgba(0,229,255,0.3)] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              {isLoading ? 'Verifying Credentials...' : 'Authorize & Enter Delhi C2 Center'}
            </button>
          </form>

          {/* Pre-Approved Quick Access Profiles */}
          <div className="space-y-2.5 pt-2 border-t border-command-border">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Direct Access by Department Officer:
            </span>

            <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {PRESET_OFFICERS.map((officer) => (
                <button
                  key={officer.id}
                  type="button"
                  onClick={() => handleSelectPreset(officer)}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-800 bg-command-bg/60 hover:bg-slate-800/80 hover:border-slate-700 transition flex items-center justify-between group"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-white flex items-center gap-2">
                      {officer.name}
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {officer.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-cyan-400 font-medium">{officer.title}</div>
                    <div className="text-[10px] text-slate-400">{officer.dept}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}