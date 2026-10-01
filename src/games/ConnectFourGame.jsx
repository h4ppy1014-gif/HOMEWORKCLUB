import React, { useState, useCallback } from 'react';
import { playSound } from '../utils/audio.js';
import { RotateCcw, User, Users, Trophy } from 'lucide-react';

const ROWS = 6;
const COLS = 7;

function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

export const ConnectFourGame = ({ soundEnabled = true }) => {
  const [board, setBoard] = useState(createEmptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState('RED'); // 'RED' (Player 1) or 'YELLOW' (Player 2/CPU)
  const [mode, setMode] = useState('1P'); // '1P' vs CPU or '2P' local
  const [winner, setWinner] = useState(null); // 'RED' | 'YELLOW' | 'DRAW' | null
  const [winningCells, setWinningCells] = useState([]);
  const [scores, setScores] = useState({ red: 0, yellow: 0 });

  const checkWin = useCallback((b, r, c, player) => {
    const directions = [
      [0, 1], // horizontal
      [1, 0], // vertical
      [1, 1], // diag down-right
      [1, -1], // diag down-left
    ];

    for (const [dr, dc] of directions) {
      const line = [[r, c]];

      // forward
      let step = 1;
      while (true) {
        const nr = r + dr * step;
        const nc = c + dc * step;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && b[nr][nc] === player) {
          line.push([nr, nc]);
          step++;
        } else {
          break;
        }
      }

      // backward
      step = 1;
      while (true) {
        const nr = r - dr * step;
        const nc = c - dc * step;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && b[nr][nc] === player) {
          line.push([nr, nc]);
          step++;
        } else {
          break;
        }
      }

      if (line.length >= 4) {
        return line;
      }
    }
    return null;
  }, []);

  const makeMove = useCallback(
    (col, player, currentBoard) => {
      const newBoard = currentBoard.map((row) => [...row]);
      for (let r = ROWS - 1; r >= 0; r--) {
        if (!newBoard[r][col]) {
          newBoard[r][col] = player;
          return { newBoard, row: r };
        }
      }
      return null;
    },
    []
  );

  const handleColumnClick = (col) => {
    if (winner) return;

    const moveResult = makeMove(col, currentPlayer, board);
    if (!moveResult) return; // Column full

    const { newBoard, row } = moveResult;
    playSound('bounce', soundEnabled);

    const winLine = checkWin(newBoard, row, col, currentPlayer);
    if (winLine) {
      setBoard(newBoard);
      setWinner(currentPlayer);
      setWinningCells(winLine);
      playSound('powerup', soundEnabled);
      setScores((s) => ({
        ...s,
        [currentPlayer.toLowerCase()]: s[currentPlayer.toLowerCase()] + 1,
      }));
      return;
    }

    // Check Draw
    const isFull = newBoard[0].every((cell) => cell !== null);
    if (isFull) {
      setBoard(newBoard);
      setWinner('DRAW');
      playSound('gameover', soundEnabled);
      return;
    }

    setBoard(newBoard);

    if (mode === '2P') {
      setCurrentPlayer((p) => (p === 'RED' ? 'YELLOW' : 'RED'));
    } else {
      // 1P vs CPU
      setCurrentPlayer('YELLOW');
      setTimeout(() => {
        // AI: Check for winning move or block player winning move
        let chosenCol = -1;

        // 1. Check if AI can win
        for (let c = 0; c < COLS; c++) {
          const test = makeMove(c, 'YELLOW', newBoard);
          if (test && checkWin(test.newBoard, test.row, c, 'YELLOW')) {
            chosenCol = c;
            break;
          }
        }

        // 2. Check if player can win next and block it
        if (chosenCol === -1) {
          for (let c = 0; c < COLS; c++) {
            const test = makeMove(c, 'RED', newBoard);
            if (test && checkWin(test.newBoard, test.row, c, 'RED')) {
              chosenCol = c;
              break;
            }
          }
        }

        // 3. Prefer center column or random available
        if (chosenCol === -1) {
          const priorities = [3, 2, 4, 1, 5, 0, 6];
          for (const c of priorities) {
            if (!newBoard[0][c]) {
              chosenCol = c;
              break;
            }
          }
        }

        if (chosenCol !== -1) {
          const aiMove = makeMove(chosenCol, 'YELLOW', newBoard);
          if (aiMove) {
            playSound('bounce', soundEnabled);
            const aiWinLine = checkWin(aiMove.newBoard, aiMove.row, chosenCol, 'YELLOW');
            if (aiWinLine) {
              setBoard(aiMove.newBoard);
              setWinner('YELLOW');
              setWinningCells(aiWinLine);
              playSound('gameover', soundEnabled);
              setScores((s) => ({ ...s, yellow: s.yellow + 1 }));
            } else {
              setBoard(aiMove.newBoard);
              setCurrentPlayer('RED');
            }
          }
        }
      }, 350);
    }
  };

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setCurrentPlayer('RED');
    setWinner(null);
    setWinningCells([]);
    playSound('click', soundEnabled);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 select-none">
      {/* Header Bar */}
      <div className="w-full max-w-[420px] flex items-center justify-between mb-3 text-xs font-mono uppercase tracking-wider text-slate-300">
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => {
              setMode('1P');
              resetGame();
            }}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
              mode === '1P' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3 h-3" /> 1P vs CPU
          </button>
          <button
            onClick={() => {
              setMode('2P');
              resetGame();
            }}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
              mode === '2P' ? 'bg-yellow-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3 h-3" /> 2P Local
          </button>
        </div>

        <button
          onClick={resetGame}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Reset Board"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Turn indicator & Scores */}
      <div className="w-full max-w-[420px] flex items-center justify-between mb-3 px-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500 shadow-xs shadow-red-500/50" />
          <span className="text-slate-300">P1: {scores.red}</span>
        </div>

        <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-md font-bold uppercase text-2xs tracking-widest text-slate-300">
          {winner
            ? winner === 'DRAW'
              ? 'TIE GAME'
              : `${winner} WINS!`
            : `${currentPlayer}'s Turn`}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-300">{mode === '1P' ? 'CPU' : 'P2'}: {scores.yellow}</span>
          <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-xs shadow-yellow-400/50" />
        </div>
      </div>

      {/* Connect Four Board */}
      <div className="p-3 bg-blue-700 border-4 border-blue-900 rounded-2xl shadow-2xl">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: COLS }).map((_, c) => (
            <button
              key={c}
              onClick={() => handleColumnClick(c)}
              disabled={!!winner || (mode === '1P' && currentPlayer === 'YELLOW')}
              className="group flex flex-col gap-2 p-1 rounded-lg hover:bg-blue-600/40 transition-colors cursor-pointer"
            >
              {Array.from({ length: ROWS }).map((_, r) => {
                const cell = board[r][c];
                const isWinning = winningCells.some(([wr, wc]) => wr === r && wc === c);

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 transition-all flex items-center justify-center ${
                      cell === 'RED'
                        ? 'bg-red-500 border-red-700 shadow-inner'
                        : cell === 'YELLOW'
                        ? 'bg-yellow-400 border-yellow-600 shadow-inner'
                        : 'bg-blue-950/80 border-blue-900'
                    } ${isWinning ? 'ring-4 ring-white animate-pulse' : ''}`}
                  >
                    {isWinning && <Trophy className="w-4 h-4 text-white" />}
                  </div>
                );
              })}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
