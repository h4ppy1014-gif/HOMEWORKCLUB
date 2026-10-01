import React, { useEffect, useRef, useState, useCallback } from 'react';
import { playSound } from '../utils/audio.js';
import { RotateCcw, Users, User } from 'lucide-react';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 340;
const PADDLE_HEIGHT = 60;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 8;
const WINNING_SCORE = 7;

export const PongGame = ({ soundEnabled = true }) => {
  const canvasRef = useRef(null);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [gameMode, setGameMode] = useState('1P');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [winner, setWinner] = useState(null);
  const [inPlay, setInPlay] = useState(false);

  const paddle1YRef = useRef((CANVAS_HEIGHT - PADDLE_HEIGHT) / 2);
  const paddle2YRef = useRef((CANVAS_HEIGHT - PADDLE_HEIGHT) / 2);
  const ballRef = useRef({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    dx: 4,
    dy: 2,
    speed: 4.5,
  });

  const keysRef = useRef({
    w: false,
    s: false,
    up: false,
    down: false,
  });

  const resetGame = useCallback(() => {
    setScore1(0);
    setScore2(0);
    setWinner(null);
    setInPlay(false);
    paddle1YRef.current = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;
    paddle2YRef.current = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;
    ballRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx: 4 * (Math.random() > 0.5 ? 1 : -1),
      dy: (Math.random() * 2 - 1) * 3,
      speed: 4.5,
    };
    playSound('click', soundEnabled);
  }, [soundEnabled]);

  const serveBall = useCallback(
    (scoringPlayer) => {
      setInPlay(false);
      paddle1YRef.current = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;
      paddle2YRef.current = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;
      ballRef.current = {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        dx: scoringPlayer === 1 ? -4 : 4,
        dy: (Math.random() * 2 - 1) * 3,
        speed: 4.5,
      };
    },
    []
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && !inPlay && !winner) {
        setInPlay(true);
        playSound('bounce', soundEnabled);
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        resetGame();
        return;
      }

      if (e.key === 'w' || e.key === 'W') keysRef.current.w = true;
      if (e.key === 's' || e.key === 'S') keysRef.current.s = true;
      if (e.key === 'ArrowUp') keysRef.current.up = true;
      if (e.key === 'ArrowDown') keysRef.current.down = true;
    };

    const handleKeyUp = (e) => {
      if (e.key === 'w' || e.key === 'W') keysRef.current.w = false;
      if (e.key === 's' || e.key === 'S') keysRef.current.s = false;
      if (e.key === 'ArrowUp') keysRef.current.up = false;
      if (e.key === 'ArrowDown') keysRef.current.down = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [inPlay, winner, resetGame, soundEnabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;

    const loop = () => {
      if (inPlay && !winner) {
        const ball = ballRef.current;
        const p1 = paddle1YRef.current;
        const p2 = paddle2YRef.current;

        const pSpeed = 6;
        if (keysRef.current.w) paddle1YRef.current = Math.max(0, p1 - pSpeed);
        if (keysRef.current.s) paddle1YRef.current = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, p1 + pSpeed);

        if (gameMode === '2P') {
          if (keysRef.current.up) paddle2YRef.current = Math.max(0, p2 - pSpeed);
          if (keysRef.current.down) paddle2YRef.current = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, p2 + pSpeed);
        } else {
          const targetY = ball.y - PADDLE_HEIGHT / 2;
          const aiSpeed = difficulty === 'EASY' ? 2.8 : difficulty === 'MEDIUM' ? 4.2 : 5.8;
          if (p2 < targetY - 4) {
            paddle2YRef.current = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, p2 + aiSpeed);
          } else if (p2 > targetY + 4) {
            paddle2YRef.current = Math.max(0, p2 - aiSpeed);
          }
        }

        ball.x += ball.dx;
        ball.y += ball.dy;

        if (ball.y <= 0 || ball.y + BALL_SIZE >= CANVAS_HEIGHT) {
          ball.dy = -ball.dy;
          playSound('bounce', soundEnabled);
        }

        if (
          ball.x <= 25 + PADDLE_WIDTH &&
          ball.x >= 25 &&
          ball.y + BALL_SIZE >= paddle1YRef.current &&
          ball.y <= paddle1YRef.current + PADDLE_HEIGHT
        ) {
          const hit = (ball.y + BALL_SIZE / 2 - (paddle1YRef.current + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
          ball.speed = Math.min(10, ball.speed + 0.3);
          ball.dx = Math.abs(ball.speed);
          ball.dy = hit * 5;
          ball.x = 25 + PADDLE_WIDTH + 1;
          playSound('hit', soundEnabled);
        }

        const p2X = CANVAS_WIDTH - 25 - PADDLE_WIDTH;
        if (
          ball.x + BALL_SIZE >= p2X &&
          ball.x <= p2X + PADDLE_WIDTH &&
          ball.y + BALL_SIZE >= paddle2YRef.current &&
          ball.y <= paddle2YRef.current + PADDLE_HEIGHT
        ) {
          const hit = (ball.y + BALL_SIZE / 2 - (paddle2YRef.current + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
          ball.speed = Math.min(10, ball.speed + 0.3);
          ball.dx = -Math.abs(ball.speed);
          ball.dy = hit * 5;
          ball.x = p2X - BALL_SIZE - 1;
          playSound('hit', soundEnabled);
        }

        if (ball.x < 0) {
          playSound('score', soundEnabled);
          setScore2((s) => {
            const next = s + 1;
            if (next >= WINNING_SCORE) {
              setWinner(gameMode === '1P' ? 'CPU' : 'PLAYER 2');
              playSound('gameover', soundEnabled);
            } else {
              serveBall(2);
            }
            return next;
          });
        } else if (ball.x > CANVAS_WIDTH) {
          playSound('score', soundEnabled);
          setScore1((s) => {
            const next = s + 1;
            if (next >= WINNING_SCORE) {
              setWinner('PLAYER 1');
              playSound('powerup', soundEnabled);
            } else {
              serveBall(1);
            }
            return next;
          });
        }
      }

      ctx.fillStyle = '#060b13';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(25, paddle1YRef.current, PADDLE_WIDTH, PADDLE_HEIGHT, 4);
      ctx.fill();

      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#22d3ee';
      ctx.beginPath();
      ctx.roundRect(CANVAS_WIDTH - 25 - PADDLE_WIDTH, paddle2YRef.current, PADDLE_WIDTH, PADDLE_HEIGHT, 4);
      ctx.fill();

      const ball = ballRef.current;
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.fillRect(ball.x, ball.y, BALL_SIZE, BALL_SIZE);

      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [inPlay, winner, gameMode, difficulty, serveBall, soundEnabled]);

  return (
    <div className="flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-[500px] flex items-center justify-between mb-3 text-xs font-mono uppercase tracking-wider text-slate-300">
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => {
              setGameMode('1P');
              resetGame();
            }}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
              gameMode === '1P' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3 h-3" /> 1P vs CPU
          </button>
          <button
            onClick={() => {
              setGameMode('2P');
              resetGame();
            }}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
              gameMode === '2P' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3 h-3" /> 2P Local
          </button>
        </div>

        {gameMode === '1P' && (
          <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-2xs">
            {['EASY', 'MEDIUM', 'HARD'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setDifficulty(lvl)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  difficulty === lvl ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={resetGame}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="w-full max-w-[500px] flex items-center justify-around mb-2 text-2xl font-mono font-black text-slate-100">
        <span className="text-emerald-400">{score1}</span>
        <span className="text-slate-700 text-lg">TO 7</span>
        <span className="text-cyan-400">{score2}</span>
      </div>

      <div
        onClick={() => {
          if (!inPlay && !winner) {
            setInPlay(true);
            playSound('bounce', soundEnabled);
          }
        }}
        className="relative border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-950 cursor-pointer"
      >
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block max-w-[500px] w-full" />

        {!inPlay && !winner && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xs flex flex-col items-center justify-center p-6 text-center">
            <span className="text-white font-bold text-lg tracking-wider mb-1 font-mono uppercase">
              Click or Space to Serve
            </span>
            <span className="text-slate-400 text-xs">P1: W/S · P2: Up/Down</span>
          </div>
        )}

        {winner && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-amber-400 font-extrabold text-2xl tracking-wider mb-1 font-mono uppercase">
              {winner} WINS!
            </span>
            <p className="text-slate-300 text-sm mb-4">
              Match ended {score1} - {score2}
            </p>
            <button
              onClick={resetGame}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg uppercase tracking-wider shadow-lg"
            >
              Rematch
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
