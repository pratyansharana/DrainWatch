import React, { useState } from 'react';
import {
  AlertTriangle,
  MapPin,
  Car,
  CheckCircle2,
  Clock,
  Send,
  Search,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import axios from 'axios';

export default function HotspotsPanel({
  grievances = [],
  selectedHotspot,
  onSelectHotspot,
  onHotspotsUpdated
}) {
  const [filterText, setFilterText] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  const filtered = grievances.filter((g) => {
    const matchesSearch =
      g.location_name?.toLowerCase().includes(filterText.toLowerCase()) ||
      g.clearance_issue?.toLowerCase().includes(filterText.toLowerCase());
    const matchesUrgency =
      filterUrgency === 'ALL' || g.urgency === filterUrgency;
    return matchesSearch && matchesUrgency;
  });

  const handleStatusChange = async (id, newStatus, e) => {
    e.stopPropagation();
    try {
      setUpdatingId(id);
      await axios.patch(`/api/grievances/${id}/status`, { status: newStatus });
      if (onHotspotsUpdated) onHotspotsUpdated();
    } catch (err) {
      console.error('Failed to update grievance status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Search & Filter Header */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search underpass, ring road, or depth..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-[#080C16] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Urgency Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {['ALL', 'CRITICAL', 'HIGH'].map((urg) => (
            <button
              key={urg}
              onClick={() => setFilterUrgency(urg)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterUrgency === urg
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {urg === 'ALL' ? `All Inundations (${grievances.length})` : urg}
            </button>
          ))}
        </div>
      </div>

      {/* Hotspots Card List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No waterlogged locations matching criteria.
          </div>
        ) : (
          filtered.map((item) => {
            const isSelected = selectedHotspot?.id === item.id;
            const isCrit = item.urgency === 'CRITICAL' || item.water_depth_cm >= 70;

            return (
              <div
                key={item.id}
                onClick={() => onSelectHotspot(item)}
                className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-2 relative ${
                  isSelected
                    ? 'bg-[#142036] border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                    : 'bg-[#0D1424] border-slate-800 hover:border-slate-700 hover:bg-[#111A2E]'
                }`}
              >
                {/* Title & Depth Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isCrit ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    <h4 className="text-xs font-bold text-slate-100 line-clamp-1">
                      {item.location_name}
                    </h4>
                  </div>
                  <div
                    className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold shrink-0 ${
                      isCrit
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {item.water_depth_cm} cm
                  </div>
                </div>

                {/* Ground Clearance Warning */}
                <div className="flex items-center gap-1.5 text-[11px] text-amber-300/90 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  <Car className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.clearance_issue}</span>
                </div>

                {/* Description snippet */}
                {item.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}

                {/* Status & Quick Action Controls */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-400 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{item.id}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Status Dropdown / Buttons */}
                    <select
                      value={item.status}
                      disabled={updatingId === item.id}
                      onChange={(e) => handleStatusChange(item.id, e.target.value, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-[#080C16] border border-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="PENDING_REVIEW">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DISPATCHED">Dispatched</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectHotspot(item);
                      }}
                      className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 transition"
                      title="Focus on Google Map"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
