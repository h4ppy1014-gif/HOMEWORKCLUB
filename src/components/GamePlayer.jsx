import React, { useState, useRef } from 'react';
import {
  Maximize2,
  Minimize2,
  Tv,
  RotateCcw,
  Heart,
  ChevronLeft,
  Keyboard,
  Info,
} from 'lucide-react';

import { SnakeGame } from '../games/SnakeGame.jsx';
import { Game2048 } from '../games/Game2048.jsx';
import { FlappyBirdGame } from '../games/FlappyBirdGame.jsx';
import { BreakoutGame } from '../games/BreakoutGame.jsx';
import { SpaceDefendersGame } from '../games/SpaceDefendersGame.jsx';
import { PongGame } from '../games/PongGame.jsx';
import { DinoRunnerGame } from '../games/DinoRunnerGame.jsx';
import { MinesweeperGame } from '../games/MinesweeperGame.jsx';
import { TetroBlocksGame } from '../games/TetroBlocksGame.jsx';
import { ConnectFourGame } from '../games/ConnectFourGame.jsx';
import { RobloxGame } from '../games/RobloxGame.jsx';
import { IframeSandboxGame } from '../games/IframeSandboxGame.jsx';

export const GamePlayer = ({
  game,
  onClose,
  soundEnabled = true,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const [theaterMode, setTheaterMode] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const playerContainerRef = useRef(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const restartCurrentGame = () => {
    setResetKey((prev) => prev + 1);
  };

  // Render the matching game engine
  const renderEngine = () => {
    if (game.gameType === 'iframe') {
      return (
        <IframeSandboxGame
          key={resetKey}
          embedUrl={game.embedUrl}
          customHtml={game.customHtml}
          title={game.title}
        />
      );
    }

    switch (game.engineId) {
      case 'roblox':
        return <RobloxGame key={resetKey} soundEnabled={soundEnabled} />;
      case 'snake':
        return <SnakeGame key={resetKey} soundEnabled={soundEnabled} />;
      case '2048':
        return <Game2048 key={resetKey} soundEnabled={soundEnabled} />;
      case 'flappy-bird':
        return <FlappyBirdGame key={resetKey} soundEnabled={soundEnabled} />;
      case 'breakout':
        return <BreakoutGame key={resetKey} soundEnabled={soundEnabled} />;
      case 'space-defenders':
        return <SpaceDefendersGame key={resetKey} soundEnabled={soundEnabled} />;
      case 'pong':
        return <PongGame key={resetKey} soundEnabled={soundEnabled} />;
      case 'dino-runner':
        return <DinoRunnerGame key={resetKey} soundEnabled={soundEnabled} />;
      case 'minesweeper':
        return <MinesweeperGame key={resetKey} soundEnabled={soundEnabled} />;
      case 'tetris':
        return <TetroBlocksGame key={resetKey} soundEnabled={soundEnabled} />;
      case 'connect-four':
        return <ConnectFourGame key={resetKey} soundEnabled={soundEnabled} />;
      default:
        return (
          <IframeSandboxGame
            key={resetKey}
            embedUrl={game.embedUrl}
            customHtml={game.customHtml}
            title={game.title}
          />
        );
    }
  };

  return (
    <div className={`w-full ${theaterMode ? 'fixed inset-0 z-50 bg-slate-950 p-4 overflow-y-auto' : 'mb-8'}`}>
      <div
        ref={playerContainerRef}
        className="max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Stage Top Bar */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Library</span>
            </button>

            <div className="hidden sm:block h-4 w-px bg-slate-800" />

            <h2 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
              {game.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(game.id)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-red-400 transition-colors cursor-pointer"
              title={isFavorite ? 'Remove Favorite' : 'Save Favorite'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'text-red-500 fill-red-500' : ''}`} />
            </button>

            <button
              onClick={restartCurrentGame}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Restart Game"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTheaterMode((prev) => !prev)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Toggle Theater Mode"
            >
              <Tv className="w-4 h-4" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Game Stage Area */}
        <div className="relative bg-slate-950 min-h-[440px] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          {renderEngine()}
        </div>

        {/* Stage Bottom Info & Cheatsheet */}
        <div className="bg-slate-900/90 border-t border-slate-800 p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls Cheatsheet */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              <Keyboard className="w-4 h-4 text-emerald-400" />
              <span>Keyboard Controls</span>
            </div>

            <div className="space-y-2">
              {game.controls?.map((ctrl, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 px-2.5 rounded-md bg-slate-950/60 border border-slate-800/80">
                  <span className="font-mono text-emerald-400 font-semibold">{ctrl.key}</span>
                  <span className="text-slate-300">{ctrl.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions & Details */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>How To Play</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {game.instructions || game.description}
            </p>
            <div className="flex items-center gap-2 text-2xs text-slate-500 font-mono">
              <span>Category: {game.category}</span>
              <span aria-hidden="true">·</span>
              <span>Rating: {game.rating} / 5.0</span>
              <span aria-hidden="true">·</span>
              <span>Plays: {game.playsCount?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
