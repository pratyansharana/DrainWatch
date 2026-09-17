import React, { useState } from 'react';
import {
  PhoneCall,
  Send,
  Radio,
  BellRing,
  CheckCircle2,
  AlertOctagon,
  Shield,
  Smartphone,
  MessageSquare,
  Users
} from 'lucide-react';
import axios from 'axios';

export default function EmergencyDispatchPanel({
  authorities = [],
  alerts = [],
  onAlertBroadcasted,
  onAuthorityPinged
}) {
  const [activeSubTab, setActiveSubTab] = useState('HOTLINE'); // 'HOTLINE' | 'BROADCAST'
  const [pingingId, setPingingId] = useState(null);
  const [pingSuccessId, setPingSuccessId] = useState(null);

  // Broadcast form state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [severity, setSeverity] = useState('CRITICAL');
  const [channels, setChannels] = useState(['CITIZEN_APP_PUSH', 'TRAFFIC_VMS_DISPLAYS']);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState(false);

  const toggleChannel = (ch) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handlePing = async (auth) => {
    try {
      setPingingId(auth.id);
      await axios.post(`/api/pings/authorities/${auth.id}/ping`, {
        reason: 'Urgent flood stage escalation and dewatering deployment'
      });
      setPingSuccessId(auth.id);
      if (onAuthorityPinged) onAuthorityPinged();
      setTimeout(() => setPingSuccessId(null), 2500);
    } catch (err) {
      console.error('Failed to ping authority:', err);
    } finally {
      setPingingId(null);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMsg) return;

    try {
      setBroadcasting(true);
      await axios.post('/api/alerts', {
        title: broadcastTitle,
        severity: severity,
        message: broadcastMsg,
        channels: channels,
        affected_segments: ['delhi-seg-1', 'delhi-seg-2']
      });

      setBroadcastDone(true);
      setBroadcastTitle('');
      setBroadcastMsg('');
      if (onAlertBroadcasted) onAlertBroadcasted();
      setTimeout(() => setBroadcastDone(false), 3000);
    } catch (err) {
      console.error('Failed to send broadcast:', err);
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3 overflow-hidden">
      {/* Sub-tabs for Hotline vs Citizen Alert */}
      <div className="flex items-center gap-1 p-1 bg-[#080C16] rounded-xl border border-slate-800 shrink-0">
        <button
          onClick={() => setActiveSubTab('HOTLINE')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeSubTab === 'HOTLINE'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Inter-Agency Hotlines</span>
        </button>
        <button
          onClick={() => setActiveSubTab('BROADCAST')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeSubTab === 'BROADCAST'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Public Alert Broadcast</span>
        </button>
      </div>

      {/* 1. INTER-AGENCY HOTLINES */}
      {activeSubTab === 'HOTLINE' && (
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          {authorities.map((auth) => {
            const isPinged = pingSuccessId === auth.id;

            return (
              <div
                key={auth.id}
                className="p-3 rounded-xl bg-[#0D1424] border border-slate-800 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 line-clamp-1">
                      {auth.department}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {auth.unit}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold shrink-0">
                    {auth.readiness}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span className="font-mono text-slate-300">{auth.phone}</span>
                  <button
                    onClick={() => handlePing(auth)}
                    disabled={pingingId === auth.id}
                    className={`px-3 py-1 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition ${
                      isPinged
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/10'
                    }`}
                  >
                    {isPinged ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Dispatched</span>
                      </>
                    ) : (
                      <>
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Ping Hotline</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. PUBLIC CITIZEN BROADCAST */}
      {activeSubTab === 'BROADCAST' && (
        <form
          onSubmit={handleBroadcast}
          className="flex-1 flex flex-col justify-between space-y-3 overflow-y-auto pr-1 custom-scrollbar"
        >
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold uppercase text-slate-300 tracking-wider">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="mt-1 w-full bg-[#080C16] border border-slate-700 text-slate-200 text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-rose-500"
              >
                <option value="CRITICAL">CRITICAL EVACUATION</option>
                <option value="HIGH">HIGH FLOOD WARNING</option>
                <option value="WARNING">TRAFFIC DIVERSION ADVISORY</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase text-slate-300 tracking-wider">
                Alert Headline
              </label>
              <input
                type="text"
                placeholder="e.g. Yamuna Breach at Kashmere Gate: Ring Road Closed"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="mt-1 w-full bg-[#080C16] border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase text-slate-300 tracking-wider">
                Public Advisory Instructions
              </label>
              <textarea
                rows={3}
                placeholder="Specify affected underpasses, vehicle diversions, and emergency contacts..."
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                className="mt-1 w-full bg-[#080C16] border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-cyan-500 leading-relaxed resize-none"
                required
              />
            </div>

            {/* Channels Multi-toggle */}
            <div>
              <label className="text-[11px] font-semibold uppercase text-slate-300 tracking-wider">
                Target Broadcast Channels
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {[
                  { id: 'CITIZEN_APP_PUSH', label: 'Citizen Mobile Push' },
                  { id: 'TRAFFIC_VMS_DISPLAYS', label: 'Road VMS Displays' },
                  { id: 'SMS_BROADCAST', label: 'Emergency SMS' },
                  { id: 'PUBLIC_SIRENS', label: 'Public Sirens' }
                ].map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChannel(ch.id)}
                    className={`p-2 rounded-lg text-xs font-semibold text-left border transition flex items-center justify-between ${
                      channels.includes(ch.id)
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-[#080C16] text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>{ch.label}</span>
                    <span className="text-[10px]">
                      {channels.includes(ch.id) ? '✓' : '+'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {broadcastDone && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Alert broadcasted across selected channels!</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={broadcasting}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-2 mt-2"
          >
            <Radio className="w-4 h-4" />
            <span>{broadcasting ? 'Transmitting...' : 'Broadcast Emergency Alert'}</span>
          </button>
        </form>
      )}
    </div>
  );
}
