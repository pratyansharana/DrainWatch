import React from 'react';
import { Waves, Phone, ShieldCheck, HeartHandshake } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-200">
          {/* Brand & Authority Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Waves className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-slate-900">
                Flood &amp; Furious — Delhi Flood Command
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              An initiative under the National Capital Territory of Delhi Disaster Management Authority (DDMA),
              Irrigation &amp; Flood Control Department (I&amp;FC), and Delhi Traffic Police for real-time flood monitoring,
              drainage SCADA control, and citizen safety advisories.
            </p>
          </div>

          {/* Emergency Helplines */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Emergency Control Helplines
            </h4>
            <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-600">
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Central Flood Desk</span>
                <span className="font-mono font-bold text-blue-600">1077</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Delhi Police HQ</span>
                <span className="font-mono font-bold text-slate-900">112</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Traffic Diversions</span>
                <span className="font-mono font-bold text-slate-900">1095</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Delhi Fire Service</span>
                <span className="font-mono font-bold text-slate-900">101</span>
              </div>
            </div>
          </div>

          {/* Quick Technical Summary */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Platform &amp; Data Standards
            </h4>
            <ul className="text-xs text-slate-500 space-y-1.5">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>High-Resolution GIS Inundation Radar &amp; Vector Layers</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Automated 15-minute rainfall updates (IMD Safdarjung)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>SCADA integration with DJB & PWD dewatering sumps</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Government of NCT of Delhi. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-600 transition cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-600 transition cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-slate-600 transition cursor-pointer">Disaster SOP</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
