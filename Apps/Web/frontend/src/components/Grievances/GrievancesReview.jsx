import React, { useState } from 'react';
import { UserCheck, AlertTriangle, CheckCircle2, Truck, Phone, MapPin, Camera, Clock, PlusCircle } from 'lucide-react';
import axios from 'axios';

export default function GrievancesReview({ grievances, onGrievanceUpdated }) {
  const [filter, setFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  const handleUpdateStatus = async (id, status, notes) => {
    setUpdatingId(id);
    try {
      await axios.patch(`/api/grievances/${id}/status`, {
        status,
        action_notes: notes || `Marked as ${status} by Authority Command Officer`
      });
      if (onGrievanceUpdated) onGrievanceUpdated();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSimulateCitizenReport = async () => {
    try {
      await axios.post('/api/grievances', {
        citizen_name: 'Harpreet Singh',
        citizen_phone: '+91-98110-44556',
        location_name: 'Minto Bridge Underpass (CP Outer Circle)',
        coordinates: [77.2220, 28.6360],
        segment_id: 'delhi-seg-2',
        water_depth_cm: 68,
        clearance_issue: 'Critical water depth; sedans stalled; DTC low-floor electric bus diverted; only heavy rescue trucks can pass',
        description: 'Underpass automated drainage pump capacity saturated. Traffic police has barricaded both carriageways.',
        urgency: 'CRITICAL'
      });
      if (onGrievanceUpdated) onGrievanceUpdated();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = grievances?.filter(g => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return g.status === 'PENDING_REVIEW';
    if (filter === 'ACTIONED') return g.status === 'DISPATCHED' || g.status === 'IN_PROGRESS';
    return true;
  }) || [];

  return (
    <div className="bg-command-card border border-command-border rounded-xl p-4 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-command-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              Citizen Grievances & Inundation Review Desk
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {grievances?.filter(g => g.status === 'PENDING_REVIEW').length || 0} Pending
              </span>
            </h3>
            <span className="text-xs text-slate-400">Crowdsourced Ground Telemetry & Vehicle Clearance</span>
          </div>
        </div>

        {/* Simulate New Report Button */}
        <button
          onClick={handleSimulateCitizenReport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 hover:text-white transition shadow-[0_0_10px_rgba(245,158,11,0.15)]"
          title="Simulate a new incoming citizen waterlogging report"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ Simulate Citizen Report</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs border-b border-command-border pb-2">
        {['ALL', 'PENDING', 'ACTIONED'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-md font-semibold transition ${
              filter === f
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {f === 'ALL' ? `All (${grievances?.length || 0})` : f === 'PENDING' ? 'Pending Review' : 'Dispatched / In Action'}
          </button>
        ))}
      </div>

      {/* Grievances Cards List */}
      <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
        {filtered.map((grv) => {
          const isCritical = grv.water_depth_cm >= 50;
          return (
            <div
              key={grv.id}
              className="bg-command-bg/70 border border-command-border/80 rounded-lg p-3 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-xs">{grv.id}</span>
                    <span className="text-slate-400 text-xs">|</span>
                    <span className="font-semibold text-xs text-slate-200 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" /> {grv.location_name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                    <span>Citizen: <b className="text-slate-200">{grv.citizen_name}</b></span>
                    <span className="flex items-center gap-1 font-mono"><Phone className="w-3 h-3 text-slate-400" /> {grv.citizen_phone}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    grv.status === 'PENDING_REVIEW'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                      : grv.status === 'DISPATCHED'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {grv.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Water Depth & Clearance Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded bg-command-card/90 border border-command-border/50 flex flex-col justify-center">
                  <span className="text-slate-400 text-[10px]">Reported Water Depth</span>
                  <span className={`text-base font-mono font-bold ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>
                    {grv.water_depth_cm} cm
                  </span>
                </div>
                <div className="sm:col-span-2 p-2 rounded bg-command-card/90 border border-command-border/50">
                  <span className="text-amber-400 font-bold text-[10px] flex items-center gap-1">
                    <Truck className="w-3 h-3" /> Vehicle Clearance Notice:
                  </span>
                  <p className="text-[11px] text-slate-200 mt-0.5 leading-snug">{grv.clearance_issue}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 bg-slate-900/50 p-2 rounded border border-slate-800">
                "{grv.description}"
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1 border-t border-command-border/50">
                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" /> {new Date(grv.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>

                <div className="flex items-center gap-2">
                  {grv.status === 'PENDING_REVIEW' && (
                    <button
                      disabled={updatingId === grv.id}
                      onClick={() => handleUpdateStatus(grv.id, 'VERIFIED', 'Field patrol verified report')}
                      className="px-2.5 py-1 rounded text-[11px] font-semibold bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 transition"
                    >
                      Verify Ground Truth
                    </button>
                  )}
                  {grv.status !== 'DISPATCHED' && grv.status !== 'RESOLVED' && (
                    <button
                      disabled={updatingId === grv.id}
                      onClick={() => handleUpdateStatus(grv.id, 'DISPATCHED', 'Dispatched Rapid Desilting & Drainage Squad')}
                      className="px-2.5 py-1 rounded text-[11px] font-semibold bg-blue-950/80 hover:bg-blue-900 border border-blue-500/50 text-blue-300 transition"
                    >
                      Dispatch Relief Unit
                    </button>
                  )}
                  {grv.status !== 'RESOLVED' && (
                    <button
                      disabled={updatingId === grv.id}
                      onClick={() => handleUpdateStatus(grv.id, 'RESOLVED', 'Water receded and drainage restored')}
                      className="px-2.5 py-1 rounded text-[11px] font-semibold bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 transition"
                    >
                      Mark Cleared
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
