import React, { useState, useEffect, useMemo, useCallback } from 'react';
import initialGames from './data/games.json';
import { Header } from './components/Header.jsx';
import { GameCard } from './components/GameCard.jsx';
import { GamePlayer } from './components/GamePlayer.jsx';
import { JsonManagerModal } from './components/JsonManagerModal.jsx';
import { AddGameModal } from './components/AddGameModal.jsx';
import { PanicOverlay } from './components/PanicOverlay.jsx';
import { applyCloak } from './utils/cloak.js';
import { playSound } from './utils/audio.js';
import {
  Search,
  Sparkles,
  Gamepad2,
  TrendingUp,
  Heart,
  SlidersHorizontal,
  Flame,
} from 'lucide-react';

const CATEGORIES = ['All', 'Arcade', 'Action', 'Puzzle', 'Retro', 'Sports', 'Strategy'];

export default function App() {
  // Game Library State (Persisted in localStorage with initial games.json fallback)
  const [games, setGames] = useState(() => {
    try {
      const saved = localStorage.getItem('unblockzone_games_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return initialGames;
  });

  // User Preferences
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('unblockzone_favorites') || '[]');
    } catch {
      return [];
    }
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeNav, setActiveNav] = useState('all'); // 'all' | 'popular' | 'favorites'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);

  // Modals & Panic states
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isPanicked, setIsPanicked] = useState(false);

  // Save games to localStorage
  const updateGamesList = useCallback((newGames) => {
    setGames(newGames);
    try {
      localStorage.setItem('unblockzone_games_v3', JSON.stringify(newGames));
    } catch {
      // ignore
    }
  }, []);

  const resetToDefaultGames = useCallback(() => {
    setGames(initialGames);
    localStorage.removeItem('unblockzone_games_v3');
  }, []);

  const handleAddGame = useCallback(
    (newGame) => {
      const updated = [newGame, ...games];
      updateGamesList(updated);
      setSelectedGame(newGame);
    },
    [games, updateGamesList]
  );

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem('unblockzone_favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  // Panic Cloak Trigger
  const triggerPanic = useCallback(() => {
    setIsPanicked((prev) => {
      const next = !prev;
      if (next) {
        applyCloak('google-docs');
      } else {
        applyCloak('none');
      }
      return next;
    });
  }, []);

  // Panic Shortcut Listener (ESC or `~`)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === '`' || e.key === '~') {
        // If modals are open, close them first
        if (showJsonModal || showAddModal) {
          setShowJsonModal(false);
          setShowAddModal(false);
          return;
        }
        triggerPanic();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showJsonModal, showAddModal, triggerPanic]);

  // Filter & Search Games
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      // Search
      const matchesSearch =
        searchQuery === '' ||
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.category?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Category filter
      if (selectedCategory !== 'All' && game.category !== selectedCategory) {
        return false;
      }

      // Nav View
      if (activeNav === 'popular') {
        return game.rating >= 4.8 || game.playsCount > 30000;
      }
      if (activeNav === 'favorites') {
        return favorites.includes(game.id);
      }

      return true;
    });
  }, [games, searchQuery, selectedCategory, activeNav, favorites]);

  // Featured flagship game (Roblox)
  const featuredGame = useMemo(() => {
    return games.find((g) => g.id === 'roblox-unblocked') || games[0];
  }, [games]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Panic Cloak Mode Overlay */}
      {isPanicked && <PanicOverlay onExitPanic={triggerPanic} />}

      {/* Main Top Bar */}
      <Header
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onTriggerPanic={triggerPanic}
        onOpenJsonModal={() => setShowJsonModal(true)}
        onOpenAddModal={() => setShowAddModal(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col">
        {/* Active Game Stage Viewport */}
        {selectedGame && (
          <GamePlayer
            game={selectedGame}
            onClose={() => setSelectedGame(null)}
            soundEnabled={soundEnabled}
            isFavorite={favorites.includes(selectedGame.id)}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {/* Hero Spotlight (When no game is active) */}
        {!selectedGame && activeNav === 'all' && searchQuery === '' && selectedCategory === 'All' && (
          <div className="relative mb-8 rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-900 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400 mb-2">
                <Flame className="w-4 h-4" />
                <span>FEATURED UNBLOCKED SPOTLIGHT</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 text-balance">
                Roblox Blox Obby & Cloud Session
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                Play the full 3D studded parkour obstacle course or launch web cloud gaming sessions unblocked directly inside your browser. No downloads or installations required.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedGame(featuredGame);
                    playSound('click', soundEnabled);
                  }}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>Play Roblox Now</span>
                </button>
                <button
                  onClick={() => setShowJsonModal(true)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  Inspect JSON Data
                </button>
              </div>
            </div>

            {/* Graphic Badge */}
            <div className="hidden md:flex items-center justify-center p-6 bg-slate-950/80 border border-slate-800 rounded-2xl shadow-inner">
              <div className="text-center space-y-1">
                <div className="text-3xl font-black text-red-500 font-mono">100%</div>
                <div className="text-2xs font-mono uppercase text-slate-400 tracking-wider">Unblocked Web</div>
                <div className="text-3xs text-emerald-400">Zero Lag · No AI</div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls & Search Bar */}
        <div className="mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Interactive Category Segmented Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  playSound('click', soundEnabled);
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search unblocked games..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Games Grid Section */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                {activeNav === 'favorites'
                  ? 'Favorite Games'
                  : activeNav === 'popular'
                  ? 'Popular Arcade Hits'
                  : `${selectedCategory} Games`}
              </h2>
              <span className="text-2xs text-slate-500 tabular-nums font-mono">
                ({filteredGames.length})
              </span>
            </div>

            <div className="text-2xs text-slate-500 hidden sm:block">
              Panic Key: <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300 font-mono">ESC</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300 font-mono">~</kbd>
            </div>
          </div>

          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  isFavorite={favorites.includes(game.id)}
                  onToggleFavorite={toggleFavorite}
                  onSelectGame={(g) => {
                    setSelectedGame(g);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    playSound('click', soundEnabled);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/50">
              <Gamepad2 className="w-10 h-10 text-slate-600 mb-3" />
              <p className="text-sm font-bold text-slate-300 mb-1">No Games Found</p>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                No games matched your query. Try clearing the search filter or adding your own game to the JSON catalog!
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setActiveNav('all');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>UnblockZone · Lightweight Unblocked Arcade Hub</span>
          <div className="flex items-center gap-4 text-2xs text-slate-400">
            <button onClick={() => setShowJsonModal(true)} className="hover:text-emerald-400 transition-colors cursor-pointer">
              JSON Database
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => setShowAddModal(true)} className="hover:text-emerald-400 transition-colors cursor-pointer">
              Add Game
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={triggerPanic} className="hover:text-red-400 transition-colors cursor-pointer">
              Disguise Tab
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showJsonModal && (
        <JsonManagerModal
          games={games}
          onUpdateGames={updateGamesList}
          onResetToDefault={resetToDefaultGames}
          onClose={() => setShowJsonModal(false)}
        />
      )}

      {showAddModal && (
        <AddGameModal
          onAddGame={handleAddGame}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
