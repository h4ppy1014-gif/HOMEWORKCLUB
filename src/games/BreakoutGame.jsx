import React, { useEffect, useRef, useState, useCallback } from 'react';
import { playSound } from '../utils/audio.js';
import { Play, Pause, RotateCcw, Heart } from 'lucide-react';

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 75;
const PADDLE_HEIGHT = 10;
const BALL_RADIUS = 5;

export const BreakoutGame = ({ soundEnabled = true }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [inPlay, setInPlay] = useState(false);

  const paddleXRef = useRef((CANVAS_WIDTH - PADDLE_WIDTH) / 2);
  const ballRef = useRef({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 30,
    dx: 3.5,
    dy: -3.5,
  });

  const bricksRef = useRef([]);

  const initBricks = useCallback(() => {
    const rows = 5;
    const cols = 8;
    const brickWidth = 50;
    const brickHeight = 16;
    const padding = 6;
    const offsetTop = 45;
    const offsetLeft = 20;

    const rowColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4'];
    const rowPoints = [50, 40, 30, 20, 10];

    const newBricks = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        newBricks.push({
          x: c * (brickWidth + padding) + offsetLeft,
          y: r * (brickHeight + padding) + offsetTop,
          width: brickWidth,
          height: brickHeight,
          color: rowColors[r],
          points: rowPoints[r],
          alive: true,
        });
      }
    }
    bricksRef.current = newBricks;
  }, []);

  const resetGame = useCallback(() => {
    paddleXRef.current = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;
    ballRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 30,
      dx: 3.5 * (Math.random() > 0.5 ? 1 : -1),
      dy: -3.5,
    };
    initBricks();
    setScore(0);
    setLives(3);
    setIsGameOver(false);
    setIsWon(false);
    setIsPaused(false);
    setInPlay(false);
    playSound('click', soundEnabled);
  }, [initBricks, soundEnabled]);

  const launchBall = () => {
    if (!inPlay && !isGameOver && !isWon) {
      setInPlay(true);
      playSound('bounce', soundEnabled);
    }
  };

  useEffect(() => {
    initBricks();
  }, [initBricks]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && !inPlay) {
        launchBall();
        return;
      }

      if (e.key === 'p' || e.key === 'P') {
        setIsPaused((p) => !p);
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        resetGame();
        return;
      }

      const speed = 24;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        paddleXRef.current = Math.max(0, paddleXRef.current - speed);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        paddleXRef.current = Math.min(CANVAS_WIDTH - PADDLE_WIDTH, paddleXRef.current + speed);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inPlay, resetGame]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    paddleXRef.current = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, relativeX - PADDLE_WIDTH / 2));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;

    const loop = () => {
      if (inPlay && !isGameOver && !isWon && !isPaused) {
        const ball = ballRef.current;
        const paddleX = paddleXRef.current;

        ball.x += ball.dx;
        ball.y += ball.dy;

        if (ball.x + BALL_RADIUS > CANVAS_WIDTH || ball.x - BALL_RADIUS < 0) {
          ball.dx = -ball.dx;
          playSound('bounce', soundEnabled);
        }
        if (ball.y - BALL_RADIUS < 0) {
          ball.dy = -ball.dy;
          playSound('bounce', soundEnabled);
        }

        if (
          ball.y + BALL_RADIUS >= CANVAS_HEIGHT - 20 - PADDLE_HEIGHT &&
          ball.y - BALL_RADIUS <= CANVAS_HEIGHT - 20 &&
          ball.x >= paddleX &&
          ball.x <= paddleX + PADDLE_WIDTH
        ) {
          const hitOffset = (ball.x - (paddleX + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);
          ball.dx = hitOffset * 4.5;
          ball.dy = -Math.abs(ball.dy);
          playSound('bounce', soundEnabled);
        }

        if (ball.y + BALL_RADIUS > CANVAS_HEIGHT) {
          playSound('hit', soundEnabled);
          setLives((l) => {
            const nextLives = l - 1;
            if (nextLives <= 0) {
              setIsGameOver(true);
              playSound('gameover', soundEnabled);
            } else {
              setInPlay(false);
              ballRef.current = {
                x: paddleX + PADDLE_WIDTH / 2,
                y: CANVAS_HEIGHT - 30,
                dx: 3.5 * (Math.random() > 0.5 ? 1 : -1),
                dy: -3.5,
              };
            }
            return nextLives;
          });
        }

        let remainingBricks = 0;
        bricksRef.current.forEach((brick) => {
          if (!brick.alive) return;
          remainingBricks++;

          if (
            ball.x + BALL_RADIUS > brick.x &&
            ball.x - BALL_RADIUS < brick.x + brick.width &&
            ball.y + BALL_RADIUS > brick.y &&
            ball.y - BALL_RADIUS < brick.y + brick.height
          ) {
            brick.alive = false;
            ball.dy = -ball.dy;
            setScore((s) => s + brick.points);
            playSound('coin', soundEnabled);
          }
        });

        if (remainingBricks === 0) {
          setIsWon(true);
          playSound('powerup', soundEnabled);
        }
      }

      if (!inPlay) {
        ballRef.current.x = paddleXRef.current + PADDLE_WIDTH / 2;
        ballRef.current.y = CANVAS_HEIGHT - 25;
      }

      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      bricksRef.current.forEach((brick) => {
        if (!brick.alive) return;
        ctx.fillStyle = brick.color;
        ctx.shadowColor = brick.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
      });

      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(paddleXRef.current, CANVAS_HEIGHT - 20, PADDLE_WIDTH, PADDLE_HEIGHT, 5);
      ctx.fill();

      const ball = ballRef.current;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [inPlay, isGameOver, isWon, isPaused, soundEnabled]);

  return (
    <div className="flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-[480px] flex items-center justify-between mb-3 text-xs font-mono uppercase tracking-wider text-slate-300">
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="text-slate-400">SCORE:</span>
          <span className="text-cyan-400 font-bold tabular-nums text-sm">{score}</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="text-slate-400 mr-1">LIVES:</span>
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              className={`w-3.5 h-3.5 ${i < lives ? 'text-red-500 fill-red-500' : 'text-slate-700'}`}
            />
          ))}
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

      <div
        onClick={launchBall}
        className="relative border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-950 cursor-pointer"
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseMove={handleMouseMove}
          className="block max-w-[480px] w-full"
        />

        {!inPlay && !isGameOver && !isWon && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xs flex flex-col items-center justify-center p-6 text-center">
            <span className="text-cyan-400 font-bold text-lg tracking-wider mb-1 font-mono uppercase">
              Click or Space to Launch
            </span>
            <span className="text-slate-400 text-xs">Move mouse or arrow keys to steer</span>
          </div>
        )}

        {isWon && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-emerald-400 font-extrabold text-2xl tracking-wider mb-1 font-mono uppercase">
              STAGE CLEARED!
            </span>
            <p className="text-slate-300 text-sm mb-4">
              Final Score: <span className="text-cyan-400 font-bold tabular-nums">{score}</span>
            </p>
            <button
              onClick={resetGame}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg uppercase tracking-wider"
            >
              Play Again
            </button>
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-red-500 font-extrabold text-2xl tracking-wider mb-1 font-mono uppercase">
              PADDLE DESTROYED
            </span>
            <p className="text-slate-300 text-sm mb-4">
              Final Score: <span className="text-cyan-400 font-bold tabular-nums">{score}</span>
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
    </div>
  );
};
