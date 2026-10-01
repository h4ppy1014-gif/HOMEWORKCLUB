import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from '../utils/audio.js';
import { Play, Pause, RotateCcw, Trophy } from 'lucide-react';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 20;

const TETROMINOES = {
  I: { shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], color: '#06b6d4' },
  J: { shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], color: '#3b82f6' },
  L: { shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], color: '#f97316' },
  O: { shape: [[1, 1], [1, 1]], color: '#eab308' },
  S: { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], color: '#22c55e' },
  T: { shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], color: '#a855f7' },
  Z: { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], color: '#ef4444' },
};

const PIECE_KEYS = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

function createEmptyGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function getRandomPiece() {
  const key = PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
  return {
    key,
    shape: TETROMINOES[key].shape,
    color: TETROMINOES[key].color,
    x: Math.floor(COLS / 2) - Math.floor(TETROMINOES[key].shape[0].length / 2),
    y: 0,
  };
}

export const TetroBlocksGame = ({ soundEnabled = true }) => {
  const canvasRef = useRef(null);
  const [grid, setGrid] = useState(createEmptyGrid);
  const [currentPiece, setCurrentPiece] = useState(getRandomPiece);
  const [nextPiece, setNextPiece] = useState(getRandomPiece);
  const [holdPiece, setHoldPiece] = useState(null);
  const [canHold, setCanHold] = useState(true);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('unblockzone_tetris_high') || '0', 10);
  });
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const pieceRef = useRef(currentPiece);
  pieceRef.current = currentPiece;
  const gridRef = useRef(grid);
  gridRef.current = grid;

  const checkCollision = useCallback((piece, board, offsetX = 0, offsetY = 0) => {
    const shape = piece.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const newX = piece.x + c + offsetX;
          const newY = piece.y + r + offsetY;

          if (newX < 0 || newX >= COLS || newY >= ROWS) {
            return true;
          }
          if (newY >= 0 && board[newY][newX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  const rotatePiece = (matrix) => {
    const N = matrix.length;
    return matrix[0].map((_, i) => matrix.map((row) => row[i]).reverse());
  };

  const mergePiece = useCallback(() => {
    const piece = pieceRef.current;
    const board = gridRef.current.map((row) => [...row]);
    const shape = piece.shape;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const by = piece.y + r;
          const bx = piece.x + c;
          if (by < 0) {
            setIsGameOver(true);
            playSound('gameover', soundEnabled);
            return;
          }
          board[by][bx] = piece.color;
        }
      }
    }

    // Check line clears
    let cleared = 0;
    const newBoard = board.filter((row) => {
      const full = row.every((cell) => cell !== 0);
      if (full) cleared++;
      return !full;
    });

    while (newBoard.length < ROWS) {
      newBoard.unshift(Array(COLS).fill(0));
    }

    if (cleared > 0) {
      const points = [0, 100, 300, 500, 800][cleared] * level;
      playSound('coin', soundEnabled);
      setScore((s) => {
        const next = s + points;
        if (next > highScore) {
          setHighScore(next);
          localStorage.setItem('unblockzone_tetris_high', next.toString());
        }
        return next;
      });
      setLines((l) => {
        const nextL = l + cleared;
        setLevel(Math.floor(nextL / 10) + 1);
        return nextL;
      });
    } else {
      playSound('hit', soundEnabled);
    }

    setGrid(newBoard);
    const next = nextPiece;
    if (checkCollision(next, newBoard)) {
      setIsGameOver(true);
      playSound('gameover', soundEnabled);
    } else {
      setCurrentPiece(next);
      setNextPiece(getRandomPiece());
      setCanHold(true);
    }
  }, [checkCollision, level, nextPiece, highScore, soundEnabled]);

  const moveLeft = useCallback(() => {
    if (!checkCollision(pieceRef.current, gridRef.current, -1, 0)) {
      setCurrentPiece((p) => ({ ...p, x: p.x - 1 }));
    }
  }, [checkCollision]);

  const moveRight = useCallback(() => {
    if (!checkCollision(pieceRef.current, gridRef.current, 1, 0)) {
      setCurrentPiece((p) => ({ ...p, x: p.x + 1 }));
    }
  }, [checkCollision]);

  const rotate = useCallback(() => {
    const rotatedShape = rotatePiece(pieceRef.current.shape);
    const candidate = { ...pieceRef.current, shape: rotatedShape };

    // Standard wall kicks
    if (!checkCollision(candidate, gridRef.current, 0, 0)) {
      setCurrentPiece(candidate);
      playSound('click', soundEnabled);
    } else if (!checkCollision(candidate, gridRef.current, -1, 0)) {
      setCurrentPiece({ ...candidate, x: candidate.x - 1 });
      playSound('click', soundEnabled);
    } else if (!checkCollision(candidate, gridRef.current, 1, 0)) {
      setCurrentPiece({ ...candidate, x: candidate.x + 1 });
      playSound('click', soundEnabled);
    }
  }, [checkCollision, soundEnabled]);

  const drop = useCallback(() => {
    if (!checkCollision(pieceRef.current, gridRef.current, 0, 1)) {
      setCurrentPiece((p) => ({ ...p, y: p.y + 1 }));
    } else {
      mergePiece();
    }
  }, [checkCollision, mergePiece]);

  const hardDrop = useCallback(() => {
    let offset = 0;
    while (!checkCollision(pieceRef.current, gridRef.current, 0, offset + 1)) {
      offset++;
    }
    setCurrentPiece((p) => ({ ...p, y: p.y + offset }));
    setTimeout(mergePiece, 10);
  }, [checkCollision, mergePiece]);

  const handleHold = useCallback(() => {
    if (!canHold) return;
    const currentKey = pieceRef.current.key;
    if (holdPiece === null) {
      setHoldPiece(currentKey);
      setCurrentPiece(nextPiece);
      setNextPiece(getRandomPiece());
    } else {
      setHoldPiece(currentKey);
      const held = {
        key: holdPiece,
        shape: TETROMINOES[holdPiece].shape,
        color: TETROMINOES[holdPiece].color,
        x: Math.floor(COLS / 2) - Math.floor(TETROMINOES[holdPiece].shape[0].length / 2),
        y: 0,
      };
      setCurrentPiece(held);
    }
    setCanHold(false);
    playSound('click', soundEnabled);
  }, [canHold, holdPiece, nextPiece, soundEnabled]);

  const resetGame = useCallback(() => {
    setGrid(createEmptyGrid());
    setCurrentPiece(getRandomPiece());
    setNextPiece(getRandomPiece());
    setHoldPiece(null);
    setCanHold(true);
    setScore(0);
    setLines(0);
    setLevel(1);
    setIsGameOver(false);
    setIsPaused(false);
    playSound('click', soundEnabled);
  }, [soundEnabled]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (isGameOver) {
        if (e.key === 'r' || e.key === 'R') resetGame();
        return;
      }

      if (e.key === 'p' || e.key === 'P') {
        setIsPaused((p) => !p);
        return;
      }

      if (isPaused) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') moveLeft();
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') moveRight();
      else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') rotate();
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') drop();
      else if (e.key === ' ') hardDrop();
      else if (e.key === 'c' || e.key === 'C' || e.key === 'Shift') handleHold();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver, isPaused, moveLeft, moveRight, rotate, drop, hardDrop, handleHold, resetGame]);

  // Drop Interval
  useEffect(() => {
    if (isGameOver || isPaused) return;
    const speed = Math.max(90, 800 - (level - 1) * 70);
    const interval = setInterval(drop, speed);
    return () => clearInterval(interval);
  }, [drop, isGameOver, isPaused, level]);

  // Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);

    // Subtle grid lines
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * BLOCK_SIZE, 0);
      ctx.lineTo(c * BLOCK_SIZE, ROWS * BLOCK_SIZE);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * BLOCK_SIZE);
      ctx.lineTo(COLS * BLOCK_SIZE, r * BLOCK_SIZE);
      ctx.stroke();
    }

    // Draw Locked Grid
    grid.forEach((row, r) => {
      row.forEach((color, c) => {
        if (color !== 0) {
          ctx.fillStyle = color;
          ctx.fillRect(c * BLOCK_SIZE + 1, r * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.strokeRect(c * BLOCK_SIZE + 1, r * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
        }
      });
    });

    // Draw Ghost Piece
    if (currentPiece && !isGameOver) {
      let ghostOffset = 0;
      while (!checkCollision(currentPiece, grid, 0, ghostOffset + 1)) {
        ghostOffset++;
      }
      ctx.strokeStyle = currentPiece.color;
      ctx.lineWidth = 1.5;
      currentPiece.shape.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell !== 0) {
            const gx = (currentPiece.x + c) * BLOCK_SIZE + 2;
            const gy = (currentPiece.y + ghostOffset + r) * BLOCK_SIZE + 2;
            ctx.strokeRect(gx, gy, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
          }
        });
      });

      // Draw Active Piece
      ctx.fillStyle = currentPiece.color;
      currentPiece.shape.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell !== 0) {
            const px = (currentPiece.x + c) * BLOCK_SIZE + 1;
            const py = (currentPiece.y + r) * BLOCK_SIZE + 1;
            ctx.fillRect(px, py, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.strokeRect(px, py, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
          }
        });
      });
    }
  }, [grid, currentPiece, isGameOver, checkCollision]);

  return (
    <div className="flex flex-col items-center justify-center p-4 select-none">
      <div className="flex items-start gap-4">
        {/* Hold Piece Box */}
        <div className="hidden sm:flex flex-col items-center bg-slate-900 border border-slate-800 p-2.5 rounded-xl w-24">
          <span className="text-2xs font-mono uppercase text-slate-400 mb-2">HOLD (C)</span>
          <div className="w-16 h-16 flex items-center justify-center bg-slate-950 border border-slate-800 rounded-lg">
            {holdPiece && (
              <div
                className="grid gap-0.5"
                style={{
                  gridTemplateColumns: `repeat(${TETROMINOES[holdPiece].shape[0].length}, minmax(0, 1fr))`,
                }}
              >
                {TETROMINOES[holdPiece].shape.map((row, r) =>
                  row.map((cell, c) => (
                    <div
                      key={`${r}-${c}`}
                      className={`w-3.5 h-3.5 rounded-xs ${
                        cell ? '' : 'opacity-0'
                      }`}
                      style={{ backgroundColor: TETROMINOES[holdPiece].color }}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Game Canvas */}
        <div className="flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2 text-xs font-mono uppercase text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
              <span className="text-slate-400">SCORE:</span>
              <span className="text-cyan-400 font-bold tabular-nums text-sm">{score}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsPaused((p) => !p)}
                className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={resetGame}
                className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="relative border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-950">
            <canvas ref={canvasRef} width={COLS * BLOCK_SIZE} height={ROWS * BLOCK_SIZE} className="block" />

            {isGameOver && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <span className="text-red-500 font-black text-2xl font-mono uppercase mb-1">
                  BLOCK LOCK
                </span>
                <p className="text-slate-300 text-sm mb-4">
                  Final Score: <span className="text-cyan-400 font-bold">{score}</span>
                </p>
                <button
                  onClick={resetGame}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg uppercase tracking-wider shadow-lg"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Next Piece & Stats Box */}
        <div className="hidden sm:flex flex-col gap-3">
          <div className="flex flex-col items-center bg-slate-900 border border-slate-800 p-2.5 rounded-xl w-24">
            <span className="text-2xs font-mono uppercase text-slate-400 mb-2">NEXT</span>
            <div className="w-16 h-16 flex items-center justify-center bg-slate-950 border border-slate-800 rounded-lg">
              <div
                className="grid gap-0.5"
                style={{
                  gridTemplateColumns: `repeat(${nextPiece.shape[0].length}, minmax(0, 1fr))`,
                }}
              >
                {nextPiece.shape.map((row, r) =>
                  row.map((cell, c) => (
                    <div
                      key={`${r}-${c}`}
                      className={`w-3.5 h-3.5 rounded-xs ${
                        cell ? '' : 'opacity-0'
                      }`}
                      style={{ backgroundColor: nextPiece.color }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl w-24 text-2xs font-mono uppercase text-slate-400 flex flex-col gap-1.5">
            <div>
              <span>LEVEL: </span>
              <span className="text-white font-bold tabular-nums">{level}</span>
            </div>
            <div>
              <span>LINES: </span>
              <span className="text-white font-bold tabular-nums">{lines}</span>
            </div>
            <div>
              <span>BEST: </span>
              <span className="text-amber-400 font-bold tabular-nums">{highScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Touch Controls */}
      <div className="mt-4 flex flex-col gap-2 w-full max-w-[280px] md:hidden">
        <div className="grid grid-cols-3 gap-2">
          <button onClick={rotate} className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold">
            ↻
          </button>
          <button onClick={hardDrop} className="p-3 bg-cyan-600 rounded-lg text-white font-bold text-xs uppercase">
            DROP
          </button>
          <button onClick={handleHold} className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold text-xs uppercase">
            HOLD
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={moveLeft} className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold">
            ◀
          </button>
          <button onClick={drop} className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold">
            ▼
          </button>
          <button onClick={moveRight} className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold">
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};
