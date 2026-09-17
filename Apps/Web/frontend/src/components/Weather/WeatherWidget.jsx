import React, { useState } from 'react';
import { CloudRain, Wind, Gauge, Droplets, Clock, AlertOctagon, RefreshCw, Zap } from 'lucide-react';
import axios from 'axios';

export default function WeatherWidget({ weatherData, onRefresh }) {
  const [checkingNow, setCheckingNow] = useState(false);

  if (!weatherData) return null;

  const trigger15MinCheck = async () => {
    setCheckingNow(true);
    try {
      await axios.post('/api/weather/check-now');
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setCheckingNow(false), 800);
    }
  };

  const isStormSevere = weatherData.precipitation_rate_mm_hr > 40;

  return (
    <div className="bg-command-card border border-command-border rounded-xl p-4 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-command-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${isStormSevere ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}`}>
            <CloudRain className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              Live Weather & Precipitation Telemetry
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isStormSevere ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {weatherData.storm_alert_level}
              </span>
            </h3>
            <span className="text-xs text-slate-400">{weatherData.station}</span>
          </div>
        </div>

        {/* 15-Min Check Trigger */}
        <button
          onClick={trigger15MinCheck}
          disabled={checkingNow}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 hover:text-white transition shadow-[0_0_10px_rgba(0,229,255,0.15)] disabled:opacity-50"
          title="Manual trigger of 15-minute rainfall verification check"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checkingNow ? 'animate-spin' : ''}`} />
          <span>15-Min Check</span>
        </button>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-command-bg/80 border border-command-border/60 rounded-lg p-3">
          <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
            <CloudRain className="w-3.5 h-3.5 text-cyan-400" /> Current Rainfall
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            {weatherData.precipitation_rate_mm_hr} <span className="text-xs font-normal text-slate-400">mm/h</span>
          </div>
          <span className="text-[10px] text-amber-400 block mt-1">Monsoon Squall</span>
        </div>

        <div className="bg-command-bg/80 border border-command-border/60 rounded-lg p-3">
          <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
            <Wind className="w-3.5 h-3.5 text-slate-300" /> Wind Speed
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {weatherData.wind_speed_kmh} <span className="text-xs font-normal text-slate-400">km/h</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Direction: {weatherData.wind_direction}</span>
        </div>

        <div className="bg-command-bg/80 border border-command-border/60 rounded-lg p-3">
          <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
            <Gauge className="w-3.5 h-3.5 text-slate-300" /> Barometer
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {weatherData.barometric_pressure_hpa} <span className="text-xs font-normal text-slate-400">hPa</span>
          </div>
          <span className="text-[10px] text-red-400 block mt-1">Low pressure trough</span>
        </div>

        <div className="bg-command-bg/80 border border-command-border/60 rounded-lg p-3">
          <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
            <Droplets className="w-3.5 h-3.5 text-blue-400" /> Humidity
          </div>
          <div className="text-2xl font-bold font-mono text-blue-300">
            {weatherData.humidity_pct}%
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Temp: {weatherData.temperature_c}°C</span>
        </div>
      </div>

      {/* Hourly Rainfall Projection Forecast */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" /> 6-Hour Precipitation Radar Projection
          </span>
          <span className="text-[11px] text-slate-500 font-mono">W API Sync: Active</span>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {weatherData.hourlyForecast?.map((item, idx) => (
            <div key={idx} className="bg-command-bg/60 border border-slate-800 rounded-lg p-2 text-center">
              <div className="text-[10px] font-mono text-slate-400">{item.hour}</div>
              <div className="my-1 text-sm font-bold font-mono text-cyan-300">
                {item.rainfall_mm} <span className="text-[9px] font-normal text-slate-400">mm</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.rainfall_mm > 45 ? 'bg-red-500' : item.rainfall_mm > 25 ? 'bg-amber-400' : 'bg-cyan-400'}`}
                  style={{ width: `${Math.min(100, (item.rainfall_mm / 60) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
