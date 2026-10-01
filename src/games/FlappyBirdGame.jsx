import React, { useEffect, useRef, useState, useCallback } from 'react';
import { playSound } from '../utils/audio.js';
import { RotateCcw, Trophy } from 'lucide-react';

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 480;
const GRAVITY = 0.38;
const JUMP_FORCE = -6.8;
const PIPE_SPEED = 2.4;
const PIPE_SPAWN_INTERVAL = 110;
const PIPE_GAP = 125;
const PIPE_WIDTH = 52;

export const FlappyBirdGame = ({ soundEnabled = true }) => {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('unblockzone_flappy_high') || '0', 10);
  });

  const birdRef = useRef({
    y: CANVAS_HEIGHT / 2,
    velocity: 0,
    radius: 13,
    rotation: 0,
  });

  const pipesRef = useRef([]);
  const frameCountRef = useRef(0);
  const scoreRef = useRef(0);
  scoreRef.current = score;

  const flap = useCallback(() => {
    if (gameOver) {
      resetGame();
      return;
    }
    if (!isPlaying) {
      setIsPlaying(true);
    }
    birdRef.current.velocity = JUMP_FORCE;
    playSound('jump', soundEnabled);
  }, [gameOver, isPlaying, soundEnabled]);

  const resetGame = () => {
    birdRef.current = {
      y: CANVAS_HEIGHT / 2,
      velocity: 0,
      radius: 13,
      rotation: 0,
    };
    pipesRef.current = [];
    frameCountRef.current = 0;
    setScore(0);
    setGameOver(false);
    setIsPlaying(false);
    playSound('click', soundEnabled);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;

    const loop = () => {
      if (isPlaying && !gameOver) {
        frameCountRef.current++;
        const bird = birdRef.current;
        bird.velocity += GRAVITY;
        bird.y += bird.velocity;
        bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 5, bird.velocity * 0.08));

        if (bird.y + bird.radius >= CANVAS_HEIGHT - 35) {
          bird.y = CANVAS_HEIGHT - 35 - bird.radius;
          setGameOver(true);
          playSound('gameover', soundEnabled);
        } else if (bird.y - bird.radius <= 0) {
          bird.y = bird.radius;
          bird.velocity = 0;
        }

        if (frameCountRef.current % PIPE_SPAWN_INTERVAL === 0) {
          const minPipe = 50;
          const maxPipe = CANVAS_HEIGHT - 35 - PIPE_GAP - minPipe;
          const topHeight = Math.floor(Math.random() * (maxPipe - minPipe)) + minPipe;
          const bottomHeight = CANVAS_HEIGHT - 35 - (topHeight + PIPE_GAP);

          pipesRef.current.push({
            x: CANVAS_WIDTH,
            topHeight,
            bottomHeight,
            passed: false,
          });
        }

        pipesRef.current.forEach((pipe) => {
          pipe.x -= PIPE_SPEED;

          if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.radius + 60) {
            pipe.passed = true;
            setScore((s) => {
              const newScore = s + 1;
              if (newScore > highScore) {
                setHighScore(newScore);
                localStorage.setItem('unblockzone_flappy_high', newScore.toString());
              }
              return newScore;
            });
            playSound('coin', soundEnabled);
          }

          const birdX = 60;
          if (birdX + bird.radius > pipe.x && birdX - bird.radius < pipe.x + PIPE_WIDTH) {
            if (bird.y - bird.radius < pipe.topHeight || bird.y + bird.radius > CANVAS_HEIGHT - 35 - pipe.bottomHeight) {
              setGameOver(true);
              playSound('gameover', soundEnabled);
            }
          }
        });

        pipesRef.current = pipesRef.current.filter((p) => p.x + PIPE_WIDTH > -20);
      }

      // Background Sky
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      bgGrad.addColorStop(0, '#0c4a6e');
      bgGrad.addColorStop(0.7, '#0284c7');
      bgGrad.addColorStop(1, '#38bdf8');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(80, 70, 30, 0, Math.PI * 2);
      ctx.arc(120, 65, 40, 0, Math.PI * 2);
      ctx.arc(160, 70, 30, 0, Math.PI * 2);
      ctx.fill();

      // Pipes
      pipesRef.current.forEach((pipe) => {
        const pipeGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
        pipeGrad.addColorStop(0, '#15803d');
        pipeGrad.addColorStop(0.35, '#22c55e');
        pipeGrad.addColorStop(0.7, '#16a34a');
        pipeGrad.addColorStop(1, '#14532d');

        ctx.fillStyle = pipeGrad;
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        ctx.fillRect(pipe.x - 3, pipe.topHeight - 18, PIPE_WIDTH + 6, 18);
        ctx.strokeStyle = '#052e16';
        ctx.lineWidth = 2;
        ctx.strokeRect(pipe.x - 3, pipe.topHeight - 18, PIPE_WIDTH + 6, 18);

        const botY = CANVAS_HEIGHT - 35 - pipe.bottomHeight;
        ctx.fillRect(pipe.x, botY, PIPE_WIDTH, pipe.bottomHeight);
        ctx.fillRect(pipe.x - 3, botY, PIPE_WIDTH + 6, 18);
        ctx.strokeRect(pipe.x - 3, botY, PIPE_WIDTH + 6, 18);
      });

      // Ground
      ctx.fillStyle = '#166534';
      ctx.fillRect(0, CANVAS_HEIGHT - 35, CANVAS_WIDTH, 35);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(0, CANVAS_HEIGHT - 35, CANVAS_WIDTH, 6);

      // Bird
      const bird = birdRef.current;
      const birdX = 60;

      ctx.save();
      ctx.translate(birdX, bird.y);
      ctx.rotate(bird.rotation);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#78350f';
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(-4, 2, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(5, -4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(6, -4, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(17, 3);
      ctx.lineTo(9, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, gameOver, soundEnabled, highScore]);

  return (
    <div className="flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-[360px] flex items-center justify-between mb-3 text-xs font-mono uppercase tracking-wider text-slate-300">
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="text-slate-400">SCORE:</span>
          <span className="text-yellow-400 font-bold tabular-nums text-sm">{score}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">BEST:</span>
          <span className="text-amber-400 font-bold tabular-nums text-sm">{highScore}</span>
        </div>

        <button
          onClick={resetGame}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Restart"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div
        onClick={flap}
        className="relative border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-950 cursor-pointer active:scale-[0.99] transition-transform"
      >
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block max-w-[360px] w-full" />

        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xs flex flex-col items-center justify-center p-6 text-center">
            <span className="text-white font-extrabold text-xl tracking-wider mb-2 font-mono drop-shadow-md">
              TAP OR PRESS SPACE
            </span>
            <span className="text-slate-200 text-xs">Flap wings to stay airborne</span>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-red-500 font-extrabold text-2xl tracking-wider mb-1 font-mono uppercase">
              FLIGHT CRASH
            </span>
            <p className="text-slate-300 text-sm mb-4">
              Pipes Cleared: <span className="text-yellow-400 font-bold tabular-nums">{score}</span>
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetGame();
              }}
              className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs rounded-lg uppercase tracking-wider shadow-lg"
            >
              Fly Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
