import React from 'react';
import { Shield, Radio, Megaphone, BarChart3, LogIn, LogOut, ChevronDown, CheckCircle2, Layout, Maximize2, Grid } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function Navbar({
  onOpenPingModal,
  onOpenAlertModal,
  onOpenAnalyticsModal,
  onOpenAuthPage,
  layoutMode,
  setLayoutMode,
  criticalCount,
  pendingGrievanceCount
}) {
  const { user, logout, switchRole } = useAuth();
  const { isConnected } = useSocket();

  return (
    <header className="bg-command-card/95 backdrop-blur-md border-b border-command-border sticky top-0 z-30 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Delhi Authority Branding */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,229,255,0.3)]">
            <Shield className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-300"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-2">
                Flood &amp; Furious
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  DDMA • DJB
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                {isConnected ? 'ONLINE' : 'CONNECTING'}
              </span>
              <span>•</span>
              <span className="text-red-400 font-semibold">{criticalCount || 0} Critical Sectors</span>
              <span>•</span>
              <span className="text-amber-400 font-semibold">{pendingGrievanceCount || 0} Reports</span>
            </div>
          </div>
        </div>

        {/* Center: Layout View Mode Selector */}
        <div className="hidden md:flex items-center bg-command-bg p-1 rounded-lg border border-command-border text-xs">
          <button
            onClick={() => setLayoutMode('SPLIT')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium text-[11px] ${
              layoutMode === 'SPLIT'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-[0_0_8px_rgba(0,229,255,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Split screen: Map on left, Operations dock on right"
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Split Command</span>
          </button>

          <button
            onClick={() => setLayoutMode('FULL_MAP')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium text-[11px] ${
              layoutMode === 'FULL_MAP'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-[0_0_8px_rgba(0,229,255,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Full viewport GIS Map view"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Full Map</span>
          </button>

          <button
            onClick={() => setLayoutMode('GRID')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium text-[11px] ${
              layoutMode === 'GRID'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-[0_0_8px_rgba(0,229,255,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Overview grid of all widgets"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Modular Grid</span>
          </button>
        </div>

        {/* Right: Quick Emergency Actions & User Profile */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPingModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-950/70 hover:bg-red-900/80 border border-red-500/50 text-red-200 transition shadow-[0_0_10px_rgba(239,68,68,0.2)]"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-red-400" />
            <span className="hidden sm:inline">Ping Agencies</span>
          </button>

          <button
            onClick={onOpenAlertModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/50 text-amber-200 transition shadow-[0_0_10px_rgba(245,158,11,0.2)]"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Broadcast</span>
          </button>

          {/* Officer Profile Switcher */}
          {user ? (
            <div className="relative group">
              <button className="flex items-center gap-2 pl-2 pr-2 py-1.5 rounded-lg bg-command-bg border border-command-border text-xs text-slate-200 hover:border-cyan-500 transition">
                <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-300 font-bold text-[10px]">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : 'AU'}
                </div>
                <div className="text-left hidden lg:block max-w-[130px] truncate">
                  <div className="font-bold text-[11px] leading-tight text-white truncate">{user.name}</div>
                  <div className="text-[9px] text-cyan-400 font-mono leading-none truncate">{user.badge}</div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <div className="absolute right-0 mt-1 w-72 bg-command-card border border-command-border rounded-xl shadow-2xl p-2 hidden group-hover:block text-xs z-50 animate-in fade-in">
                <div className="px-2.5 py-1.5 border-b border-command-border mb-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Authorized Officer:</span>
                  <div className="font-bold text-white text-xs">{user.name}</div>
                  <div className="text-[10px] text-cyan-400 leading-tight">{user.department}</div>
                </div>

                <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Switch Officer Authority:</div>
                <button
                  onClick={() => switchRole('DDMA_DIVISIONAL_COMMISSIONER')}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 transition space-y-0.5"
                >
                  <div className="font-bold text-white">Ashwani Kumar, IAS</div>
                  <div className="text-[10px] text-red-400">DDMA Central Command</div>
                </button>
                <button
                  onClick={() => switchRole('DJB_CHIEF_ENGINEER')}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 transition space-y-0.5"
                >
                  <div className="font-bold text-white">Er. S. K. Gupta</div>
                  <div className="text-[10px] text-cyan-400">Delhi Jal Board Drainage Regulators</div>
                </button>
                <button
                  onClick={() => switchRole('DELHI_TRAFFIC_POLICE_DCP')}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 transition space-y-0.5"
                >
                  <div className="font-bold text-white">Virender Vij, IPS</div>
                  <div className="text-[10px] text-amber-400">Delhi Traffic Police Control HQ</div>
                </button>
                <button
                  onClick={() => switchRole('IFC_CHIEF_ENGINEER')}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 transition space-y-0.5"
                >
                  <div className="font-bold text-white">Er. Rameshwar Dayal</div>
                  <div className="text-[10px] text-blue-400">I&FC Dept. (Yamuna Regulators)</div>
                </button>
                <button
                  onClick={() => switchRole('DFS_DIRECTOR')}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 transition space-y-0.5"
                >
                  <div className="font-bold text-white">Atul Garg</div>
                  <div className="text-[10px] text-rose-400">Delhi Fire Service (DFS Rescue)</div>
                </button>
                <button
                  onClick={() => switchRole('NDRF_8TH_BN_COMMANDER')}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 transition space-y-0.5"
                >
                  <div className="font-bold text-white">Cmdt. P. K. Srivastava</div>
                  <div className="text-[10px] text-emerald-400">NDRF 8th Battalion (NCR)</div>
                </button>

                <div className="pt-1.5 border-t border-command-border mt-1 flex items-center justify-between px-1">
                  <button
                    onClick={onOpenAuthPage}
                    className="text-[11px] text-cyan-300 hover:text-white flex items-center gap-1 font-semibold"
                  >
                    <LogIn className="w-3.5 h-3.5" /> Auth Gateway
                  </button>
                  <button
                    onClick={logout}
                    className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Log Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuthPage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}