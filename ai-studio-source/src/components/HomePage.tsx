import React from "react";
import { motion } from "motion/react";
import { 
  Compass, 
  BrainCircuit, 
  AlertTriangle, 
  Search, 
  Radar, 
  Wind, 
  Gauge, 
  MapPin, 
  Layers, 
  ShieldAlert, 
  Anchor, 
  Activity, 
  Radio, 
  FileText, 
  ArrowRight, 
  ShieldCheck, 
  Maximize2,
  PhoneCall,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Droplets,
  Crosshair
} from "lucide-react";
import { LiveCycloneState, GeoLocation, PageId } from "../types";
import { HISTORICAL_ANALOG_STORMS } from "../data/historicalAnalogsData";
import { SCORPIO_PORTS } from "../data/mosdacCollateralData";

interface HomePageProps {
  liveCyclone: LiveCycloneState | null;
  isLoadingLive: boolean;
  onNavigate: (page: PageId) => void;
  onOpenBulletins: () => void;
  onOpenSystemInfo: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  liveCyclone,
  isLoadingLive,
  onNavigate,
  onOpenBulletins,
  onOpenSystemInfo
}) => {
  const isStormActive = Boolean(liveCyclone?.active);
  const stormName = liveCyclone?.cycloneName || "Severe Cyclonic Storm (BOB-04)";
  const maxWind = liveCyclone?.windSpeedKmh || 120;
  const centralPressure = liveCyclone?.centralPressureHpa || 975;
  const stormLat = liveCyclone?.latitude || 15.2;
  const stormLon = liveCyclone?.longitude || 84.1;

  const nearestPortInfo = React.useMemo(() => {
    let closest = SCORPIO_PORTS[0];
    let minDist = 99999;
    SCORPIO_PORTS.forEach((p) => {
      const dLat = p.lat - stormLat;
      const dLon = p.lon - stormLon;
      const dist = Math.sqrt(dLat * dLat + dLon * dLon) * 111;
      if (dist < minDist) {
        minDist = dist;
        closest = p;
      }
    });
    return {
      port: closest,
      distKm: Math.round(minDist)
    };
  }, [stormLat, stormLon]);

  return (
    <div className="space-y-12 font-sans">
      {isStormActive && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/90 via-slate-900 to-amber-950/80 border-2 border-red-500/70 p-4 sm:p-5 shadow-[0_0_30px_rgba(239,68,68,0.25)]"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-mono font-bold text-[10px] tracking-wider uppercase animate-pulse">
                    ACTIVE CYCLONE WARNING
                  </span>
                  <span className="text-xs font-mono font-bold text-red-300">
                    IMD BULLETIN STAGE: SEVERE CYCLONIC STORM
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white font-mono">
                  {stormName}: Sustained Winds {maxWind} km/h, Central Pressure {centralPressure} hPa
                </h3>
                <p className="text-xs text-slate-300 max-w-3xl">
                  Vortex positioned at <strong className="text-white font-mono">{stormLat.toFixed(2)}°N, {stormLon.toFixed(2)}°E</strong> ({nearestPortInfo.distKm} km from {nearestPortInfo.port.name}). Landfall corridor alert active along North Andhra &amp; South Odisha coastal sectors.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button type="button" id="home-alert-view-tracker" onClick={() => onNavigate("tracker")} className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer">
                <Compass className="w-4 h-4" />
                <span>Track in SCORPIO GIS</span>
              </button>
              <button type="button" id="home-alert-view-bulletin" onClick={onOpenBulletins} className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-semibold transition-colors cursor-pointer">
                Read Bulletins
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <section className="relative rounded-3xl overflow-hidden bg-slate-900/90 border border-slate-800 p-6 sm:p-10 lg:p-12 shadow-2xl">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800/70 text-cyan-300 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-bold">ISRO SAC &bull; MOSDAC SCORPIO &bull; IMD RSMC</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">Smart India Hackathon</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
              Cyclone Intelligence &amp; Early Warning Portal
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl">
            A real-time meteorological decision-support system fusing INSAT-3DR/3DS geostationary multi-spectral radiometry, deep learning vortex center localization, automated Dvorak classification, and the official ISRO Space Applications Centre SCORPIO GIS collateral decision matrix.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button type="button" id="hero-launch-scorpio-btn" onClick={() => onNavigate("tracker")} className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs sm:text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 cursor-pointer group">
              <Compass className="w-4 h-4 text-slate-950 group-hover:rotate-45 transition-transform" />
              <span>Launch Live SCORPIO GIS Tracker</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
            <button type="button" id="hero-launch-satellite-btn" onClick={() => onNavigate("satellite")} className="px-5 py-3 rounded-xl bg-slate-950/90 hover:bg-slate-800 text-slate-100 border border-slate-700 hover:border-indigo-400 font-mono font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              <span>AI Satellite Ingestion Lab</span>
            </button>
            <button type="button" id="hero-view-alerts-btn" onClick={() => onNavigate("alerts")} className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 hover:border-amber-400 font-mono text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Port Signals &amp; Alerts</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between"><span>ACTIVE SYSTEM</span><Activity className="w-3.5 h-3.5 text-red-400" /></div>
              <div className="text-base font-bold font-mono text-white mt-1 truncate">{stormName}</div>
              <div className="text-[11px] text-cyan-400 font-mono">Bay of Bengal (BOB)</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between"><span>MAX SUSTAINED WINDS</span><Wind className="w-3.5 h-3.5 text-amber-400" /></div>
              <div className="text-base font-bold font-mono text-amber-300 mt-1">{maxWind} km/h</div>
              <div className="text-[11px] text-slate-400 font-mono">{Math.round(maxWind / 1.852)} Knots &bull; Gusts {maxWind + 20}k</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between"><span>CENTRAL PRESSURE</span><Gauge className="w-3.5 h-3.5 text-cyan-400" /></div>
              <div className="text-base font-bold font-mono text-cyan-300 mt-1">{centralPressure} hPa</div>
              <div className="text-[11px] text-slate-400 font-mono">Core intensity indicator</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between"><span>STORM POSITION</span><MapPin className="w-3.5 h-3.5 text-indigo-400" /></div>
              <div className="text-base font-bold font-mono text-white mt-1">{stormLat.toFixed(2)}°N</div>
              <div className="text-[11px] text-slate-400 font-mono">{stormLon.toFixed(2)}°E</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 hover:border-cyan-500/50 transition-all flex flex-col justify-between">
          <div className="space-y-2"><div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-400"><Crosshair className="w-5 h-5" /></div><h3 className="text-lg font-bold text-white font-mono">Interactive SCORPIO Point Probe &amp; Bathymetry</h3><p className="text-xs text-slate-300 leading-relaxed">Click anywhere across the Bay of Bengal and Arabian Sea basins to probe ocean depths, sea surface temperatures, distance to eye, local wind gust models, and potential storm surge heights.</p></div>
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between"><span className="text-xs font-mono text-slate-400">Black Marble &bull; Bathymetry DEM</span><button type="button" onClick={() => onNavigate("tracker")} className="text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"><span>Explore SCORPIO GIS</span><ArrowRight className="w-3.5 h-3.5" /></button></div>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 hover:border-indigo-500/50 transition-all flex flex-col justify-between">
          <div className="space-y-2"><div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-700 flex items-center justify-center text-indigo-400"><BrainCircuit className="w-5 h-5" /></div><h3 className="text-lg font-bold text-white font-mono">Multi-Spectral Radiometric Calibrator</h3><p className="text-xs text-slate-300 leading-relaxed">Drop raw INSAT-3D/3DR imagery for automatic lookup table (LUT) calibration. Visualize calibrated brightness temperature contours down to -80°C deep convective core tops.</p></div>
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between"><span className="text-xs font-mono text-slate-400">Thermal IR-1 &bull; Water Vapor &bull; Cloud-Top BT</span><button type="button" onClick={() => onNavigate("satellite")} className="text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"><span>Launch AI Lab</span><ArrowRight className="w-3.5 h-3.5" /></button></div>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 hover:border-amber-500/50 transition-all flex flex-col justify-between">
          <div className="space-y-2"><div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-700 flex items-center justify-center text-amber-400"><Anchor className="w-5 h-5" /></div><h3 className="text-lg font-bold text-white font-mono">Maritime Port Warnings &amp; Signal Protocols</h3><p className="text-xs text-slate-300 leading-relaxed">Full directory of Indian Meteorological Department port warning signals (1 to 11), with hoisted flags, night signal light combinations, and harbor berthing guidelines.</p></div>
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between"><span className="text-xs font-mono text-slate-400">12 Major Ports &bull; Visual Flags</span><button type="button" onClick={() => onNavigate("alerts")} className="text-xs font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"><span>View Port Signals</span><ArrowRight className="w-3.5 h-3.5" /></button></div>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 hover:border-rose-500/50 transition-all flex flex-col justify-between">
          <div className="space-y-2"><div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-700 flex items-center justify-center text-rose-400"><Search className="w-5 h-5" /></div><h3 className="text-lg font-bold text-white font-mono">North Indian Ocean Historical Database</h3><p className="text-xs text-slate-300 leading-relaxed">Evaluate analog storms (Hudhud 2014, Fani 2019, Amphan 2020, Titli 2018). Compare past landfall points, storm surge observations, and casualty mitigation outcomes.</p></div>
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between"><span className="text-xs font-mono text-slate-400">Historical Tracks &bull; Damage Metrics</span><button type="button" onClick={() => onNavigate("search")} className="text-xs font-mono font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"><span>Search Archives</span><ArrowRight className="w-3.5 h-3.5" /></button></div>
        </div>
      </section>

      <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3"><div><h3 className="text-base font-bold text-white font-mono flex items-center gap-2"><span className="text-amber-400">★</span><span>Historical Benchmark Cyclones (Bay of Bengal)</span></h3><p className="text-xs text-slate-400">Analog tracks calibrated against IMD Best Track data for scenario forecasting.</p></div><button type="button" onClick={() => onNavigate("search")} className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"><span>View All Historical Storms</span><ChevronRight className="w-3.5 h-3.5" /></button></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{HISTORICAL_ANALOG_STORMS.slice(0, 4).map((storm) => (<div key={storm.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"><div className="flex items-center justify-between"><span className="font-mono font-bold text-sm text-white">{storm.name}</span><span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300">{storm.year}</span></div><div className="text-[11px] text-slate-400 font-mono">Category: <strong className="text-slate-200">{storm.category}</strong></div><div className="text-xs text-slate-300 font-mono">Peak Winds: <strong className="text-amber-400">{storm.peakWindKmh} km/h</strong></div><div className="text-[11px] text-slate-400 font-mono">Landfall: <span className="text-slate-300">{storm.landfallLocation}</span></div></div>))}</div>
      </section>

      <section className="rounded-2xl bg-gradient-to-br from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-900/60 p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6"><div className="space-y-2 max-w-2xl text-center lg:text-left"><h3 className="text-xl sm:text-2xl font-bold text-white font-mono">State Disaster Management Authority (SDMA) Readiness</h3><p className="text-xs sm:text-sm text-slate-300">For emergency coordination, harbor shelter clearance, and evacuation lifeline assistance along the East Coast, contact regional emergency operation centers immediately.</p></div><div className="flex flex-wrap items-center justify-center gap-3"><div className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono"><span className="text-[10px] text-slate-400 block">NDRF CONTROL ROOM</span><span className="text-base font-bold text-red-400">1078</span></div><div className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono"><span className="text-[10px] text-slate-400 block">AP / ODISHA / WB</span><span className="text-base font-bold text-cyan-300">1070</span></div><button type="button" onClick={onOpenSystemInfo} className="px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"><span>System Architecture Guidelines</span><ArrowRight className="w-4 h-4" /></button></div></section>
    </div>
  );
};
