import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playSound } from '../utils/audio.js';
import { RotateCcw, Trophy, Undo2 } from 'lucide-react';

export const Game2048 = ({ soundEnabled = true }) => {
  const [board, setBoard] = useState(() => getInitialBoard());
  const [previousBoard, setPreviousBoard] = useState(null);
  const [previousScore, setPreviousScore] = useState(0);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('unblockzone_2048_high') || '0', 10);
  });
  const [won, setWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  function getEmptyBoard() {
    return Array.from({ length: 4 }, () => Array(4).fill(0));
  }

  function getInitialBoard() {
    const empty = getEmptyBoard();
    addRandomTile(empty);
    addRandomTile(empty);
    return empty;
  }

  function addRandomTile(b) {
    const emptyCells = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (b[r][c] === 0) emptyCells.push([r, c]);
      }
    }
    if (emptyCells.length === 0) return false;
    const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    b[r][c] = Math.random() < 0.9 ? 2 : 4;
    return true;
  }

  const restartGame = useCallback(() => {
    const newBoard = getInitialBoard();
    setBoard(newBoard);
    setPreviousBoard(null);
    setScore(0);
    setWon(false);
    setKeepPlaying(false);
    setGameOver(false);
    playSound('click', soundEnabled);
  }, [soundEnabled]);

  const undoMove = useCallback(() => {
    if (previousBoard) {
      setBoard(previousBoard);
      setScore(previousScore);
      setPreviousBoard(null);
      setGameOver(false);
      playSound('click', soundEnabled);
    }
  }, [previousBoard, previousScore, soundEnabled]);

  const checkGameOver = (b) => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (b[r][c] === 0) return false;
        if (r < 3 && b[r][c] === b[r + 1][c]) return false;
        if (c < 3 && b[r][c] === b[r][c + 1]) return false;
      }
    }
    return true;
  };

  const move = useCallback(
    (direction) => {
      if (gameOver) return;

      let moved = false;
      let pointsEarned = 0;
      let hasWon = false;

      const newBoard = board.map((row) => [...row]);

      const slideRow = (row) => {
        const nonZero = row.filter((val) => val !== 0);
        const result = [];
        let i = 0;
        while (i < nonZero.length) {
          if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
            const mergedVal = nonZero[i] * 2;
            result.push(mergedVal);
            pointsEarned += mergedVal;
            if (mergedVal === 2048) hasWon = true;
            i += 2;
          } else {
            result.push(nonZero[i]);
            i++;
          }
        }
        while (result.length < 4) {
          result.push(0);
        }
        return result;
      };

      if (direction === 'LEFT') {
        for (let r = 0; r < 4; r++) {
          const oldRow = newBoard[r];
          const nextRow = slideRow(oldRow);
          if (oldRow.some((val, idx) => val !== nextRow[idx])) moved = true;
          newBoard[r] = nextRow;
        }
      } else if (direction === 'RIGHT') {
        for (let r = 0; r < 4; r++) {
          const oldRow = [...newBoard[r]].reverse();
          const nextRow = slideRow(oldRow).reverse();
          if (newBoard[r].some((val, idx) => val !== nextRow[idx])) moved = true;
          newBoard[r] = nextRow;
        }
      } else if (direction === 'UP') {
        for (let c = 0; c < 4; c++) {
          const col = [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]];
          const nextCol = slideRow(col);
          if (col.some((val, idx) => val !== nextCol[idx])) moved = true;
          for (let r = 0; r < 4; r++) {
            newBoard[r][c] = nextCol[r];
          }
        }
      } else if (direction === 'DOWN') {
        for (let c = 0; c < 4; c++) {
          const col = [newBoard[3][c], newBoard[2][c], newBoard[1][c], newBoard[0][c]];
          const nextCol = slideRow(col);
          if (col.some((val, idx) => val !== nextCol[idx])) moved = true;
          for (let r = 0; r < 4; r++) {
            newBoard[3 - r][c] = nextCol[r];
          }
        }
      }

      if (moved) {
        setPreviousBoard(board);
        setPreviousScore(score);

        addRandomTile(newBoard);
        setBoard(newBoard);

        const newScore = score + pointsEarned;
        setScore(newScore);

        if (newScore > bestScore) {
          setBestScore(newScore);
          localStorage.setItem('unblockzone_2048_high', newScore.toString());
        }

        if (pointsEarned > 0) {
          playSound('coin', soundEnabled);
        } else {
          playSound('click', soundEnabled);
        }

        if (hasWon && !keepPlaying) {
          setWon(true);
          playSound('powerup', soundEnabled);
        }

        if (checkGameOver(newBoard)) {
          setGameOver(true);
          playSound('gameover', soundEnabled);
        }
      }
    },
    [board, score, bestScore, gameOver, keepPlaying, soundEnabled]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') move('UP');
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') move('DOWN');
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') move('LEFT');
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') move('RIGHT');
      else if (e.key === 'u' || e.key === 'U') undoMove();
      else if (e.key === 'r' || e.key === 'R') restartGame();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, undoMove, restartGame]);

  const touchStart = useRef(null);

  const handleTouchStart = (e) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) > 30) {
      if (absX > absY) {
        move(dx > 0 ? 'RIGHT' : 'LEFT');
      } else {
        move(dy > 0 ? 'DOWN' : 'UP');
      }
    }
    touchStart.current = null;
  };

  const getTileColor = (val) => {
    switch (val) {
      case 2:
        return 'bg-amber-100 text-slate-800 border-amber-200';
      case 4:
        return 'bg-amber-200 text-slate-800 border-amber-300';
      case 8:
        return 'bg-orange-400 text-white border-orange-500 font-bold';
      case 16:
        return 'bg-orange-500 text-white border-orange-600 font-bold shadow-xs';
      case 32:
        return 'bg-rose-500 text-white border-rose-600 font-bold shadow-xs';
      case 64:
        return 'bg-red-600 text-white border-red-700 font-extrabold shadow-sm';
      case 128:
        return 'bg-yellow-400 text-slate-900 border-yellow-500 font-extrabold shadow-md';
      case 256:
        return 'bg-yellow-500 text-slate-900 border-yellow-600 font-extrabold shadow-md';
      case 512:
        return 'bg-amber-500 text-white border-amber-600 font-black shadow-lg';
      case 1024:
        return 'bg-emerald-500 text-white border-emerald-600 font-black shadow-lg';
      case 2048:
        return 'bg-teal-400 text-slate-950 border-teal-300 font-black shadow-xl ring-2 ring-teal-300';
      default:
        return val > 2048
          ? 'bg-purple-600 text-white border-purple-700 font-black shadow-xl'
          : 'bg-slate-800/80 border-slate-700/60';
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center p-4 select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="w-full max-w-[380px] flex items-center justify-between mb-3 text-xs font-mono uppercase tracking-wider text-slate-300">
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="text-slate-400">SCORE:</span>
          <span className="text-amber-400 font-bold tabular-nums text-sm">{score}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-slate-400">BEST:</span>
          <span className="text-yellow-400 font-bold tabular-nums text-sm">{bestScore}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {previousBoard && (
            <button
              onClick={undoMove}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Undo Move (U)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={restartGame}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Restart (R)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-[380px] aspect-square p-3 bg-slate-900 border-2 border-slate-800 rounded-2xl shadow-2xl">
        <div className="grid grid-cols-4 grid-rows-4 gap-2.5 h-full w-full">
          {board.map((row, rIdx) =>
            row.map((val, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`flex items-center justify-center rounded-xl border text-xl md:text-2xl font-mono transition-transform duration-100 ${getTileColor(
                  val
                )}`}
              >
                {val > 0 ? val : ''}
              </div>
            ))
          )}
        </div>

        {won && !keepPlaying && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-yellow-400 font-black text-3xl font-mono mb-2">YOU WIN!</span>
            <p className="text-slate-300 text-sm mb-4">You reached the legendary 2048 tile!</p>
            <div className="flex gap-2">
              <button
                onClick={() => setKeepPlaying(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg uppercase"
              >
                Keep Going
              </button>
              <button
                onClick={restartGame}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg uppercase"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-red-500 font-black text-2xl font-mono mb-1">NO MORE MOVES</span>
            <p className="text-slate-300 text-sm mb-4">
              Final Score: <span className="text-amber-400 font-bold">{score}</span>
            </p>
            <button
              onClick={restartGame}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg uppercase tracking-wider"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 w-48 max-w-full md:hidden">
        <div />
        <button
          onClick={() => move('UP')}
          className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 active:bg-slate-800 text-center font-bold"
        >
          ▲
        </button>
        <div />
        <button
          onClick={() => move('LEFT')}
          className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 active:bg-slate-800 text-center font-bold"
        >
          ◀
        </button>
        <button
          onClick={() => move('DOWN')}
          className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 active:bg-slate-800 text-center font-bold"
        >
          ▼
        </button>
        <button
          onClick={() => move('RIGHT')}
          className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 active:bg-slate-800 text-center font-bold"
        >
          ▶
        </button>
      </div>
    </div>
  );
};
