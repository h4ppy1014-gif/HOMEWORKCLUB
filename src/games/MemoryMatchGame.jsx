import React, { useState, useEffect, useCallback } from 'react';
import { playSound } from '../utils/audio.js';
import { RotateCcw, Trophy, Sparkles } from 'lucide-react';

const CARD_ICONS = ['🗡️', '🛡️', '🧪', '💎', '⭐', '🪙', '💀', '👑'];

function generateCards() {
  const deck = [...CARD_ICONS, ...CARD_ICONS].map((icon, id) => ({
    id,
    icon,
    flipped: false,
    matched: false,
  }));

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export const MemoryMatchGame = ({ soundEnabled = true }) => {
  const [cards, setCards] = useState(generateCards);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [bestMoves, setBestMoves] = useState(() => {
    return parseInt(localStorage.getItem('unblockzone_memory_best') || '0', 10);
  });
  const [isWon, setIsWon] = useState(false);

  const resetGame = useCallback(() => {
    setCards(generateCards());
    setFlippedIndices([]);
    setMoves(0);
    setMatchedPairs(0);
    setIsWon(false);
    playSound('click', soundEnabled);
  }, [soundEnabled]);

  const handleCardClick = (index) => {
    if (flippedIndices.length >= 2) return;
    if (cards[index].flipped || cards[index].matched) return;

    // Flip clicked card
    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);
    playSound('click', soundEnabled);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;

      if (cards[firstIdx].icon === cards[secondIdx].icon) {
        // Matched!
        setTimeout(() => {
          newCards[firstIdx].matched = true;
          newCards[secondIdx].matched = true;
          setCards([...newCards]);
          setFlippedIndices([]);
          setMatchedPairs((p) => {
            const nextP = p + 1;
            if (nextP === CARD_ICONS.length) {
              setIsWon(true);
              playSound('powerup', soundEnabled);
              const finalMoves = moves + 1;
              if (bestMoves === 0 || finalMoves < bestMoves) {
                setBestMoves(finalMoves);
                localStorage.setItem('unblockzone_memory_best', finalMoves.toString());
              }
            } else {
              playSound('coin', soundEnabled);
            }
            return nextP;
          });
        }, 300);
      } else {
        // Not matched, flip back after delay
        setTimeout(() => {
          newCards[firstIdx].flipped = false;
          newCards[secondIdx].flipped = false;
          setCards([...newCards]);
          setFlippedIndices([]);
          playSound('hit', soundEnabled);
        }, 850);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 select-none">
      {/* HUD */}
      <div className="w-full max-w-[380px] flex items-center justify-between mb-3 text-xs font-mono uppercase tracking-wider text-slate-300">
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="text-slate-400">MOVES:</span>
          <span className="text-cyan-400 font-bold tabular-nums text-sm">{moves}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">BEST:</span>
          <span className="text-amber-400 font-bold tabular-nums text-sm">
            {bestMoves === 0 ? '--' : bestMoves}
          </span>
        </div>

        <button
          onClick={resetGame}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Restart"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Card Grid Container */}
      <div className="relative w-full max-w-[380px] aspect-square p-3 bg-slate-900 border-2 border-slate-800 rounded-2xl shadow-2xl">
        <div className="grid grid-cols-4 grid-rows-4 gap-2.5 h-full w-full">
          {cards.map((card, idx) => {
            const isRevealed = card.flipped || card.matched;

            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(idx)}
                className={`flex items-center justify-center rounded-xl border-2 text-2xl transition-all duration-200 cursor-pointer ${
                  card.matched
                    ? 'bg-emerald-950/60 border-emerald-500/80 text-white shadow-xs'
                    : isRevealed
                    ? 'bg-slate-800 border-cyan-400 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-transparent active:scale-95'
                }`}
              >
                {isRevealed ? (
                  <span>{card.icon}</span>
                ) : (
                  <span className="text-sm font-mono text-slate-700 font-bold">?</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Victory Modal */}
        {isWon && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <Sparkles className="w-10 h-10 text-yellow-400 mb-2 animate-bounce" />
            <span className="text-yellow-400 font-black text-2xl font-mono uppercase mb-1">
              PERFECT MATCH!
            </span>
            <p className="text-slate-300 text-sm mb-4">
              Cleared in <span className="text-cyan-400 font-bold tabular-nums">{moves}</span> moves!
            </p>
            <button
              onClick={resetGame}
              className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs rounded-lg uppercase tracking-wider shadow-lg"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
