import React, { useState } from 'react';
import { Key, ShieldCheck, ExternalLink, X } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose, currentKey, onSaveKey }) {
  const [apiKey, setApiKey] = useState(currentKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveKey(apiKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  const handleClear = () => {
    setApiKey('');
    onSaveKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#0D1424] border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#121B30]">
          <div className="flex items-center gap-2.5 text-slate-100 font-semibold text-base">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Key className="w-4 h-4" />
            </div>
            <span>Google Maps API Configuration</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Enter your Google Maps JavaScript API key to activate high-resolution Google satellite imagery, real-time traffic layers, and vector controls.
          </p>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold tracking-wider text-slate-300 uppercase">
              Google Maps API Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-[#080C16] border border-slate-700 focus:border-cyan-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>
          </div>

          <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 p-3 text-[11px] text-slate-400 space-y-2">
            <div className="flex items-start gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Keys are saved locally in your browser and never transmitted to untrusted servers.</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition cursor-pointer">
              <ExternalLink className="w-3.5 h-3.5" />
              <a
                href="https://console.cloud.google.com/google/maps-apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                Get a Google Maps API Key in Google Cloud Console
              </a>
            </div>
          </div>

          {savedSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>API Key saved successfully! Reloading map...</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-slate-400 hover:text-rose-400 transition"
            >
              Clear Key (Use Fallback)
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
