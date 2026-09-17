import React, { useState } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  MapPin,
  Car,
  Clock,
  CheckCircle2,
  List,
  LayoutGrid,
  ChevronRight
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../Common/Card';
import Badge from '../Common/Badge';
import Button from '../Common/Button';

export default function HotspotsSection({
  hotspots = [],
  selectedHotspot,
  onSelectHotspot,
  onUpdateStatus
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('ALL');
  const [viewMode, setViewMode] = useState('CARDS'); // 'CARDS' | 'TABLE'

  const filtered = hotspots.filter((item) => {
    const matchesQuery =
      item.location_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.clearance_issue?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUrgency =
      filterUrgency === 'ALL' || item.urgency === filterUrgency;

    return matchesQuery && matchesUrgency;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED':
        return <Badge variant="success" size="sm">Resolved</Badge>;
      case 'DISPATCHED':
        return <Badge variant="info" size="sm">Dispatched</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="warning" size="sm">In Progress</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Pending Review</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Flooded Locations</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {filtered.length} Sites
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time depth measurements, vehicle clearance advisories, and inter-agency dispatch status.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('CARDS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              viewMode === 'CARDS'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Cards</span>
          </button>
          <button
            onClick={() => setViewMode('TABLE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              viewMode === 'TABLE'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by underpass (e.g., Minto Bridge, Pul Prahladpur, ITO)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        {/* Urgency Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          {[
            { id: 'ALL', label: 'All Urgencies' },
            { id: 'CRITICAL', label: 'Critical (>70cm)' },
            { id: 'HIGH', label: 'High (40-70cm)' }
          ].map((u) => (
            <button
              key={u.id}
              onClick={() => setFilterUrgency(u.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterUrgency === u.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No waterlogging locations found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords or switching filters to view all monitored Delhi segments.
          </p>
          <Button variant="secondary" size="sm" onClick={() => { setSearchQuery(''); setFilterUrgency('ALL'); }}>
            Reset Filters
          </Button>
        </div>
      ) : viewMode === 'CARDS' ? (
        /* 4. CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const isCrit = item.urgency === 'CRITICAL' || item.water_depth_cm >= 70;
            const isSelected = selectedHotspot?.id === item.id;

            return (
              <Card
                key={item.id}
                hover
                onClick={() => onSelectHotspot(item)}
                className={`transition-all ${
                  isSelected ? 'ring-2 ring-blue-500 border-transparent shadow-md' : ''
                }`}
              >
                <div className="p-5 space-y-3">
                  {/* Top: Location & Depth */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            isCrit ? 'bg-red-500' : 'bg-amber-500'
                          }`}
                        />
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {item.location_name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>Report ID: {item.id}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`font-mono text-base font-bold px-2.5 py-0.5 rounded-md border ${
                          isCrit
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {item.water_depth_cm} cm
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  {/* Vehicle Clearance Alert Callout */}
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 flex items-start gap-2 text-xs text-amber-900">
                    <Car className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">
                      {item.clearance_issue}
                    </span>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Card Action Controls */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-medium">Status:</span>
                      <select
                        value={item.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(item.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="PENDING_REVIEW">Pending Review</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DISPATCHED">Dispatched</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      icon={MapPin}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectHotspot(item);
                      }}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      Locate on Map
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* 5. TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Water Depth</th>
                  <th className="px-5 py-3.5">Clearance Advisory</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {item.location_name}
                      <span className="block text-[11px] font-normal text-slate-400 font-mono">
                        {item.id}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-sm font-bold text-red-600">
                      {item.water_depth_cm} cm
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 max-w-xs truncate">
                      {item.clearance_issue}
                    </td>
                    <td className="px-5 py-3.5">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={MapPin}
                        onClick={() => onSelectHotspot(item)}
                      >
                        Locate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
