import React, { useState } from 'react';
import {
  PhoneCall,
  Radio,
  Send,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Clock
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../Common/Card';
import Badge from '../Common/Badge';
import Button from '../Common/Button';

export default function AdvisorySection({
  authorities = [],
  alerts = [],
  onPingAuthority,
  onBroadcastAlert
}) {
  const [pingingId, setPingingId] = useState(null);
  const [pingSuccessId, setPingSuccessId] = useState(null);

  // Broadcast composer
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [severity, setSeverity] = useState('CRITICAL');
  const [channels, setChannels] = useState(['APP_PUSH', 'TRAFFIC_VMS']);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const toggleChannel = (ch) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handlePing = async (auth) => {
    try {
      setPingingId(auth.id);
      await onPingAuthority(auth.id);
      setPingSuccessId(auth.id);
      setTimeout(() => setPingSuccessId(null), 2500);
    } catch (err) {
      console.error('Failed to ping authority:', err);
    } finally {
      setPingingId(null);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return;

    try {
      setBroadcasting(true);
      await onBroadcastAlert({
        title: broadcastTitle.trim(),
        message: broadcastMsg.trim(),
        severity: severity,
        channels: channels
      });

      setBroadcastSuccess(true);
      setBroadcastTitle('');
      setBroadcastMsg('');
      setTimeout(() => setBroadcastSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to broadcast alert:', err);
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Section Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Emergency Advisories & Inter-Agency Coordination</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            High Alert Status
          </span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Multi-channel public warning broadcasts and direct encrypted dispatch hotlines across Delhi emergency units.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Inter-Agency Hotline Directory */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4 text-blue-600" />
            <span>Designated Flood Authority Hotlines</span>
          </h3>

          <div className="space-y-3">
            {authorities.map((auth) => {
              const isPinged = pingSuccessId === auth.id;

              return (
                <Card key={auth.id}>
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">
                          {auth.department}
                        </h4>
                        <Badge variant="neutral" size="sm">
                          {auth.readiness}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">{auth.unit}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span>Tel: {auth.phone}</span>
                        {auth.boats_ready && <span>• {auth.boats_ready} Rescue Boats</span>}
                        {auth.personnel_deployed && (
                          <span>• {auth.personnel_deployed} Personnel</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`tel:${auth.phone}`}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
                      >
                        Call Hotline
                      </a>
                      <Button
                        variant={isPinged ? 'secondary' : 'primary'}
                        size="sm"
                        loading={pingingId === auth.id}
                        onClick={() => handlePing(auth)}
                      >
                        {isPinged ? 'Dispatched' : 'Dispatch Ping'}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Public Alert Composer & Active Warnings */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-red-600" />
            <span>Broadcast Emergency Advisory</span>
          </h3>

          <Card>
            <form onSubmit={handleBroadcast} className="p-5 space-y-3.5">
              {broadcastSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Advisory transmitted to citizens and traffic displays!</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Advisory Severity
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="CRITICAL">CRITICAL FLOOD EVACUATION</option>
                  <option value="WARNING">TRAFFIC DIVERSION WARNING</option>
                  <option value="INFO">GENERAL ADVISORY</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Yamuna Hathnikund Surge: Avoid Ring Road"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Public Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="State closed underpasses, diversion corridors, and evacuation points..."
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
                  required
                />
              </div>

              {/* Channels */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  Target Channels
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'APP_PUSH', label: 'Citizen App Push' },
                    { id: 'TRAFFIC_VMS', label: 'Roadside VMS' },
                    { id: 'SMS', label: 'Emergency SMS' },
                    { id: 'SIRENS', label: 'Public Sirens' }
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleChannel(ch.id)}
                      className={`p-2 rounded-lg text-xs font-semibold text-left border transition flex items-center justify-between ${
                        channels.includes(ch.id)
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      <span>{ch.label}</span>
                      <span className="text-[10px]">{channels.includes(ch.id) ? '✓' : '+'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="danger"
                size="md"
                type="submit"
                loading={broadcasting}
                icon={Radio}
                className="w-full mt-2"
              >
                Transmit Public Broadcast
              </Button>
            </form>
          </Card>

          {/* Active Alerts Feed */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Broadcasts in Circulation
            </h4>
            <div className="space-y-2">
              {alerts.map((alt) => (
                <div
                  key={alt.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={alt.severity === 'CRITICAL' ? 'critical' : 'warning'} size="sm">
                      {alt.severity}
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {alt.id}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-900">{alt.title}</h5>
                  <p className="text-xs text-slate-600 leading-relaxed">{alt.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
