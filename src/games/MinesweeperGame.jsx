import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playSound } from '../utils/audio.js';
import { Flag, Smile, Frown, Meh, Trophy } from 'lucide-react';

const CONFIGS = {
  EASY: { rows: 9, cols: 9, mines: 10 },
  MEDIUM: { rows: 14, cols: 14, mines: 30 },
  HARD: { rows: 14, cols: 24, mines: 55 },
};

export const MinesweeperGame = ({ soundEnabled = true }) => {
  const [difficulty, setDifficulty] = useState('EASY');
  const [grid, setGrid] = useState([]);
  const [minesLeft, setMinesLeft] = useState(10);
  const [status, setStatus] = useState('IDLE');
  const [seconds, setSeconds] = useState(0);
  const [flagMode, setFlagMode] = useState(false);

  const timerRef = useRef(null);

  const initBoard = useCallback((diff) => {
    const cfg = CONFIGS[diff];
    const newGrid = [];
    for (let r = 0; r < cfg.rows; r++) {
      const row = [];
      for (let c = 0; c < cfg.cols; c++) {
        row.push({
          r,
          c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0,
        });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    setMinesLeft(cfg.mines);
    setStatus('IDLE');
    setSeconds(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    initBoard(difficulty);
  }, [difficulty, initBoard]);

  useEffect(() => {
    if (status === 'PLAYING') {
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const populateMines = (clickedR, clickedC, board) => {
    const cfg = CONFIGS[difficulty];
    let placed = 0;
    while (placed < cfg.mines) {
      const r = Math.floor(Math.random() * cfg.rows);
      const c = Math.floor(Math.random() * cfg.cols);
      const isAroundFirstClick = Math.abs(r - clickedR) <= 1 && Math.abs(c - clickedC) <= 1;
      if (!board[r][c].isMine && !isAroundFirstClick) {
        board[r][c].isMine = true;
        placed++;
      }
    }

    for (let r = 0; r < cfg.rows; r++) {
      for (let c = 0; c < cfg.cols; c++) {
        if (board[r][c].isMine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < cfg.rows && nc >= 0 && nc < cfg.cols && board[nr][nc].isMine) {
              count++;
            }
          }
        }
        board[r][c].adjacentMines = count;
      }
    }
  };

  const revealCell = (r, c) => {
    if (status === 'WON' || status === 'LOST') return;

    if (flagMode) {
      toggleFlag(r, c);
      return;
    }

    const nextGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    const cell = nextGrid[r][c];
    if (cell.isRevealed || cell.isFlagged) return;

    if (status === 'IDLE') {
      setStatus('PLAYING');
      populateMines(r, c, nextGrid);
    }

    if (cell.isMine) {
      setStatus('LOST');
      playSound('gameover', soundEnabled);
      nextGrid.forEach((row) =>
        row.forEach((cl) => {
          if (cl.isMine) cl.isRevealed = true;
        })
      );
      setGrid(nextGrid);
      return;
    }

    const queue = [[r, c]];
    cell.isRevealed = true;

    while (queue.length > 0) {
      const [cr, cc] = queue.shift();
      const current = nextGrid[cr][cc];

      if (current.adjacentMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = cr + dr;
            const nc = cc + dc;
            if (nr >= 0 && nr < CONFIGS[difficulty].rows && nc >= 0 && nc < CONFIGS[difficulty].cols) {
              const neighbor = nextGrid[nr][nc];
              if (!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isMine) {
                neighbor.isRevealed = true;
                if (neighbor.adjacentMines === 0) {
                  queue.push([nr, nc]);
                }
              }
            }
          }
        }
      }
    }

    playSound('click', soundEnabled);

    let unrevealedSafeCells = 0;
    nextGrid.forEach((row) =>
      row.forEach((cl) => {
        if (!cl.isMine && !cl.isRevealed) unrevealedSafeCells++;
      })
    );

    if (unrevealedSafeCells === 0) {
      setStatus('WON');
      playSound('powerup', soundEnabled);
      nextGrid.forEach((row) =>
        row.forEach((cl) => {
          if (cl.isMine) cl.isFlagged = true;
        })
      );
      setMinesLeft(0);
    }

    setGrid(nextGrid);
  };

  const toggleFlag = (r, c, e) => {
    if (e) e.preventDefault();
    if (status === 'WON' || status === 'LOST') return;

    const nextGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    const cell = nextGrid[r][c];
    if (cell.isRevealed) return;

    if (cell.isFlagged) {
      cell.isFlagged = false;
      setMinesLeft((m) => m + 1);
    } else {
      cell.isFlagged = true;
      setMinesLeft((m) => m - 1);
      playSound('hit', soundEnabled);
    }
    setGrid(nextGrid);
  };

  const getNumberColor = (num) => {
    switch (num) {
      case 1:
        return 'text-blue-400 font-bold';
      case 2:
        return 'text-emerald-400 font-bold';
      case 3:
        return 'text-red-400 font-bold';
      case 4:
        return 'text-indigo-400 font-extrabold';
      case 5:
        return 'text-amber-500 font-extrabold';
      case 6:
        return 'text-teal-400 font-extrabold';
      case 7:
        return 'text-purple-400 font-extrabold';
      case 8:
        return 'text-pink-500 font-black';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 select-none">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 w-full max-w-[500px]">
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
          {['EASY', 'MEDIUM', 'HARD'].map((diff) => (
            <button
              key={diff}
              onClick={() => {
                setDifficulty(diff);
                initBoard(diff);
              }}
              className={`px-2.5 py-1 rounded text-2xs font-semibold uppercase tracking-wider transition-colors ${
                difficulty === diff ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>

        <button
          onClick={() => setFlagMode((f) => !f)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
            flagMode
              ? 'bg-red-500/20 border-red-500/50 text-red-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Flag Mode: {flagMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      <div className="w-full max-w-[500px] flex items-center justify-between bg-slate-900 border-2 border-slate-800 p-2.5 rounded-t-xl font-mono">
        <div className="bg-slate-950 border border-slate-800 px-3 py-1 rounded text-red-500 font-black text-lg tracking-widest tabular-nums">
          {String(Math.max(0, minesLeft)).padStart(3, '0')}
        </div>

        <button
          onClick={() => initBoard(difficulty)}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-lg border border-slate-700 transition-transform text-yellow-400"
          title="Restart"
        >
          {status === 'WON' ? (
            <Trophy className="w-6 h-6 text-yellow-400" />
          ) : status === 'LOST' ? (
            <Frown className="w-6 h-6 text-red-400" />
          ) : status === 'PLAYING' ? (
            <Meh className="w-6 h-6 text-yellow-400" />
          ) : (
            <Smile className="w-6 h-6 text-yellow-400" />
          )}
        </button>

        <div className="bg-slate-950 border border-slate-800 px-3 py-1 rounded text-red-500 font-black text-lg tracking-widest tabular-nums">
          {String(Math.min(999, seconds)).padStart(3, '0')}
        </div>
      </div>

      <div className="p-3 bg-slate-950 border-2 border-t-0 border-slate-800 rounded-b-xl overflow-x-auto max-w-full shadow-2xl">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${CONFIGS[difficulty].cols}, minmax(0, 1fr))`,
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => revealCell(r, c)}
                onContextMenu={(e) => toggleFlag(r, c, e)}
                className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs font-mono rounded transition-all select-none ${
                  cell.isRevealed
                    ? cell.isMine
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-900/90 text-slate-100 border border-slate-800/60'
                    : 'bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-t-slate-700 border-l-slate-700 border-r-slate-900 border-b-slate-900 shadow-xs'
                }`}
              >
                {cell.isRevealed ? (
                  cell.isMine ? (
                    '💣'
                  ) : cell.adjacentMines > 0 ? (
                    <span className={getNumberColor(cell.adjacentMines)}>{cell.adjacentMines}</span>
                  ) : (
                    ''
                  )
                ) : cell.isFlagged ? (
                  <span className="text-red-400 font-bold text-xs">🚩</span>
                ) : (
                  ''
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
