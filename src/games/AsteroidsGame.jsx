import React, { useEffect, useRef, useState, useCallback } from 'react';
import { playSound } from '../utils/audio.js';
import { RotateCcw, Trophy, Play, Pause, Shield } from 'lucide-react';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 400;

export const AsteroidsGame = ({ soundEnabled = true }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('unblockzone_asteroids_high') || '0', 10);
  });
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const shipRef = useRef({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    r: 12,
    angle: -Math.PI / 2,
    rotation: 0,
    thrust: false,
    vx: 0,
    vy: 0,
  });

  const lasersRef = useRef([]);
  const asteroidsRef = useRef([]);
  const particlesRef = useRef([]);
  const keysRef = useRef({ left: false, right: false, up: false, shoot: false });
  const lastShotRef = useRef(0);

  const spawnAsteroids = useCallback((count) => {
    const list = [];
    for (let i = 0; i < count; i++) {
      let x, y;
      do {
        x = Math.random() * CANVAS_WIDTH;
        y = Math.random() * CANVAS_HEIGHT;
      } while (Math.hypot(x - CANVAS_WIDTH / 2, y - CANVAS_HEIGHT / 2) < 100);

      list.push({
        x,
        y,
        radius: 32, // Large
        vx: (Math.random() - 0.5) * 2.2,
        vy: (Math.random() - 0.5) * 2.2,
        tier: 3,
        points: 20,
      });
    }
    asteroidsRef.current = list;
  }, []);

  const resetGame = useCallback(() => {
    shipRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      r: 12,
      angle: -Math.PI / 2,
      rotation: 0,
      thrust: false,
      vx: 0,
      vy: 0,
    };
    lasersRef.current = [];
    particlesRef.current = [];
    setScore(0);
    setLives(3);
    setWave(1);
    setIsGameOver(false);
    setIsPaused(false);
    spawnAsteroids(4);
    playSound('click', soundEnabled);
  }, [spawnAsteroids, soundEnabled]);

  useEffect(() => {
    spawnAsteroids(4);
  }, [spawnAsteroids]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'p' || e.key === 'P') {
        setIsPaused((prev) => !prev);
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        resetGame();
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = true;
      if (e.key === ' ' || e.key === 'f' || e.key === 'F') keysRef.current.shoot = true;
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = false;
      if (e.key === ' ' || e.key === 'f' || e.key === 'F') keysRef.current.shoot = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [resetGame]);

  // Main loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;

    const loop = () => {
      if (!isGameOver && !isPaused) {
        const ship = shipRef.current;

        // Rotate
        if (keysRef.current.left) ship.angle -= 0.08;
        if (keysRef.current.right) ship.angle += 0.08;

        // Thrust
        if (keysRef.current.up) {
          ship.thrust = true;
          ship.vx += Math.cos(ship.angle) * 0.16;
          ship.vy += Math.sin(ship.angle) * 0.16;
        } else {
          ship.thrust = false;
          ship.vx *= 0.985;
          ship.vy *= 0.985;
        }

        // Move Ship & Wrap Screen
        ship.x += ship.vx;
        ship.y += ship.vy;

        if (ship.x < 0) ship.x = CANVAS_WIDTH;
        if (ship.x > CANVAS_WIDTH) ship.x = 0;
        if (ship.y < 0) ship.y = CANVAS_HEIGHT;
        if (ship.y > CANVAS_HEIGHT) ship.y = 0;

        // Fire Lasers
        const now = Date.now();
        if (keysRef.current.shoot && now - lastShotRef.current > 220) {
          lasersRef.current.push({
            x: ship.x + Math.cos(ship.angle) * ship.r,
            y: ship.y + Math.sin(ship.angle) * ship.r,
            vx: Math.cos(ship.angle) * 8.5,
            vy: Math.sin(ship.angle) * 8.5,
            life: 45,
          });
          lastShotRef.current = now;
          playSound('laser', soundEnabled);
        }

        // Update Lasers
        lasersRef.current.forEach((l) => {
          l.x += l.vx;
          l.y += l.vy;
          l.life--;
          if (l.x < 0) l.x = CANVAS_WIDTH;
          if (l.x > CANVAS_WIDTH) l.x = 0;
          if (l.y < 0) l.y = CANVAS_HEIGHT;
          if (l.y > CANVAS_HEIGHT) l.y = 0;
        });
        lasersRef.current = lasersRef.current.filter((l) => l.life > 0);

        // Move Asteroids
        asteroidsRef.current.forEach((a) => {
          a.x += a.vx;
          a.y += a.vy;
          if (a.x < -a.radius) a.x = CANVAS_WIDTH + a.radius;
          if (a.x > CANVAS_WIDTH + a.radius) a.x = -a.radius;
          if (a.y < -a.radius) a.y = CANVAS_HEIGHT + a.radius;
          if (a.y > CANVAS_HEIGHT + a.radius) a.y = -a.radius;
        });

        // Laser vs Asteroid Collisions
        const newAsteroids = [];
        asteroidsRef.current.forEach((a) => {
          let hit = false;
          lasersRef.current = lasersRef.current.filter((l) => {
            if (hit) return true;
            const dist = Math.hypot(l.x - a.x, l.y - a.y);
            if (dist < a.radius) {
              hit = true;
              playSound('hit', soundEnabled);
              setScore((s) => {
                const next = s + a.points;
                if (next > highScore) {
                  setHighScore(next);
                  localStorage.setItem('unblockzone_asteroids_high', next.toString());
                }
                return next;
              });

              // Split asteroid
              if (a.tier > 1) {
                const nextTier = a.tier - 1;
                const nextRadius = nextTier === 2 ? 20 : 12;
                const nextPoints = nextTier === 2 ? 50 : 100;
                newAsteroids.push({
                  x: a.x,
                  y: a.y,
                  radius: nextRadius,
                  vx: (Math.random() - 0.5) * 3,
                  vy: (Math.random() - 0.5) * 3,
                  tier: nextTier,
                  points: nextPoints,
                });
                newAsteroids.push({
                  x: a.x,
                  y: a.y,
                  radius: nextRadius,
                  vx: (Math.random() - 0.5) * 3,
                  vy: (Math.random() - 0.5) * 3,
                  tier: nextTier,
                  points: nextPoints,
                });
              }

              // Sparks
              for (let p = 0; p < 8; p++) {
                particlesRef.current.push({
                  x: a.x,
                  y: a.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  life: 20,
                  color: '#38bdf8',
                });
              }

              return false; // remove laser
            }
            return true;
          });

          if (!hit) {
            newAsteroids.push(a);
          }
        });

        asteroidsRef.current = newAsteroids;

        // Wave Completion
        if (asteroidsRef.current.length === 0) {
          setWave((w) => w + 1);
          spawnAsteroids(4 + wave);
          playSound('powerup', soundEnabled);
        }

        // Ship vs Asteroid Collision
        for (const a of asteroidsRef.current) {
          const dist = Math.hypot(ship.x - a.x, ship.y - a.y);
          if (dist < ship.r + a.radius - 2) {
            playSound('gameover', soundEnabled);
            setLives((l) => {
              const next = l - 1;
              if (next <= 0) {
                setIsGameOver(true);
              } else {
                ship.x = CANVAS_WIDTH / 2;
                ship.y = CANVAS_HEIGHT / 2;
                ship.vx = 0;
                ship.vy = 0;
              }
              return next;
            });
            break;
          }
        }

        // Update Particles
        particlesRef.current.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
        });
        particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
      }

      // Render
      ctx.fillStyle = '#05070e';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let i = 0; i < 30; i++) {
        const sx = (i * 97) % CANVAS_WIDTH;
        const sy = (i * 131) % CANVAS_HEIGHT;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Draw Asteroids
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      asteroidsRef.current.forEach((a) => {
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw Lasers
      ctx.fillStyle = '#22d3ee';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 8;
      lasersRef.current.forEach((l) => {
        ctx.beginPath();
        ctx.arc(l.x, l.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Draw Particles
      particlesRef.current.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 2, 2);
      });

      // Draw Ship
      const ship = shipRef.current;
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);

      // Ship body (triangle)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ship.r, 0);
      ctx.lineTo(-ship.r, ship.r * 0.75);
      ctx.lineTo(-ship.r * 0.5, 0);
      ctx.lineTo(-ship.r, -ship.r * 0.75);
      ctx.closePath();
      ctx.stroke();

      // Thruster flame
      if (ship.thrust) {
        ctx.strokeStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(-ship.r * 0.6, -ship.r * 0.4);
        ctx.lineTo(-ship.r * 1.4, 0);
        ctx.lineTo(-ship.r * 0.6, ship.r * 0.4);
        ctx.stroke();
      }

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isGameOver, isPaused, wave, soundEnabled, highScore, spawnAsteroids]);

  return (
    <div className="flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-[500px] flex items-center justify-between mb-3 text-xs font-mono uppercase tracking-wider text-slate-300">
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="text-slate-400">SCORE:</span>
          <span className="text-cyan-400 font-bold tabular-nums text-sm">{score}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">HIGH:</span>
          <span className="text-amber-400 font-bold tabular-nums text-sm">{highScore}</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Shield className="w-3.5 h-3.5 text-cyan-400 mr-1" />
          <span className="text-cyan-300 font-bold tabular-nums">{lives}</span>
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

      <div className="relative border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-950">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block max-w-[500px] w-full" />

        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-red-500 font-extrabold text-2xl tracking-wider mb-1 font-mono uppercase">
              HULL BREACH
            </span>
            <p className="text-slate-300 text-sm mb-4">
              Final Score: <span className="text-cyan-400 font-bold tabular-nums">{score}</span>
            </p>
            <button
              onClick={resetGame}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg uppercase tracking-wider"
            >
              Relaunch
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between w-full max-w-[500px] md:hidden px-2">
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
        <div className="flex gap-2">
          <button
            onTouchStart={() => (keysRef.current.up = true)}
            onTouchEnd={() => (keysRef.current.up = false)}
            className="px-5 py-3 bg-cyan-600 active:bg-cyan-500 rounded-lg text-white font-bold text-xs"
          >
            THRUST
          </button>
          <button
            onTouchStart={() => (keysRef.current.shoot = true)}
            onTouchEnd={() => (keysRef.current.shoot = false)}
            className="px-5 py-3 bg-rose-600 active:bg-rose-500 rounded-lg text-white font-bold text-xs"
          >
            FIRE
          </button>
        </div>
      </div>
    </div>
  );
};
