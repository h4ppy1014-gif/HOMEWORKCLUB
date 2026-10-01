import React, { useEffect, useRef, useState, useCallback } from 'react';
import { playSound } from '../utils/audio.js';
import { RotateCcw, Heart, Trophy, Play, Pause } from 'lucide-react';

const CELL_SIZE = 20;
const COLS = 19;
const ROWS = 21;
const CANVAS_WIDTH = COLS * CELL_SIZE; // 380
const CANVAS_HEIGHT = ROWS * CELL_SIZE; // 420

// 1: Wall, 0: Pellet, 2: Power Pellet, 3: Empty corridor, 4: Ghost pen
const MAZE_MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,1],
  [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
  [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
  [1,1,1,1,0,1,1,1,3,1,3,1,1,1,0,1,1,1,1],
  [3,3,3,1,0,1,3,3,3,4,3,3,3,1,0,1,3,3,3],
  [1,1,1,1,0,1,3,1,1,4,1,1,3,1,0,1,1,1,1],
  [3,0,0,0,0,3,3,1,4,4,4,1,3,3,0,0,0,0,3],
  [1,1,1,1,0,1,3,1,1,1,1,1,3,1,0,1,1,1,1],
  [3,3,3,1,0,1,3,3,3,3,3,3,3,1,0,1,3,3,3],
  [1,1,1,1,0,1,3,1,1,1,1,1,3,1,0,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
  [1,2,0,1,0,0,0,0,0,3,0,0,0,0,0,1,0,2,1],
  [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
  [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export const PacmanGame = ({ soundEnabled = true }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('unblockzone_pacman_high') || '0', 10);
  });
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Mutable game refs for smooth 60fps loop
  const pacmanRef = useRef({
    x: 9 * CELL_SIZE + CELL_SIZE / 2,
    y: 16 * CELL_SIZE + CELL_SIZE / 2,
    dirX: 0,
    dirY: 0,
    nextDirX: 0,
    nextDirY: 0,
    angle: 0,
    mouthAngle: 0.2,
    mouthOpening: true,
  });

  const ghostsRef = useRef([
    { x: 9 * CELL_SIZE, y: 8 * CELL_SIZE, color: '#ef4444', dirX: 1, dirY: 0, name: 'Blinky' },
    { x: 8 * CELL_SIZE, y: 10 * CELL_SIZE, color: '#f472b6', dirX: -1, dirY: 0, name: 'Pinky' },
    { x: 9 * CELL_SIZE, y: 10 * CELL_SIZE, color: '#06b6d4', dirX: 0, dirY: -1, name: 'Inky' },
    { x: 10 * CELL_SIZE, y: 10 * CELL_SIZE, color: '#fb923c', dirX: 0, dirY: 1, name: 'Clyde' },
  ]);

  const pelletsRef = useRef([]);
  const powerPelletsRef = useRef([]);
  const frightTimerRef = useRef(0);

  const initBoard = useCallback(() => {
    const pellets = [];
    const powers = [];

    MAZE_MAP.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell === 0) {
          pellets.push({ r, c, active: true });
        } else if (cell === 2) {
          powers.push({ r, c, active: true });
        }
      });
    });

    pelletsRef.current = pellets;
    powerPelletsRef.current = powers;
    frightTimerRef.current = 0;

    pacmanRef.current = {
      x: 9 * CELL_SIZE + CELL_SIZE / 2,
      y: 16 * CELL_SIZE + CELL_SIZE / 2,
      dirX: 0,
      dirY: 0,
      nextDirX: 0,
      nextDirY: 0,
      angle: 0,
      mouthAngle: 0.2,
      mouthOpening: true,
    };

    ghostsRef.current = [
      { x: 9 * CELL_SIZE, y: 8 * CELL_SIZE, color: '#ef4444', dirX: 1, dirY: 0, name: 'Blinky' },
      { x: 8 * CELL_SIZE, y: 10 * CELL_SIZE, color: '#f472b6', dirX: -1, dirY: 0, name: 'Pinky' },
      { x: 9 * CELL_SIZE, y: 10 * CELL_SIZE, color: '#06b6d4', dirX: 0, dirY: -1, name: 'Inky' },
      { x: 10 * CELL_SIZE, y: 10 * CELL_SIZE, color: '#fb923c', dirX: 0, dirY: 1, name: 'Clyde' },
    ];
  }, []);

  const resetGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setIsGameOver(false);
    setIsWon(false);
    setIsPaused(false);
    initBoard();
    playSound('click', soundEnabled);
  }, [initBoard, soundEnabled]);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'p' || e.key === 'P' || e.key === ' ') {
        setIsPaused((prev) => !prev);
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        resetGame();
        return;
      }

      const p = pacmanRef.current;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        p.nextDirX = 0;
        p.nextDirY = -1;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        p.nextDirX = 0;
        p.nextDirY = 1;
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        p.nextDirX = -1;
        p.nextDirY = 0;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        p.nextDirX = 1;
        p.nextDirY = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetGame]);

  const canMove = (x, y, dx, dy) => {
    const targetX = x + dx * 3;
    const targetY = y + dy * 3;
    const r = Math.floor(targetY / CELL_SIZE);
    const c = Math.floor(targetX / CELL_SIZE);

    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true; // tunnel
    const cell = MAZE_MAP[r][c];
    return cell !== 1;
  };

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;

    const loop = () => {
      if (!isGameOver && !isWon && !isPaused) {
        const p = pacmanRef.current;

        // Fright timer countdown
        if (frightTimerRef.current > 0) {
          frightTimerRef.current--;
        }

        // Try apply next direction if valid
        if ((p.nextDirX !== 0 || p.nextDirY !== 0) && canMove(p.x, p.y, p.nextDirX, p.nextDirY)) {
          p.dirX = p.nextDirX;
          p.dirY = p.nextDirY;
        }

        // Move Pacman
        const speed = 2.2;
        if (canMove(p.x, p.y, p.dirX, p.dirY)) {
          p.x += p.dirX * speed;
          p.y += p.dirY * speed;

          // Tunnel wrap
          if (p.x < -10) p.x = CANVAS_WIDTH + 10;
          if (p.x > CANVAS_WIDTH + 10) p.x = -10;

          // Mouth animation
          if (p.mouthOpening) {
            p.mouthAngle += 0.04;
            if (p.mouthAngle >= 0.35) p.mouthOpening = false;
          } else {
            p.mouthAngle -= 0.04;
            if (p.mouthAngle <= 0.05) p.mouthOpening = true;
          }

          // Angle facing
          if (p.dirX === 1) p.angle = 0;
          if (p.dirX === -1) p.angle = Math.PI;
          if (p.dirY === 1) p.angle = Math.PI / 2;
          if (p.dirY === -1) p.angle = (3 * Math.PI) / 2;
        }

        // Eat Regular Pellets
        const pacR = Math.floor(p.y / CELL_SIZE);
        const pacC = Math.floor(p.x / CELL_SIZE);

        pelletsRef.current.forEach((pellet) => {
          if (pellet.active && pellet.r === pacR && pellet.c === pacC) {
            pellet.active = false;
            playSound('coin', soundEnabled);
            setScore((s) => {
              const next = s + 10;
              if (next > highScore) {
                setHighScore(next);
                localStorage.setItem('unblockzone_pacman_high', next.toString());
              }
              return next;
            });
          }
        });

        // Eat Power Pellets
        powerPelletsRef.current.forEach((power) => {
          if (power.active && power.r === pacR && power.c === pacC) {
            power.active = false;
            frightTimerRef.current = 300; // 5 seconds of fright
            playSound('powerup', soundEnabled);
            setScore((s) => s + 50);
          }
        });

        // Check Victory: All pellets eaten
        const remainingPellets = pelletsRef.current.filter((p) => p.active).length;
        if (remainingPellets === 0) {
          setIsWon(true);
          playSound('powerup', soundEnabled);
        }

        // Move Ghosts
        const isFrightened = frightTimerRef.current > 0;
        ghostsRef.current.forEach((ghost) => {
          const gSpeed = isFrightened ? 1.2 : 1.8;
          let gx = ghost.x + ghost.dirX * gSpeed;
          let gy = ghost.y + ghost.dirY * gSpeed;

          // Check if ghost can continue forward
          const gr = Math.floor((gy + CELL_SIZE / 2) / CELL_SIZE);
          const gc = Math.floor((gx + CELL_SIZE / 2) / CELL_SIZE);

          const directions = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 },
          ];

          if (
            gr < 0 ||
            gr >= ROWS ||
            gc < 0 ||
            gc >= COLS ||
            MAZE_MAP[gr][gc] === 1 ||
            Math.random() < 0.03
          ) {
            // Pick a valid direction that doesn't reverse directly unless blocked
            const validDirs = directions.filter((d) => {
              const testR = Math.floor((ghost.y + d.y * CELL_SIZE + CELL_SIZE / 2) / CELL_SIZE);
              const testC = Math.floor((ghost.x + d.x * CELL_SIZE + CELL_SIZE / 2) / CELL_SIZE);
              if (testR < 0 || testR >= ROWS || testC < 0 || testC >= COLS) return true;
              return MAZE_MAP[testR][testC] !== 1;
            });

            if (validDirs.length > 0) {
              const chosen = validDirs[Math.floor(Math.random() * validDirs.length)];
              ghost.dirX = chosen.x;
              ghost.dirY = chosen.y;
            }
          } else {
            ghost.x = gx;
            ghost.y = gy;
          }

          // Ghost-Pacman Collision
          const dist = Math.hypot(ghost.x + CELL_SIZE / 2 - p.x, ghost.y + CELL_SIZE / 2 - p.y);
          if (dist < 14) {
            if (isFrightened) {
              // Ghost eaten!
              ghost.x = 9 * CELL_SIZE;
              ghost.y = 10 * CELL_SIZE;
              playSound('coin', soundEnabled);
              setScore((s) => s + 200);
            } else {
              // Pacman caught
              playSound('hit', soundEnabled);
              setLives((l) => {
                const next = l - 1;
                if (next <= 0) {
                  setIsGameOver(true);
                  playSound('gameover', soundEnabled);
                } else {
                  // Reset positions
                  p.x = 9 * CELL_SIZE + CELL_SIZE / 2;
                  p.y = 16 * CELL_SIZE + CELL_SIZE / 2;
                  p.dirX = 0;
                  p.dirY = 0;
                }
                return next;
              });
            }
          }
        });
      }

      // Render Maze
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw Walls
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = MAZE_MAP[r][c];
          if (cell === 1) {
            ctx.fillStyle = '#1e3a8a';
            ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1;
            ctx.strokeRect(c * CELL_SIZE + 2, r * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
          } else if (cell === 4) {
            // Ghost house gate
            ctx.fillStyle = '#f43f5e';
            ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE + 8, CELL_SIZE, 4);
          }
        }
      }

      // Draw Pellets
      ctx.fillStyle = '#fde047';
      pelletsRef.current.forEach((pellet) => {
        if (!pellet.active) return;
        ctx.beginPath();
        ctx.arc(pellet.c * CELL_SIZE + CELL_SIZE / 2, pellet.r * CELL_SIZE + CELL_SIZE / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Power Pellets
      const isFlash = Math.floor(Date.now() / 200) % 2 === 0;
      if (isFlash) {
        ctx.fillStyle = '#ffffff';
        powerPelletsRef.current.forEach((power) => {
          if (!power.active) return;
          ctx.beginPath();
          ctx.arc(power.c * CELL_SIZE + CELL_SIZE / 2, power.r * CELL_SIZE + CELL_SIZE / 2, 6, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Draw Ghosts
      const isFright = frightTimerRef.current > 0;
      ghostsRef.current.forEach((ghost) => {
        ctx.fillStyle = isFright ? (frightTimerRef.current < 60 && isFlash ? '#ffffff' : '#3b82f6') : ghost.color;
        const gx = ghost.x + 2;
        const gy = ghost.y + 2;
        const gw = CELL_SIZE - 4;

        // Ghost body dome
        ctx.beginPath();
        ctx.arc(gx + gw / 2, gy + gw / 2, gw / 2, Math.PI, 0, false);
        ctx.lineTo(gx + gw, gy + gw);
        // Tentacles
        ctx.lineTo(gx + (3 * gw) / 4, gy + gw - 3);
        ctx.lineTo(gx + gw / 2, gy + gw);
        ctx.lineTo(gx + gw / 4, gy + gw - 3);
        ctx.lineTo(gx, gy + gw);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(gx + gw / 3, gy + gw / 3, 2.5, 0, Math.PI * 2);
        ctx.arc(gx + (2 * gw) / 3, gy + gw / 3, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(gx + gw / 3 + ghost.dirX, gy + gw / 3 + ghost.dirY, 1.2, 0, Math.PI * 2);
        ctx.arc(gx + (2 * gw) / 3 + ghost.dirX, gy + gw / 3 + ghost.dirY, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Pac-Man
      const p = pacmanRef.current;
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(
        p.x,
        p.y,
        CELL_SIZE / 2 - 2,
        p.angle + p.mouthAngle * Math.PI,
        p.angle + (2 - p.mouthAngle) * Math.PI
      );
      ctx.lineTo(p.x, p.y);
      ctx.closePath();
      ctx.fill();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isGameOver, isWon, isPaused, soundEnabled, highScore]);

  return (
    <div className="flex flex-col items-center justify-center p-4 select-none">
      {/* HUD Header */}
      <div className="w-full max-w-[380px] flex items-center justify-between mb-3 text-xs font-mono uppercase tracking-wider text-slate-300">
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="text-slate-400">SCORE:</span>
          <span className="text-yellow-400 font-bold tabular-nums text-sm">{score}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">HIGH:</span>
          <span className="text-amber-400 font-bold tabular-nums text-sm">{highScore}</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              className={`w-3.5 h-3.5 ${i < lives ? 'text-red-500 fill-red-500' : 'text-slate-700'}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-1">
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

      {/* Canvas */}
      <div className="relative border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-950">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block max-w-[380px] w-full" />

        {isWon && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-yellow-400 font-extrabold text-2xl tracking-wider mb-1 font-mono uppercase">
              MAZE CLEARED!
            </span>
            <p className="text-slate-300 text-sm mb-4">
              Final Score: <span className="text-yellow-400 font-bold tabular-nums">{score}</span>
            </p>
            <button
              onClick={resetGame}
              className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs rounded-lg uppercase tracking-wider"
            >
              Play Again
            </button>
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-red-500 font-extrabold text-2xl tracking-wider mb-1 font-mono uppercase">
              CHOMPED!
            </span>
            <p className="text-slate-300 text-sm mb-4">
              Score: <span className="text-yellow-400 font-bold tabular-nums">{score}</span>
            </p>
            <button
              onClick={resetGame}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg uppercase tracking-wider"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Mobile touch d-pad */}
      <div className="mt-4 grid grid-cols-3 gap-2 w-44 max-w-full md:hidden">
        <div />
        <button
          onClick={() => {
            pacmanRef.current.nextDirX = 0;
            pacmanRef.current.nextDirY = -1;
          }}
          className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold text-center"
        >
          ▲
        </button>
        <div />
        <button
          onClick={() => {
            pacmanRef.current.nextDirX = -1;
            pacmanRef.current.nextDirY = 0;
          }}
          className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold text-center"
        >
          ◀
        </button>
        <button
          onClick={() => {
            pacmanRef.current.nextDirX = 0;
            pacmanRef.current.nextDirY = 1;
          }}
          className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold text-center"
        >
          ▼
        </button>
        <button
          onClick={() => {
            pacmanRef.current.nextDirX = 1;
            pacmanRef.current.nextDirY = 0;
          }}
          className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold text-center"
        >
          ▶
        </button>
      </div>
    </div>
  );
};
