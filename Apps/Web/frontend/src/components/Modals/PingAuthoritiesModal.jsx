import React, { useState } from 'react';
import { Radio, X, Send, CheckCircle2, Clock, AlertTriangle, Shield, Phone, Mail } from 'lucide-react';
import axios from 'axios';

export default function PingAuthoritiesModal({ isOpen, onClose, authorities, onPingSent }) {
  const [selectedAuth, setSelectedAuth] = useState(null);
  const [priority, setPriority] = useState('HIGH');
  const [instructions, setInstructions] = useState('High flood threat detected. Immediate field dispatch requested to designated sectors.');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSendPing = async (authId) => {
    setIsSending(true);
    try {
      await axios.post(`/api/pings/${authId}`, {
        priority,
        instructions
      });
      if (onPingSent) onPingSent();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const handleSimulateAck = async (authId) => {
    try {
      await axios.post(`/api/pings/${authId}/ack`);
      if (onPingSent) onPingSent();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-command-card border border-command-border rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-command-border bg-command-bg/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                Inter-Agency Authority Direct Dispatch
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-red-500/20 text-red-300 border border-red-500/40">
                  CRITICAL HOTLINE
                </span>
              </h2>
              <p className="text-xs text-slate-400">Directly ping and mobilize NDRF, Municipal, Police, and Fire units</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto custom-scrollbar space-y-4 flex-1">
          {/* Dispatch Message Config */}
          <div className="bg-command-bg/80 border border-command-border p-3 rounded-lg space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">Ping Priority Level:</span>
              <div className="flex items-center gap-2">
                {['CRITICAL', 'HIGH', 'STANDARD'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`px-2.5 py-1 rounded font-mono font-bold text-[10px] transition ${
                      priority === p
                        ? p === 'CRITICAL' ? 'bg-red-500 text-white' : p === 'HIGH' ? 'bg-amber-500 text-black' : 'bg-cyan-500 text-black'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-slate-400">Emergency Dispatch Instructions:</label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full bg-command-card border border-command-border rounded p-2 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Department Unit Cards */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-slate-300 block">Active Response Agencies ({authorities?.length || 0}):</span>
            
            {authorities?.map((auth) => {
              const lastPing = auth.last_ping;
              const hasActivePing = lastPing && !lastPing.acknowledged;
              const isAcked = lastPing && lastPing.acknowledged;

              return (
                <div
                  key={auth.id}
                  className="bg-command-bg/70 border border-command-border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                        {auth.department}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                          {auth.readiness}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Unit: <b className="text-slate-200">{auth.unit}</b> | In Charge: <b className="text-slate-200">{auth.head}</b>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-1 font-mono">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-cyan-400" /> {auth.phone}</span>
                        {auth.personnel_deployed && (
                          <span className="text-emerald-400 font-bold">{auth.personnel_deployed} Personnel Mobilized</span>
                        )}
                      </div>
                    </div>

                    {/* Dispatch Ping Action */}
                    <div className="flex flex-col items-end gap-1.5">
                      <button
                        onClick={() => handleSendPing(auth.id)}
                        disabled={isSending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 transition shadow-[0_0_8px_rgba(239,68,68,0.2)] disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Direct Ping</span>
                      </button>

                      {hasActivePing && (
                        <button
                          onClick={() => handleSimulateAck(auth.id)}
                          className="px-2 py-0.5 text-[10px] font-semibold rounded bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 transition"
                        >
                          Simulate Agency Ack
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Active Ping Status Banner */}
                  {lastPing && (
                    <div className={`p-2 rounded text-xs flex items-center justify-between ${
                      isAcked
                        ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-200'
                        : 'bg-amber-950/50 border border-amber-500/40 text-amber-200 animate-pulse'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        {isAcked ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Clock className="w-3.5 h-3.5 text-amber-400" />}
                        <span>Status: <b>{isAcked ? 'ACKNOWLEDGED - EN ROUTE' : 'PINGED - AWAITING CONFIRMATION'}</b></span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(lastPing.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-command-border bg-command-bg/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Direct encrypted inter-agency radio relay channel</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
