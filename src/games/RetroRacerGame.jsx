import React, { useEffect, useRef, useState, useCallback } from 'react';
import { playSound } from '../utils/audio.js';
import { RotateCcw, Trophy, Zap, Play, Pause } from 'lucide-react';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 480;
const ROAD_LEFT = 60;
const ROAD_RIGHT = 340;
const ROAD_WIDTH = ROAD_RIGHT - ROAD_LEFT;
const LANE_COUNT = 3;
const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT;

export const RetroRacerGame = ({ soundEnabled = true }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(85);
  const [turbo, setTurbo] = useState(100);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('unblockzone_racer_high') || '0', 10);
  });
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const playerRef = useRef({
    x: CANVAS_WIDTH / 2 - 16,
    y: CANVAS_HEIGHT - 90,
    width: 32,
    height: 52,
    vx: 0,
    isTurbo: false,
  });

  const trafficRef = useRef([]);
  const roadOffsetRef = useRef(0);
  const keysRef = useRef({ left: false, right: false, up: false, down: false, space: false });

  const resetGame = useCallback(() => {
    playerRef.current = {
      x: CANVAS_WIDTH / 2 - 16,
      y: CANVAS_HEIGHT - 90,
      width: 32,
      height: 52,
      vx: 0,
      isTurbo: false,
    };
    trafficRef.current = [];
    roadOffsetRef.current = 0;
    setScore(0);
    setSpeed(85);
    setTurbo(100);
    setIsGameOver(false);
    setIsPaused(false);
    playSound('click', soundEnabled);
  }, [soundEnabled]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
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
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = true;
      if (e.key === ' ') keysRef.current.space = true;
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = false;
      if (e.key === ' ') keysRef.current.space = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [resetGame]);

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let frame = 0;

    const loop = () => {
      if (!isGameOver && !isPaused) {
        frame++;
        const p = playerRef.current;

        // Base Speed & Turbo calculation
        let currentSpeed = 85;
        if (keysRef.current.space && turbo > 0) {
          currentSpeed = 145;
          setTurbo((t) => Math.max(0, t - 0.4));
        } else if (keysRef.current.up) {
          currentSpeed = 110;
        } else if (keysRef.current.down) {
          currentSpeed = 60;
        } else {
          // Recharge turbo slowly
          setTurbo((t) => Math.min(100, t + 0.1));
        }
        setSpeed(Math.round(currentSpeed));

        // Lateral steering
        const steerSpeed = currentSpeed > 100 ? 5.2 : 4.5;
        if (keysRef.current.left) p.x -= steerSpeed;
        if (keysRef.current.right) p.x += steerSpeed;

        // Road boundaries
        if (p.x < ROAD_LEFT + 5) p.x = ROAD_LEFT + 5;
        if (p.x + p.width > ROAD_RIGHT - 5) p.x = ROAD_RIGHT - p.width - 5;

        // Scroll Road lines
        roadOffsetRef.current = (roadOffsetRef.current + currentSpeed * 0.12) % 60;

        // Increment Score
        if (frame % 4 === 0) {
          setScore((s) => {
            const next = s + Math.round(currentSpeed / 20);
            if (next > highScore) {
              setHighScore(next);
              localStorage.setItem('unblockzone_racer_high', next.toString());
            }
            return next;
          });
        }

        // Spawn Rival Cars
        if (frame % Math.floor(90 / (currentSpeed / 80)) === 0 && Math.random() < 0.85) {
          const lane = Math.floor(Math.random() * LANE_COUNT);
          const carX = ROAD_LEFT + lane * LANE_WIDTH + (LANE_WIDTH - 30) / 2;
          const colors = ['#f43f5e', '#3b82f6', '#eab308', '#a855f7', '#ec4899'];
          trafficRef.current.push({
            x: carX,
            y: -70,
            width: 30,
            height: 50,
            color: colors[Math.floor(Math.random() * colors.length)],
            speed: 35 + Math.random() * 25,
          });
        }

        // Move Rival Cars
        trafficRef.current.forEach((car) => {
          // Relative downward velocity
          const relativeSpeed = (currentSpeed - car.speed) * 0.12;
          car.y += relativeSpeed;

          // Check Collision with player
          if (
            p.x < car.x + car.width &&
            p.x + p.width > car.x &&
            p.y < car.y + car.height &&
            p.y + p.height > car.y
          ) {
            setIsGameOver(true);
            playSound('gameover', soundEnabled);
          }
        });

        // Remove out-of-screen traffic
        trafficRef.current = trafficRef.current.filter((c) => c.y < CANVAS_HEIGHT + 100);
      }

      // Render
      // Roadside grass/city
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Asphalt Road
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, CANVAS_HEIGHT);

      // Curbs (Red & White neon dashes)
      const curbDash = roadOffsetRef.current % 30;
      for (let y = -30 + curbDash; y < CANVAS_HEIGHT; y += 30) {
        ctx.fillStyle = (y / 30) % 2 === 0 ? '#ef4444' : '#ffffff';
        ctx.fillRect(ROAD_LEFT - 6, y, 6, 20);
        ctx.fillRect(ROAD_RIGHT, y, 6, 20);
      }

      // Lane dividers (Dashed glowing lines)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([25, 20]);
      ctx.lineDashOffset = -roadOffsetRef.current;

      for (let l = 1; l < LANE_COUNT; l++) {
        const lx = ROAD_LEFT + l * LANE_WIDTH;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, CANVAS_HEIGHT);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw Traffic Cars
      trafficRef.current.forEach((car) => {
        ctx.fillStyle = car.color;
        ctx.shadowColor = car.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.roundRect(car.x, car.y, car.width, car.height, 4);
        ctx.fill();

        // Windshield
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(car.x + 4, car.y + 12, car.width - 8, 10);

        // Headlights
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(car.x + 3, car.y + car.height - 4, 6, 3);
        ctx.fillRect(car.x + car.width - 9, car.y + car.height - 4, 6, 3);
      });
      ctx.shadowBlur = 0;

      // Draw Player Sports Car (Emerald & Cyan)
      const p = playerRef.current;
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = keysRef.current.space ? 16 : 8;

      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.width, p.height, 6);
      ctx.fill();

      // Cockpit / Glass
      ctx.fillStyle = '#022c22';
      ctx.fillRect(p.x + 4, p.y + 14, p.width - 8, 14);

      // Tail lights
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(p.x + 3, p.y + p.height - 4, 6, 3);
      ctx.fillRect(p.x + p.width - 9, p.y + p.height - 4, 6, 3);

      // Headlights glow ahead
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(p.x + 4, p.y);
      ctx.lineTo(p.x - 10, p.y - 70);
      ctx.lineTo(p.x + p.width + 10, p.y - 70);
      ctx.lineTo(p.x + p.width - 4, p.y);
      ctx.closePath();
      ctx.fill();

      // Turbo flame boost
      if (keysRef.current.space && turbo > 0) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(p.x + 8, p.y + p.height, 5, 12);
        ctx.fillRect(p.x + p.width - 13, p.y + p.height, 5, 12);
      }
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isGameOver, isPaused, turbo, soundEnabled, highScore]);

  return (
    <div className="flex flex-col items-center justify-center p-4 select-none">
      {/* HUD Header */}
      <div className="w-full max-w-[400px] flex items-center justify-between mb-3 text-xs font-mono uppercase tracking-wider text-slate-300">
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="text-slate-400">SCORE:</span>
          <span className="text-emerald-400 font-bold tabular-nums text-sm">{score}m</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="text-slate-400">SPEED:</span>
          <span className="text-cyan-400 font-bold tabular-nums text-sm">{speed} MPH</span>
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

      {/* Turbo Gauge */}
      <div className="w-full max-w-[400px] mb-2 px-1 flex items-center gap-2 text-2xs font-mono text-slate-400">
        <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
        <span className="w-12">NITRO:</span>
        <div className="flex-1 bg-slate-900 border border-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-cyan-400 h-full transition-all duration-75"
            style={{ width: `${turbo}%` }}
          />
        </div>
        <span className="w-8 text-right tabular-nums text-slate-300">{Math.round(turbo)}%</span>
      </div>

      {/* Canvas */}
      <div className="relative border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-950">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block max-w-[400px] w-full" />

        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-red-500 font-extrabold text-2xl tracking-wider mb-1 font-mono uppercase">
              HIGHWAY CRASH!
            </span>
            <p className="text-slate-300 text-sm mb-4">
              Distance: <span className="text-emerald-400 font-bold tabular-nums">{score}m</span>
            </p>
            <button
              onClick={resetGame}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg uppercase tracking-wider"
            >
              Drive Again
            </button>
          </div>
        )}
      </div>

      {/* Mobile controls */}
      <div className="mt-3 flex items-center justify-between w-full max-w-[400px] md:hidden px-2">
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
          onTouchStart={() => (keysRef.current.space = true)}
          onTouchEnd={() => (keysRef.current.space = false)}
          className="px-6 py-3 bg-cyan-600 active:bg-cyan-500 rounded-lg text-white font-bold text-xs uppercase tracking-wider"
        >
          NITRO BOOST
        </button>
      </div>
    </div>
  );
};
