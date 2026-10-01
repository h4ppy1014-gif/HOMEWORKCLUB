import React from 'react';
import { Volume2, VolumeX, ShieldAlert, Code2, Plus } from 'lucide-react';

export const Header = ({
  activeNav = 'all',
  setActiveNav,
  soundEnabled = true,
  setSoundEnabled,
  onTriggerPanic,
  onOpenJsonModal,
  onOpenAddModal,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark in display face */}
        <button
          onClick={() => setActiveNav('all')}
          className="text-lg font-black tracking-tight text-white hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-2"
        >
          <span className="font-['Press_Start_2P'] text-xs text-emerald-400">⚡</span>
          <span className="tracking-tighter">UNBLOCK<span className="text-emerald-400">ZONE</span></span>
        </button>

        {/* Zone 2: 4-6 clean text navigation links (single-line) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveNav('all')}
            className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap ${
              activeNav === 'all' ? 'text-emerald-400 border-b-2 border-emerald-400 py-1' : ''
            }`}
          >
            All Games
          </button>
          <button
            onClick={() => setActiveNav('popular')}
            className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap ${
              activeNav === 'popular' ? 'text-emerald-400 border-b-2 border-emerald-400 py-1' : ''
            }`}
          >
            Popular
          </button>
          <button
            onClick={() => setActiveNav('favorites')}
            className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap ${
              activeNav === 'favorites' ? 'text-emerald-400 border-b-2 border-emerald-400 py-1' : ''
            }`}
          >
            Favorites
          </button>
          <button
            onClick={onOpenAddModal}
            className="hover:text-white transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            Add Game
          </button>
          <button
            onClick={onOpenJsonModal}
            className="hover:text-white transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 text-slate-400"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            JSON Catalog
          </button>
        </nav>

        {/* Zone 3: Primary actions (Sound Toggle & Panic Cloak) */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute Game Sounds' : 'Unmute Game Sounds'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={onTriggerPanic}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600/90 hover:bg-red-600 active:scale-95 rounded-lg border border-red-500/30 transition-all cursor-pointer shadow-xs whitespace-nowrap"
            title="Instant Tab Cloak (Panic Key: ESC or ~)"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Panic Cloak</span>
          </button>
        </div>
      </div>
    </header>
  );
};
