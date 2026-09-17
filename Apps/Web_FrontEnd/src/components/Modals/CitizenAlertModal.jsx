import React, { useState } from 'react';
import { Megaphone, X, Send, AlertTriangle, Smartphone, BellRing, Monitor, Radio, History } from 'lucide-react';
import axios from 'axios';

const TEMPLATES = [
  {
    title: 'CRITICAL FLOOD ADVISORY: Yamuna Inundation & Kashmere Gate / ISBT',
    severity: 'CRITICAL',
    message: 'Yamuna river water level has breached 208.4m at Old Railway Bridge (Loha Pul). Kashmere Gate ISBT, Monastery Market, and Ring Road are flooded. Evacuate low-lying riverbed settlements immediately.'
  },
  {
    title: 'TRAFFIC DIVERSION: Minto Bridge & ITO Junction Submerged',
    severity: 'WARNING',
    message: 'Minto Bridge underpass water depth is at 75cm. DTC buses and light vehicles are diverted via Barakhamba Road and Ranjit Singh Flyover. Avoid Ring Road near Vikas Minar.'
  },
  {
    title: 'PUBLIC EVACUATION NOTICE: Mayur Vihar Khadar & Bela Road',
    severity: 'CRITICAL',
    message: 'CWC & DDMA declare Level 3 Emergency Evacuation for Yamuna Floodplain Khadar colonies. NDRF 8th Bn relief boats mobilized. Relocate to designated Delhi Govt flood relief camps.'
  }
];

export default function CitizenAlertModal({ isOpen, onClose, alerts, onAlertBroadcasted }) {
  const [title, setTitle] = useState(TEMPLATES[0].title);
  const [severity, setSeverity] = useState(TEMPLATES[0].severity);
  const [message, setMessage] = useState(TEMPLATES[0].message);
  const [channels, setChannels] = useState(['CITIZEN_APP_PUSH', 'SMS_BROADCAST', 'TRAFFIC_VMS']);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  if (!isOpen) return null;

  const toggleChannel = (ch) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const handleApplyTemplate = (tmpl) => {
    setTitle(tmpl.title);
    setSeverity(tmpl.severity);
    setMessage(tmpl.message);
  };

  const handleBroadcast = async () => {
    if (!title || !message) return;
    setIsBroadcasting(true);
    try {
      await axios.post('/api/alerts/broadcast', {
        title,
        severity,
        message,
        channels,
        sent_by: 'Disaster Authority Central Command Room'
      });
      if (onAlertBroadcasted) onAlertBroadcasted();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-command-card border border-command-border rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-command-border bg-command-bg/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
              <Megaphone className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                Emergency Citizen Alert Broadcaster
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-red-500/20 text-red-300 border border-red-500/40">
                  PUBLIC SAFETY
                </span>
              </h2>
              <p className="text-xs text-slate-400">Dispatch instant multi-channel push warnings to citizen mobile app & SMS</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto custom-scrollbar space-y-4 flex-1">
          {/* Quick Preset Templates */}
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400 font-semibold">Pre-Approved Emergency Templates:</span>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  {tmpl.title.split(':')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="space-y-3 bg-command-bg/70 p-3.5 rounded-lg border border-command-border">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-slate-400">Alert Title / Headline:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-command-card border border-command-border rounded p-2 text-xs font-semibold text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Severity Tier:</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="bg-command-card border border-command-border rounded p-2 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="CRITICAL">CRITICAL (RED)</option>
                  <option value="WARNING">WARNING (AMBER)</option>
                  <option value="ADVISORY">ADVISORY (CYAN)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Broadcast Message Body (Delivered to Citizens):</label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-command-card border border-command-border rounded p-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Broadcast Channels */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs text-slate-400 font-semibold block">Dissemination Channels:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'CITIZEN_APP_PUSH', label: 'Citizen App Push', icon: Smartphone },
                  { id: 'SMS_BROADCAST', label: 'Emergency SMS', icon: BellRing },
                  { id: 'TRAFFIC_VMS', label: 'Roadside VMS Displays', icon: Monitor },
                  { id: 'SIREN_RELAY', label: 'Siren & Audio Relay', icon: Radio }
                ].map(ch => {
                  const Icon = ch.icon;
                  const isChecked = channels.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleChannel(ch.id)}
                      className={`p-2 rounded border text-left text-xs flex items-center gap-2 transition ${
                        isChecked
                          ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200'
                          : 'bg-command-card/50 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="font-semibold text-[11px] truncate">{ch.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Broadcast History */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-400" /> Recent Broadcast Log:
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
              {alerts?.map(a => (
                <div key={a.id} className="p-2 rounded bg-command-bg/50 border border-command-border/60 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-200">{a.title}</div>
                    <div className="text-[10px] text-slate-400">{a.message.slice(0, 70)}...</div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(a.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-command-border bg-command-bg/80 flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition">
            Cancel
          </button>
          <button
            onClick={handleBroadcast}
            disabled={isBroadcasting}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.35)] transition disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {isBroadcasting ? 'Broadcasting Alert...' : 'Authorize & Broadcast Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
