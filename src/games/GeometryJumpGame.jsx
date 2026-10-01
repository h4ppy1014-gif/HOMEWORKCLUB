import React, { useEffect, useRef, useState, useCallback } from 'react';
import { playSound } from '../utils/audio.js';
import { RotateCcw, Trophy, Play, Pause } from 'lucide-react';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 260;
const GROUND_Y = 210;
const GRAVITY = 0.65;
const JUMP_FORCE = -11.5;
const LEVEL_LENGTH = 3200; // total run distance to 100%

export const GeometryJumpGame = ({ soundEnabled = true }) => {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [progress, setProgress] = useState(0);
  const [attempts, setAttempts] = useState(1);
  const [bestProgress, setBestProgress] = useState(() => {
    return parseInt(localStorage.getItem('unblockzone_geometry_best') || '0', 10);
  });

  const cubeRef = useRef({
    x: 70,
    y: GROUND_Y - 26,
    size: 26,
    vy: 0,
    rotation: 0,
    onGround: true,
  });

  const distanceRef = useRef(0);
  const obstaclesRef = useRef([]);

  // Generate track layout
  const initObstacles = useCallback(() => {
    const list = [];
    const distances = [
      400, 650, 850, 1050, 1250, 1450, 1600, 1750, 1950, 2150, 2300, 2500, 2700, 2900,
    ];

    distances.forEach((dist, idx) => {
      // 1: Single spike, 2: Double spike, 3: Jump pad + spike
      const type = idx % 4 === 3 ? 'pad' : idx % 3 === 2 ? 'double-spike' : 'spike';
      list.push({
        x: dist,
        type,
      });
    });

    obstaclesRef.current = list;
    distanceRef.current = 0;
  }, []);

  const jump = useCallback(() => {
    if (gameOver || isWon) {
      resetGame();
      return;
    }
    if (!isPlaying) {
      setIsPlaying(true);
    }
    const cube = cubeRef.current;
    if (cube.onGround) {
      cube.vy = JUMP_FORCE;
      cube.onGround = false;
      playSound('jump', soundEnabled);
    }
  }, [gameOver, isWon, isPlaying, soundEnabled]);

  const resetGame = () => {
    cubeRef.current = {
      x: 70,
      y: GROUND_Y - 26,
      size: 26,
      vy: 0,
      rotation: 0,
      onGround: true,
    };
    initObstacles();
    setProgress(0);
    setGameOver(false);
    setIsWon(false);
    setIsPlaying(false);
    setAttempts((a) => a + 1);
    playSound('click', soundEnabled);
  };

  useEffect(() => {
    initObstacles();
  }, [initObstacles]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ([' ', 'ArrowUp', 'w', 'W'].includes(e.key)) {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;

    const loop = () => {
      if (isPlaying && !gameOver && !isWon) {
        const speed = 6.2;
        distanceRef.current += speed;

        const currentProg = Math.min(100, Math.floor((distanceRef.current / LEVEL_LENGTH) * 100));
        setProgress(currentProg);

        if (currentProg > bestProgress) {
          setBestProgress(currentProg);
          localStorage.setItem('unblockzone_geometry_best', currentProg.toString());
        }

        // Check Victory
        if (distanceRef.current >= LEVEL_LENGTH) {
          setIsWon(true);
          playSound('powerup', soundEnabled);
        }

        // Physics for Cube
        const cube = cubeRef.current;
        cube.vy += GRAVITY;
        cube.y += cube.vy;

        // Ground touch
        if (cube.y >= GROUND_Y - cube.size) {
          cube.y = GROUND_Y - cube.size;
          cube.vy = 0;
          cube.onGround = true;
          // Snap rotation to nearest 90 deg on ground
          cube.rotation = Math.round(cube.rotation / (Math.PI / 2)) * (Math.PI / 2);
        } else {
          cube.onGround = false;
          cube.rotation += 0.12; // In-air flip
        }

        // Check Obstacle Collisions
        obstaclesRef.current.forEach((obs) => {
          const screenX = obs.x - distanceRef.current;

          if (obs.type === 'spike') {
            // Triangle spike
            const spikeX = screenX;
            const spikeY = GROUND_Y - 24;
            const spikeW = 20;
            const spikeH = 24;

            if (
              cube.x + cube.size - 4 > spikeX &&
              cube.x + 4 < spikeX + spikeW &&
              cube.y + cube.size > spikeY + 6
            ) {
              setGameOver(true);
              playSound('gameover', soundEnabled);
            }
          } else if (obs.type === 'double-spike') {
            const spikeX = screenX;
            const spikeY = GROUND_Y - 24;
            const spikeW = 38;

            if (
              cube.x + cube.size - 4 > spikeX &&
              cube.x + 4 < spikeX + spikeW &&
              cube.y + cube.size > spikeY + 6
            ) {
              setGameOver(true);
              playSound('gameover', soundEnabled);
            }
          } else if (obs.type === 'pad') {
            // Yellow launch pad
            const padX = screenX;
            const padY = GROUND_Y - 8;
            const padW = 26;

            if (
              cube.x + cube.size > padX &&
              cube.x < padX + padW &&
              cube.y + cube.size >= padY
            ) {
              cube.vy = -14.5; // High jump impulse
              playSound('jump', soundEnabled);
            }
          }
        });
      }

      // Render
      // Synth neon background
      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Distant neon grid lines
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 1;
      const bgOffset = (distanceRef.current * 0.4) % 40;
      for (let x = -bgOffset; x < CANVAS_WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GROUND_Y);
        ctx.stroke();
      }

      // Ground Line (Glowing Cyan)
      ctx.strokeStyle = '#06b6d4';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Obstacles
      obstaclesRef.current.forEach((obs) => {
        const screenX = obs.x - distanceRef.current;
        if (screenX < -50 || screenX > CANVAS_WIDTH + 50) return;

        if (obs.type === 'spike') {
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.moveTo(screenX, GROUND_Y);
          ctx.lineTo(screenX + 10, GROUND_Y - 24);
          ctx.lineTo(screenX + 20, GROUND_Y);
          ctx.closePath();
          ctx.fill();
        } else if (obs.type === 'double-spike') {
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.moveTo(screenX, GROUND_Y);
          ctx.lineTo(screenX + 10, GROUND_Y - 24);
          ctx.lineTo(screenX + 19, GROUND_Y);
          ctx.lineTo(screenX + 28, GROUND_Y - 24);
          ctx.lineTo(screenX + 37, GROUND_Y);
          ctx.closePath();
          ctx.fill();
        } else if (obs.type === 'pad') {
          ctx.fillStyle = '#eab308';
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.ellipse(screenX + 13, GROUND_Y - 3, 13, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Draw Cube
      const cube = cubeRef.current;
      ctx.save();
      ctx.translate(cube.x + cube.size / 2, cube.y + cube.size / 2);
      ctx.rotate(cube.rotation);

      // Cube body (Neon Emerald)
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 10;
      ctx.fillRect(-cube.size / 2, -cube.size / 2, cube.size, cube.size);

      // Cube outline & eye square
      ctx.strokeStyle = '#022c22';
      ctx.lineWidth = 2;
      ctx.strokeRect(-cube.size / 2, -cube.size / 2, cube.size, cube.size);

      // Iconic Geometry Dash face
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-4, -6, 8, 5); // visor/eye
      ctx.fillStyle = '#065f46';
      ctx.fillRect(-2, 3, 4, 3); // mouth

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, gameOver, isWon, soundEnabled, bestProgress]);

  return (
    <div className="flex flex-col items-center justify-center p-4 select-none">
      {/* HUD Header */}
      <div className="w-full max-w-[500px] flex items-center justify-between mb-2 text-xs font-mono uppercase tracking-wider text-slate-300">
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="text-slate-400">ATTEMPT:</span>
          <span className="text-emerald-400 font-bold tabular-nums text-sm">{attempts}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">BEST:</span>
          <span className="text-amber-400 font-bold tabular-nums text-sm">{bestProgress}%</span>
        </div>

        <button
          onClick={resetGame}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Restart Level"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-[500px] mb-3 flex items-center gap-2 text-2xs font-mono text-slate-400">
        <span className="w-12">TRACK:</span>
        <div className="flex-1 bg-slate-900 border border-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="w-8 text-right tabular-nums text-emerald-400 font-bold">{progress}%</span>
      </div>

      {/* Canvas */}
      <div
        onClick={jump}
        className="relative border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-950 cursor-pointer"
      >
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block max-w-[500px] w-full" />

        {!isPlaying && !gameOver && !isWon && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xs flex flex-col items-center justify-center p-6 text-center">
            <span className="text-emerald-400 font-extrabold text-xl tracking-wider mb-1 font-mono uppercase">
              TAP OR SPACE TO JUMP
            </span>
            <span className="text-slate-400 text-xs">Jump over spikes and hit yellow booster pads</span>
          </div>
        )}

        {isWon && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-yellow-400 font-extrabold text-2xl tracking-wider mb-1 font-mono uppercase">
              100% COMPLETE!
            </span>
            <p className="text-slate-300 text-sm mb-4">
              Level beaten in <span className="text-emerald-400 font-bold">{attempts}</span> attempts!
            </p>
            <button
              onClick={resetGame}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg uppercase tracking-wider"
            >
              Replay Stage
            </button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-red-500 font-extrabold text-2xl tracking-wider mb-1 font-mono uppercase">
              CRASH AT {progress}%
            </span>
            <button
              onClick={resetGame}
              className="mt-3 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg uppercase tracking-wider shadow-lg"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
