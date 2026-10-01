import React, { useEffect, useRef, useState, useCallback } from 'react';
import { playSound } from '../utils/audio.js';
import { Play, Pause, RotateCcw, Trophy } from 'lucide-react';

const GRID_SIZE = 20;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;

export const SnakeGame = ({ soundEnabled = true }) => {
  const canvasRef = useRef(null);
  const [snake, setSnake] = useState([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const [direction, setDirection] = useState('UP');
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [goldenFood, setGoldenFood] = useState(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('unblockzone_snake_high') || '0', 10);
  });
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const directionRef = useRef(direction);
  directionRef.current = direction;

  const generateFood = useCallback((currentSnake) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
        y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)),
      };
      const collision = currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y);
      if (!collision) break;
    }
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    setSnake(initialSnake);
    setDirection('UP');
    directionRef.current = 'UP';
    setFood(generateFood(initialSnake));
    setGoldenFood(null);
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    playSound('click', soundEnabled);
  }, [generateFood, soundEnabled]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'p' || e.key === 'P' || e.key === ' ') {
        if (!isGameOver) {
          setIsPaused((prev) => !prev);
        }
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        resetGame();
        return;
      }

      const curDir = directionRef.current;
      if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && curDir !== 'DOWN') {
        setDirection('UP');
      } else if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && curDir !== 'UP') {
        setDirection('DOWN');
      } else if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && curDir !== 'RIGHT') {
        setDirection('LEFT');
      } else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && curDir !== 'LEFT') {
        setDirection('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver, resetGame]);

  // Game Loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const speed = Math.max(75, 140 - Math.floor(score / 5) * 6);

    const interval = setInterval(() => {
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };
        const dir = directionRef.current;

        if (dir === 'UP') head.y -= 1;
        if (dir === 'DOWN') head.y += 1;
        if (dir === 'LEFT') head.x -= 1;
        if (dir === 'RIGHT') head.x += 1;

        const maxTilesX = CANVAS_WIDTH / GRID_SIZE;
        const maxTilesY = CANVAS_HEIGHT / GRID_SIZE;
        if (head.x < 0 || head.x >= maxTilesX || head.y < 0 || head.y >= maxTilesY) {
          setIsGameOver(true);
          playSound('gameover', soundEnabled);
          return prevSnake;
        }

        for (let i = 0; i < prevSnake.length; i++) {
          if (head.x === prevSnake[i].x && head.y === prevSnake[i].y) {
            setIsGameOver(true);
            playSound('gameover', soundEnabled);
            return prevSnake;
          }
        }

        const newSnake = [head, ...prevSnake];

        if (head.x === food.x && head.y === food.y) {
          playSound('coin', soundEnabled);
          setScore((s) => {
            const newScore = s + 10;
            if (newScore > highScore) {
              setHighScore(newScore);
              localStorage.setItem('unblockzone_snake_high', newScore.toString());
            }
            return newScore;
          });
          setFood(generateFood(newSnake));

          if (Math.random() < 0.25 && !goldenFood) {
            setGoldenFood(generateFood(newSnake));
          }
        } else if (goldenFood && head.x === goldenFood.x && head.y === goldenFood.y) {
          playSound('powerup', soundEnabled);
          setScore((s) => {
            const newScore = s + 50;
            if (newScore > highScore) {
              setHighScore(newScore);
              localStorage.setItem('unblockzone_snake_high', newScore.toString());
            }
            return newScore;
          });
          setGoldenFood(null);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [food, goldenFood, generateFood, isGameOver, isPaused, score, highScore, soundEnabled]);

  // Canvas Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = '#151d2f';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Food (Ruby)
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(
      food.x * GRID_SIZE + GRID_SIZE / 2,
      food.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Golden Food
    if (goldenFood) {
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(
        goldenFood.x * GRID_SIZE + GRID_SIZE / 2,
        goldenFood.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 - 1,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Snake Body
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      if (isHead) {
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 12;
      } else {
        ctx.fillStyle = index % 2 === 0 ? '#059669' : '#047857';
        ctx.shadowBlur = 4;
      }

      ctx.beginPath();
      ctx.roundRect(
        segment.x * GRID_SIZE + 1.5,
        segment.y * GRID_SIZE + 1.5,
        GRID_SIZE - 3,
        GRID_SIZE - 3,
        isHead ? 6 : 4
      );
      ctx.fill();

      // Eyes
      if (isHead) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        const curDir = directionRef.current;
        let eye1 = { x: segment.x * GRID_SIZE + 5, y: segment.y * GRID_SIZE + 5 };
        let eye2 = { x: segment.x * GRID_SIZE + 15, y: segment.y * GRID_SIZE + 5 };

        if (curDir === 'DOWN') {
          eye1 = { x: segment.x * GRID_SIZE + 5, y: segment.y * GRID_SIZE + 15 };
          eye2 = { x: segment.x * GRID_SIZE + 15, y: segment.y * GRID_SIZE + 15 };
        } else if (curDir === 'LEFT') {
          eye1 = { x: segment.x * GRID_SIZE + 5, y: segment.y * GRID_SIZE + 5 };
          eye2 = { x: segment.x * GRID_SIZE + 5, y: segment.y * GRID_SIZE + 15 };
        } else if (curDir === 'RIGHT') {
          eye1 = { x: segment.x * GRID_SIZE + 15, y: segment.y * GRID_SIZE + 5 };
          eye2 = { x: segment.x * GRID_SIZE + 15, y: segment.y * GRID_SIZE + 15 };
        }

        ctx.beginPath();
        ctx.arc(eye1.x, eye1.y, 2, 0, Math.PI * 2);
        ctx.arc(eye2.x, eye2.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.shadowBlur = 0;
  }, [snake, food, goldenFood]);

  return (
    <div className="flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-[400px] flex items-center justify-between mb-3 px-1 text-xs font-mono uppercase tracking-wider text-slate-300">
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="text-slate-400">SCORE:</span>
          <span className="text-emerald-400 font-bold tabular-nums text-sm">{score}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">BEST:</span>
          <span className="text-amber-400 font-bold tabular-nums text-sm">{highScore}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Pause / Resume"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={resetGame}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Restart"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-950">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block w-full max-w-[400px] aspect-square" />

        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-red-500 font-extrabold text-2xl tracking-wider mb-1 font-mono uppercase">
              Game Over
            </span>
            <p className="text-slate-300 text-sm mb-4">
              Final Score: <span className="text-emerald-400 font-bold tabular-nums">{score}</span>
            </p>
            <button
              onClick={resetGame}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg uppercase tracking-wider shadow-lg transition-transform active:scale-95"
            >
              Play Again
            </button>
          </div>
        )}

        {isPaused && !isGameOver && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <span className="text-amber-400 font-bold text-xl tracking-wider mb-2 font-mono uppercase">
              Paused
            </span>
            <button
              onClick={() => setIsPaused(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg uppercase transition-colors"
            >
              Resume
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 w-48 max-w-full md:hidden">
        <div />
        <button
          onClick={() => {
            if (directionRef.current !== 'DOWN') setDirection('UP');
          }}
          className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 active:bg-slate-800 text-center font-bold"
        >
          ▲
        </button>
        <div />
        <button
          onClick={() => {
            if (directionRef.current !== 'RIGHT') setDirection('LEFT');
          }}
          className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 active:bg-slate-800 text-center font-bold"
        >
          ◀
        </button>
        <button
          onClick={() => {
            if (directionRef.current !== 'UP') setDirection('DOWN');
          }}
          className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 active:bg-slate-800 text-center font-bold"
        >
          ▼
        </button>
        <button
          onClick={() => {
            if (directionRef.current !== 'LEFT') setDirection('RIGHT');
          }}
          className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 active:bg-slate-800 text-center font-bold"
        >
          ▶
        </button>
      </div>
    </div>
  );
};
