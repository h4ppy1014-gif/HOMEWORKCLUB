import React, { useEffect, useRef, useState, useCallback } from 'react';
import { playSound } from '../utils/audio.js';
import { Play, Pause, RotateCcw, Shield, Trophy } from 'lucide-react';

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 440;
const PLAYER_WIDTH = 34;
const PLAYER_HEIGHT = 18;

export const SpaceDefendersGame = ({ soundEnabled = true }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('unblockzone_space_high') || '0', 10);
  });

  const playerXRef = useRef((CANVAS_WIDTH - PLAYER_WIDTH) / 2);
  const aliensRef = useRef([]);
  const bulletsRef = useRef([]);
  const alienDirRef = useRef(1);
  const keysRef = useRef({
    left: false,
    right: false,
    shoot: false,
  });
  const lastShotRef = useRef(0);

  const initAliens = useCallback(() => {
    const rows = 4;
    const cols = 9;
    const alienW = 28;
    const alienH = 18;
    const padX = 14;
    const padY = 12;
    const startX = 40;
    const startY = 40;

    const list = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const type = r === 0 ? 3 : r <= 2 ? 2 : 1;
        list.push({
          x: startX + c * (alienW + padX),
          y: startY + r * (alienH + padY),
          width: alienW,
          height: alienH,
          alive: true,
          type,
        });
      }
    }
    aliensRef.current = list;
    alienDirRef.current = 1;
  }, []);

  const resetGame = useCallback(() => {
    playerXRef.current = (CANVAS_WIDTH - PLAYER_WIDTH) / 2;
    bulletsRef.current = [];
    initAliens();
    setScore(0);
    setLives(3);
    setWave(1);
    setIsGameOver(false);
    setIsPaused(false);
    playSound('click', soundEnabled);
  }, [initAliens, soundEnabled]);

  useEffect(() => {
    initAliens();
  }, [initAliens]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'p' || e.key === 'P') {
        setIsPaused((p) => !p);
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        resetGame();
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keysRef.current.shoot = true;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keysRef.current.shoot = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [resetGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let tickCount = 0;

    const loop = () => {
      if (!isGameOver && !isPaused) {
        tickCount++;

        const speed = 4.2;
        if (keysRef.current.left) {
          playerXRef.current = Math.max(10, playerXRef.current - speed);
        }
        if (keysRef.current.right) {
          playerXRef.current = Math.min(CANVAS_WIDTH - PLAYER_WIDTH - 10, playerXRef.current + speed);
        }

        const now = Date.now();
        if (keysRef.current.shoot && now - lastShotRef.current > 260) {
          bulletsRef.current.push({
            x: playerXRef.current + PLAYER_WIDTH / 2,
            y: CANVAS_HEIGHT - 35,
            dy: -6.5,
            isPlayer: true,
          });
          lastShotRef.current = now;
          playSound('laser', soundEnabled);
        }

        const livingAliens = aliensRef.current.filter((a) => a.alive);
        if (livingAliens.length === 0) {
          setWave((w) => w + 1);
          initAliens();
          playSound('powerup', soundEnabled);
        } else {
          const moveInterval = Math.max(8, Math.floor(livingAliens.length / 2));
          if (tickCount % moveInterval === 0) {
            let hitEdge = false;
            livingAliens.forEach((a) => {
              if (
                (alienDirRef.current > 0 && a.x + a.width >= CANVAS_WIDTH - 15) ||
                (alienDirRef.current < 0 && a.x <= 15)
              ) {
                hitEdge = true;
              }
            });

            if (hitEdge) {
              alienDirRef.current = -alienDirRef.current;
              aliensRef.current.forEach((a) => {
                a.y += 14;
                if (a.y + a.height >= CANVAS_HEIGHT - 45) {
                  setIsGameOver(true);
                  playSound('gameover', soundEnabled);
                }
              });
            } else {
              aliensRef.current.forEach((a) => {
                a.x += alienDirRef.current * 7;
              });
            }
          }

          if (Math.random() < 0.025 + wave * 0.005) {
            const shooter = livingAliens[Math.floor(Math.random() * livingAliens.length)];
            bulletsRef.current.push({
              x: shooter.x + shooter.width / 2,
              y: shooter.y + shooter.height,
              dy: 3.5,
              isPlayer: false,
            });
          }
        }

        bulletsRef.current.forEach((b) => {
          b.y += b.dy;
        });

        bulletsRef.current = bulletsRef.current.filter((b) => {
          if (b.y < 0 || b.y > CANVAS_HEIGHT) return false;

          if (b.isPlayer) {
            for (const a of aliensRef.current) {
              if (a.alive && b.x >= a.x && b.x <= a.x + a.width && b.y >= a.y && b.y <= a.y + a.height) {
                a.alive = false;
                playSound('hit', soundEnabled);
                const pts = a.type === 3 ? 30 : a.type === 2 ? 20 : 10;
                setScore((s) => {
                  const newScore = s + pts;
                  if (newScore > highScore) {
                    setHighScore(newScore);
                    localStorage.setItem('unblockzone_space_high', newScore.toString());
                  }
                  return newScore;
                });
                return false;
              }
            }
          } else {
            const px = playerXRef.current;
            const py = CANVAS_HEIGHT - 35;
            if (b.x >= px && b.x <= px + PLAYER_WIDTH && b.y >= py && b.y <= py + PLAYER_HEIGHT) {
              playSound('gameover', soundEnabled);
              setLives((l) => {
                const nextL = l - 1;
                if (nextL <= 0) {
                  setIsGameOver(true);
                }
                return nextL;
              });
              return false;
            }
          }
          return true;
        });
      }

      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 40; i++) {
        const sx = (i * 97) % CANVAS_WIDTH;
        const sy = (i * 73 + tickCount * 0.3) % CANVAS_HEIGHT;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      aliensRef.current.forEach((a) => {
        if (!a.alive) return;
        ctx.fillStyle = a.type === 3 ? '#ec4899' : a.type === 2 ? '#3b82f6' : '#10b981';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;

        ctx.fillRect(a.x + 4, a.y, a.width - 8, a.height);
        ctx.fillRect(a.x, a.y + 4, a.width, a.height - 8);

        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.fillRect(a.x + 6, a.y + 4, 3, 3);
        ctx.fillRect(a.x + a.width - 9, a.y + 4, 3, 3);
      });

      bulletsRef.current.forEach((b) => {
        if (b.isPlayer) {
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 6;
          ctx.fillRect(b.x - 1.5, b.y, 3, 10);
        } else {
          ctx.fillStyle = '#f43f5e';
          ctx.shadowColor = '#e11d48';
          ctx.shadowBlur = 6;
          ctx.fillRect(b.x - 1.5, b.y, 3, 8);
        }
      });

      const px = playerXRef.current;
      const py = CANVAS_HEIGHT - 35;
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(px + PLAYER_WIDTH / 2, py);
      ctx.lineTo(px + PLAYER_WIDTH, py + PLAYER_HEIGHT);
      ctx.lineTo(px, py + PLAYER_HEIGHT);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + PLAYER_WIDTH / 2 - 2, py + 6, 4, 4);

      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [initAliens, isGameOver, isPaused, wave, soundEnabled, highScore]);

  return (
    <div className="flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-[480px] flex items-center justify-between mb-3 text-xs font-mono uppercase tracking-wider text-slate-300">
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="text-slate-400">SCORE:</span>
          <span className="text-cyan-400 font-bold tabular-nums text-sm">{score}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">BEST:</span>
          <span className="text-amber-400 font-bold tabular-nums text-sm">{highScore}</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Shield className="w-3.5 h-3.5 text-cyan-400 mr-1" />
          <span className="text-slate-400">SHIPS:</span>
          <span className="text-cyan-300 font-bold tabular-nums">{lives}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={resetGame}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-950">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block max-w-[480px] w-full" />

        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-red-500 font-extrabold text-2xl tracking-wider mb-1 font-mono uppercase">
              DEFENSE BREACHED
            </span>
            <p className="text-slate-300 text-sm mb-4">
              Final Score: <span className="text-cyan-400 font-bold tabular-nums">{score}</span>
            </p>
            <button
              onClick={resetGame}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg uppercase tracking-wider"
            >
              Re-engage Fleet
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between w-full max-w-[480px] md:hidden px-2">
        <div className="flex gap-2">
          <button
            onTouchStart={() => (keysRef.current.left = true)}
            onTouchEnd={() => (keysRef.current.left = false)}
            className="px-5 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold"
          >
            ◀
          </button>
          <button
            onTouchStart={() => (keysRef.current.right = true)}
            onTouchEnd={() => (keysRef.current.right = false)}
            className="px-5 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold"
          >
            ▶
          </button>
        </div>
        <button
          onTouchStart={() => (keysRef.current.shoot = true)}
          onTouchEnd={() => (keysRef.current.shoot = false)}
          className="px-6 py-3 bg-cyan-600 active:bg-cyan-500 rounded-lg text-white font-bold uppercase tracking-wider text-xs"
        >
          FIRE
        </button>
      </div>
    </div>
  );
};
