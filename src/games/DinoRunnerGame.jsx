import React, { useEffect, useRef, useState, useCallback } from 'react';
import { playSound } from '../utils/audio.js';
import { RotateCcw, Trophy } from 'lucide-react';

const CANVAS_WIDTH = 520;
const CANVAS_HEIGHT = 240;
const GROUND_Y = 190;
const GRAVITY = 0.55;
const JUMP_FORCE = -10.5;

export const DinoRunnerGame = ({ soundEnabled = true }) => {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('unblockzone_dino_high') || '0', 10);
  });

  const dinoRef = useRef({
    y: GROUND_Y - 40,
    vy: 0,
    width: 36,
    height: 40,
    isJumping: false,
    isDucking: false,
  });

  const obstaclesRef = useRef([]);
  const gameSpeedRef = useRef(5.5);
  const frameRef = useRef(0);

  const jump = useCallback(() => {
    if (gameOver) {
      resetGame();
      return;
    }
    if (!isPlaying) {
      setIsPlaying(true);
    }
    const dino = dinoRef.current;
    if (!dino.isJumping) {
      dino.vy = JUMP_FORCE;
      dino.isJumping = true;
      playSound('jump', soundEnabled);
    }
  }, [gameOver, isPlaying, soundEnabled]);

  const resetGame = () => {
    dinoRef.current = {
      y: GROUND_Y - 40,
      vy: 0,
      width: 36,
      height: 40,
      isJumping: false,
      isDucking: false,
    };
    obstaclesRef.current = [];
    gameSpeedRef.current = 5.5;
    frameRef.current = 0;
    setScore(0);
    setGameOver(false);
    setIsPlaying(false);
    playSound('click', soundEnabled);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ([' ', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        jump();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (!dinoRef.current.isJumping) {
          dinoRef.current.isDucking = true;
          dinoRef.current.height = 24;
          dinoRef.current.y = GROUND_Y - 24;
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        dinoRef.current.isDucking = false;
        dinoRef.current.height = 40;
        if (!dinoRef.current.isJumping) {
          dinoRef.current.y = GROUND_Y - 40;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;

    const loop = () => {
      frameRef.current++;

      if (isPlaying && !gameOver) {
        if (frameRef.current % 5 === 0) {
          setScore((s) => {
            const next = s + 1;
            if (next > 0 && next % 100 === 0) {
              playSound('coin', soundEnabled);
            }
            if (next > highScore) {
              setHighScore(next);
              localStorage.setItem('unblockzone_dino_high', next.toString());
            }
            return next;
          });
        }

        gameSpeedRef.current = Math.min(11, 5.5 + Math.floor(frameRef.current / 400) * 0.4);

        const dino = dinoRef.current;
        if (dino.isJumping) {
          dino.vy += GRAVITY;
          dino.y += dino.vy;

          if (dino.y >= GROUND_Y - dino.height) {
            dino.y = GROUND_Y - dino.height;
            dino.vy = 0;
            dino.isJumping = false;
          }
        }

        if (frameRef.current % Math.floor(100 / (gameSpeedRef.current / 5)) === 0 && Math.random() < 0.7) {
          const isBird = Math.random() < 0.28 && frameRef.current > 400;
          if (isBird) {
            obstaclesRef.current.push({
              x: CANVAS_WIDTH + 20,
              width: 32,
              height: 20,
              y: GROUND_Y - 42,
              type: 'bird',
            });
          } else {
            const cactusH = Math.random() > 0.5 ? 42 : 32;
            obstaclesRef.current.push({
              x: CANVAS_WIDTH + 20,
              width: 22,
              height: cactusH,
              y: GROUND_Y - cactusH,
              type: 'cactus',
            });
          }
        }

        const dinoX = 50;
        obstaclesRef.current.forEach((obs) => {
          obs.x -= gameSpeedRef.current;

          if (
            dinoX < obs.x + obs.width - 4 &&
            dinoX + dino.width > obs.x + 4 &&
            dino.y < obs.y + obs.height - 4 &&
            dino.y + dino.height > obs.y + 4
          ) {
            setGameOver(true);
            playSound('gameover', soundEnabled);
          }
        });

        obstaclesRef.current = obstaclesRef.current.filter((o) => o.x + o.width > -20);
      }

      const isNight = Math.floor(frameRef.current / 1200) % 2 === 1;
      ctx.fillStyle = isNight ? '#0b1120' : '#070b13';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = isNight ? '#e2e8f0' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH - 60, 45, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      for (let i = 0; i < 20; i++) {
        const gx = ((i * 35 - (frameRef.current * gameSpeedRef.current * 0.7)) % CANVAS_WIDTH + CANVAS_WIDTH) % CANVAS_WIDTH;
        ctx.fillRect(gx, GROUND_Y + 5, 8, 2);
      }

      obstaclesRef.current.forEach((obs) => {
        if (obs.type === 'cactus') {
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(obs.x + 6, obs.y, 10, obs.height);
          ctx.fillRect(obs.x, obs.y + 10, 6, 4);
          ctx.fillRect(obs.x, obs.y + 4, 4, 8);
          ctx.fillRect(obs.x + 16, obs.y + 14, 6, 4);
          ctx.fillRect(obs.x + 18, obs.y + 8, 4, 8);
        } else {
          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(obs.x, obs.y + 6, obs.width, 8);
          const wingUp = Math.floor(frameRef.current / 6) % 2 === 0;
          if (wingUp) {
            ctx.fillRect(obs.x + 10, obs.y, 8, 6);
          } else {
            ctx.fillRect(obs.x + 10, obs.y + 12, 8, 6);
          }
        }
      });

      const dino = dinoRef.current;
      const dinoX = 50;
      ctx.fillStyle = '#38bdf8';

      if (dino.isDucking) {
        ctx.fillRect(dinoX, dino.y, 44, dino.height);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(dinoX + 36, dino.y + 5, 3, 3);
      } else {
        ctx.fillRect(dinoX + 8, dino.y + 10, 20, 22);
        ctx.fillRect(dinoX + 16, dino.y, 18, 12);
        ctx.fillRect(dinoX + 26, dino.y + 4, 8, 8);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(dinoX + 26, dino.y + 2, 3, 3);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(dinoX, dino.y + 14, 8, 10);
        const legShift = Math.floor(frameRef.current / 5) % 2;
        if (!dino.isJumping) {
          ctx.fillRect(dinoX + 10, dino.y + 32, 4, legShift === 0 ? 8 : 4);
          ctx.fillRect(dinoX + 20, dino.y + 32, 4, legShift === 1 ? 8 : 4);
        } else {
          ctx.fillRect(dinoX + 10, dino.y + 32, 4, 4);
          ctx.fillRect(dinoX + 20, dino.y + 32, 4, 4);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, gameOver, soundEnabled, highScore]);

  return (
    <div className="flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-[520px] flex items-center justify-between mb-3 text-xs font-mono uppercase tracking-wider text-slate-300">
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="text-slate-400">DISTANCE:</span>
          <span className="text-cyan-400 font-bold tabular-nums text-sm">{score}m</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">RECORD:</span>
          <span className="text-amber-400 font-bold tabular-nums text-sm">{highScore}m</span>
        </div>

        <button
          onClick={resetGame}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div
        onClick={jump}
        className="relative border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-950 cursor-pointer"
      >
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block max-w-[520px] w-full" />

        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xs flex flex-col items-center justify-center p-6 text-center">
            <span className="text-white font-bold text-lg tracking-wider mb-1 font-mono uppercase">
              Press Space or Tap to Jump
            </span>
            <span className="text-slate-400 text-xs">Jump cacti · Down to duck birds</span>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-red-500 font-extrabold text-2xl tracking-wider mb-1 font-mono uppercase">
              EXTINCTION!
            </span>
            <p className="text-slate-300 text-sm mb-4">
              Distance: <span className="text-cyan-400 font-bold tabular-nums">{score}m</span>
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetGame();
              }}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg uppercase tracking-wider shadow-lg"
            >
              Run Again
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-3 w-full max-w-[520px] md:hidden">
        <button
          onClick={jump}
          className="flex-1 py-3 bg-cyan-600 active:bg-cyan-500 rounded-lg text-white font-bold uppercase tracking-wider text-xs"
        >
          JUMP ▲
        </button>
        <button
          onTouchStart={() => {
            dinoRef.current.isDucking = true;
            dinoRef.current.height = 24;
            dinoRef.current.y = GROUND_Y - 24;
          }}
          onTouchEnd={() => {
            dinoRef.current.isDucking = false;
            dinoRef.current.height = 40;
            if (!dinoRef.current.isJumping) {
              dinoRef.current.y = GROUND_Y - 40;
            }
          }}
          className="flex-1 py-3 bg-slate-900 border border-slate-800 active:bg-slate-800 rounded-lg text-white font-bold uppercase tracking-wider text-xs"
        >
          DUCK ▼
        </button>
      </div>
    </div>
  );
};
