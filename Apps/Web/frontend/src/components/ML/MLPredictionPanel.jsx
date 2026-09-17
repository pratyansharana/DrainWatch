import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Activity, AlertTriangle, ArrowUpRight, CheckCircle2, RotateCw } from 'lucide-react';
import axios from 'axios';

export default function MLPredictionPanel({ predictionData, onPredictionTriggered }) {
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [rainfallMultiplier, setRainfallMultiplier] = useState(1.0);
  const [isSimulating, setIsSimulating] = useState(false);

  // 5-minute countdown clock
  useEffect(() => {
    if (predictionData?.nextPredictionInSeconds) {
      setSecondsLeft(predictionData.nextPredictionInSeconds);
    }
    const interval = setInterval(() => {
      setSecondsLeft(prev => (prev <= 1 ? 300 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [predictionData]);

  const handleRunPrediction = async () => {
    setIsSimulating(true);
    try {
      await axios.post('/api/ml/run-prediction');
      if (onPredictionTriggered) onPredictionTriggered();
      setSecondsLeft(300);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsSimulating(false), 600);
    }
  };

  const handleMultiplierChange = async (val) => {
    setRainfallMultiplier(val);
    try {
      await axios.post('/api/ml/set-rainfall-multiplier', { multiplier: Number(val) });
      if (onPredictionTriggered) onPredictionTriggered();
      setSecondsLeft(300);
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const predictions = predictionData?.predictions || [];

  return (
    <div className="bg-command-card border border-command-border rounded-xl p-4 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-command-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              Real-Time ML Inundation Predictor
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                5-Min Loop
              </span>
            </h3>
            <span className="text-xs text-slate-400">Rational Runoff + Topographic Elevation Model</span>
          </div>
        </div>

        {/* 5-Min Countdown badge */}
        <div className="flex items-center gap-2">
          <div className="bg-command-bg border border-command-border px-3 py-1.5 rounded-lg text-xs font-mono">
            <span className="text-slate-400">Next Model Sync: </span>
            <span className="text-cyan-400 font-bold">{formatTime(secondsLeft)}</span>
          </div>
          <button
            onClick={handleRunPrediction}
            disabled={isSimulating}
            className="p-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-500/30 transition disabled:opacity-50"
            title="Recalculate 5-min prediction now"
          >
            <RotateCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Cloudburst Simulation Slider */}
      <div className="bg-command-bg/80 border border-command-border/60 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-semibold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            Rainfall Stress Simulator (Operator Override):
          </span>
          <span className="font-mono text-cyan-300 font-bold">
            {rainfallMultiplier}x ({Math.round(48.5 * rainfallMultiplier)} mm/h)
          </span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2.5"
          step="0.1"
          value={rainfallMultiplier}
          onChange={(e) => handleMultiplierChange(e.target.value)}
          className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>0.5x (Light)</span>
          <span>1.0x (Current Monsoon)</span>
          <span>1.8x (Cloudburst Warning)</span>
          <span>2.5x (Catastrophic)</span>
        </div>
      </div>

      {/* Sector Predictions List */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>Sector Inundation Forecast (Next 30 Mins)</span>
          <span className="text-[11px] text-slate-500 font-mono">Avg Model Confidence: 94.4%</span>
        </div>

        <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
          {predictions.map((p) => {
            const isCritical = p.risk_level === 'CRITICAL';
            const isHigh = p.risk_level === 'HIGH';
            return (
              <div
                key={p.segment_id}
                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition ${
                  isCritical
                    ? 'bg-red-950/40 border-red-500/50 text-red-200'
                    : isHigh
                    ? 'bg-orange-950/30 border-orange-500/40 text-orange-200'
                    : 'bg-command-bg/50 border-command-border/60 text-slate-300'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-bold flex items-center gap-2 text-slate-100">
                    {p.segment_name}
                    {p.evacuation_recommended && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-600 text-white uppercase animate-pulse">
                        Evacuate
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-3">
                    <span>Drainage Stress: <b className="text-slate-200">{p.drainage_stress_pct}%</b></span>
                    <span>Confidence: <b className="text-indigo-400">{p.confidence}</b></span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-sm font-bold flex items-center justify-end gap-1">
                    <span className="text-slate-400 text-xs">{p.current_water_level_cm}cm</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                    <span className={isCritical ? 'text-red-400 font-extrabold' : isHigh ? 'text-orange-400' : 'text-cyan-300'}>
                      {p.predicted_30min_level_cm}cm
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${
                    isCritical ? 'text-red-400' : isHigh ? 'text-orange-400' : 'text-emerald-400'
                  }`}>
                    {p.risk_level}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
