import React, { useState } from 'react';
import {
  Waves,
  PhoneCall,
  PlusCircle,
  Menu,
  X,
  MapPin,
  Gauge,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import Button from '../Common/Button';

export default function Navbar({
  activeTab,
  onSelectTab,
  onOpenReportModal,
  criticalCount = 0
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'MAP', label: 'Live Flood Map', icon: MapPin },
    { id: 'HOTSPOTS', label: 'Flooded Locations', icon: AlertTriangle, count: criticalCount },
    { id: 'DRAINAGE', label: 'Drainage Pumps', icon: Gauge },
    { id: 'ADVISORY', label: 'Emergency Advisories', icon: ShieldCheck }
  ];

  const handleLinkClick = (id) => {
    onSelectTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 1. Left: Brand Logo & Authority Label */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  Flood &amp; Furious
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  NCT of Delhi
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Flood Command, Drainage SCADA &amp; Citizen Safety Desk
              </p>
            </div>
          </div>

          {/* 2. Center: Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                  {link.count > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                      {link.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* 3. Right: Primary Action & Helpline */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="tel:1077"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition shadow-sm"
              title="Delhi Disaster Authority Helpline"
            >
              <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
              <span>Control: 1077</span>
            </a>

            <Button
              variant="primary"
              size="sm"
              icon={PlusCircle}
              onClick={onOpenReportModal}
            >
              Report Waterlogging
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenReportModal}
              className="px-2.5 py-1 text-xs"
            >
              Report
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </div>
                {link.count > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                    {link.count} Critical
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <a
              href="tel:1077"
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold"
            >
              <PhoneCall className="w-4 h-4 text-blue-600" />
              <span>Call Disaster Helpline (1077)</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
