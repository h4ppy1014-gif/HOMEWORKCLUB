import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from '../utils/audio.js';
import { RotateCcw, Trophy, Timer } from 'lucide-react';

const HOLE_COUNT = 9;
const GAME_DURATION = 30; // 30 seconds

export const CyberWhackGame = ({ soundEnabled = true }) => {
  const [activeMole, setActiveMole] = useState(null); // index 0-8
  const [isGolden, setIsGolden] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [whackedHole, setWhackedHole] = useState(null);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('unblockzone_whack_high') || '0', 10);
  });

  const timerRef = useRef(null);
  const moleTimerRef = useRef(null);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setIsPlaying(true);
    setGameOver(false);
    setActiveMole(null);
    playSound('click', soundEnabled);
  }, [soundEnabled]);

  // Main countdown timer
  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            setIsPlaying(false);
            setGameOver(true);
            setActiveMole(null);
            playSound('powerup', soundEnabled);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, timeLeft, soundEnabled]);

  // Mole pop up interval
  useEffect(() => {
    if (!isPlaying || gameOver) {
      if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
      return;
    }

    const popNextMole = () => {
      const nextHole = Math.floor(Math.random() * HOLE_COUNT);
      const golden = Math.random() < 0.2; // 20% golden bonus
      setActiveMole(nextHole);
      setIsGolden(golden);

      // Duration mole stays visible: scales down as game progresses
      const duration = Math.max(500, 950 - (GAME_DURATION - timeLeft) * 15);
      moleTimerRef.current = setTimeout(() => {
        setActiveMole(null);
        const pause = Math.random() * 250 + 150;
        moleTimerRef.current = setTimeout(popNextMole, pause);
      }, duration);
    };

    popNextMole();

    return () => {
      if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
    };
  }, [isPlaying, gameOver, timeLeft]);

  const handleWhack = (index) => {
    if (!isPlaying || gameOver) return;

    if (activeMole === index) {
      const points = isGolden ? 30 : 10;
      setWhackedHole(index);
      setTimeout(() => setWhackedHole(null), 150);

      playSound(isGolden ? 'powerup' : 'hit', soundEnabled);
      setScore((s) => {
        const next = s + points;
        if (next > highScore) {
          setHighScore(next);
          localStorage.setItem('unblockzone_whack_high', next.toString());
        }
        return next;
      });
      setActiveMole(null);
    } else {
      // Miss click
      playSound('click', soundEnabled);
    }
  };

  // Keyboard 1-9 support
  useEffect(() => {
    const handleKeyDown = (e) => {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        handleWhack(num - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="flex flex-col items-center justify-center p-4 select-none">
      {/* Top HUD */}
      <div className="w-full max-w-[380px] flex items-center justify-between mb-3 text-xs font-mono uppercase tracking-wider text-slate-300">
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="text-slate-400">SCORE:</span>
          <span className="text-cyan-400 font-bold tabular-nums text-sm">{score}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Timer className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">TIME:</span>
          <span className={`font-bold tabular-nums text-sm ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>
            {timeLeft}s
          </span>
        </div>

        <button
          onClick={startGame}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Restart"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid Arena */}
      <div className="relative w-full max-w-[380px] aspect-square p-4 bg-slate-900 border-2 border-slate-800 rounded-2xl shadow-2xl flex flex-col items-center justify-center">
        <div className="grid grid-cols-3 grid-rows-3 gap-3 w-full h-full">
          {Array.from({ length: HOLE_COUNT }).map((_, idx) => {
            const isTarget = activeMole === idx;
            const isHit = whackedHole === idx;

            return (
              <button
                key={idx}
                onClick={() => handleWhack(idx)}
                className={`relative rounded-xl border-2 overflow-hidden flex items-center justify-center transition-all duration-100 cursor-pointer ${
                  isHit
                    ? 'bg-red-500/30 border-red-500 scale-95'
                    : isTarget
                    ? isGolden
                      ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50'
                      : 'bg-emerald-500/20 border-emerald-400'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Hole base ring */}
                <div className="absolute inset-x-2 bottom-1 h-3 rounded-full bg-slate-950 border border-slate-800/80" />

                {/* Key hint number */}
                <span className="absolute top-1 left-2 text-3xs font-mono text-slate-600">
                  {idx + 1}
                </span>

                {/* Animated Mole Avatar */}
                {isTarget && (
                  <div
                    className={`relative z-10 w-12 h-14 rounded-t-full border-2 flex flex-col items-center justify-center animate-bounce duration-300 ${
                      isGolden
                        ? 'bg-yellow-400 border-amber-600 text-slate-950 shadow-lg shadow-yellow-400/50'
                        : 'bg-emerald-500 border-emerald-700 text-white shadow-lg shadow-emerald-500/50'
                    }`}
                  >
                    {/* Mole Eyes */}
                    <div className="flex gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-slate-950" />
                      <div className="w-2 h-2 rounded-full bg-slate-950" />
                    </div>
                    {/* Snout */}
                    <div className="w-3 h-2 rounded-full bg-rose-400" />
                    <span className="text-3xs font-bold mt-1">
                      {isGolden ? '+30' : '+10'}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Start Game prompt */}
        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-6 text-center">
            <span className="text-cyan-400 font-extrabold text-xl font-mono uppercase mb-2">
              CYBER REFLEX WHACK
            </span>
            <p className="text-slate-300 text-xs mb-4 max-w-xs">
              Whack glowing target moles before they burrow away! Hit golden ones for triple points.
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl uppercase tracking-wider shadow-lg active:scale-95 transition-transform"
            >
              Start Game
            </button>
          </div>
        )}

        {/* Game Over modal */}
        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <Trophy className="w-10 h-10 text-yellow-400 mb-2" />
            <span className="text-amber-400 font-black text-2xl font-mono uppercase mb-1">
              TIME'S UP!
            </span>
            <p className="text-slate-300 text-sm mb-4">
              Final Whack Score: <span className="text-cyan-400 font-bold tabular-nums">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg uppercase tracking-wider"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      <p className="mt-3 text-2xs text-slate-500 font-mono text-center">
        Tip: Click holes or use keys 1 to 9 on your keyboard!
      </p>
    </div>
  );
};
