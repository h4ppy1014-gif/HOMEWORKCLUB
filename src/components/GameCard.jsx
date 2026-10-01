import React from 'react';
import {
  Gamepad2,
  Box,
  Grid3X3,
  Boxes,
  Rocket,
  Zap,
  Layers,
  Trophy,
  Flame,
  ShieldAlert,
  Disc,
  Sparkles,
  Heart,
  Play,
  Star,
} from 'lucide-react';

const ICON_MAP = {
  Gamepad2,
  Box,
  Grid3X3,
  Boxes,
  Rocket,
  Zap,
  Layers,
  Trophy,
  Flame,
  ShieldAlert,
  Disc,
  Sparkles,
};

export const GameCard = ({
  game,
  isFavorite,
  onToggleFavorite,
  onSelectGame,
}) => {
  const IconComponent = ICON_MAP[game.icon] || Gamepad2;

  return (
    <div
      onClick={() => onSelectGame(game)}
      className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50 cursor-pointer"
    >
      {/* Top Banner / Visual Representation */}
      <div className="relative w-full aspect-16/10 rounded-lg overflow-hidden mb-3 bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 flex items-center justify-center">
        {/* Ambient Gradient Glow */}
        <div
          className={`absolute inset-0 opacity-20 group-hover:opacity-35 transition-opacity bg-gradient-to-tr ${
            game.color || 'from-emerald-500 to-teal-600'
          }`}
        />

        {/* Central Game Icon */}
        <div className="relative z-10 p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 group-hover:scale-110 transition-transform duration-200 shadow-lg">
          <IconComponent className="w-8 h-8 text-emerald-400 group-hover:text-emerald-300" />
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(game.id);
          }}
          className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-md bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 transition-colors"
          title={isFavorite ? 'Remove Favorite' : 'Save Favorite'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'text-red-500 fill-red-500' : ''}`} />
        </button>

        {/* Badge (Text kicker, quiet) */}
        {game.badge && (
          <span className="absolute top-2.5 left-2.5 z-20 text-3xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
            {game.badge}
          </span>
        )}
      </div>

      {/* Card Info: Zero-pill discipline (clean unboxed text with separators) */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-2xs text-slate-500 mb-1">
            <span>{game.category}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-0.5 text-amber-400/90 font-medium">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
              {game.rating}
            </span>
            <span aria-hidden="true">·</span>
            <span>{(game.playsCount || 10000).toLocaleString()} plays</span>
          </div>

          <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 mb-1.5">
            {game.title}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {game.description}
          </p>
        </div>

        {/* Play Action Footer */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/60 flex items-center justify-between">
          <span className="text-2xs text-slate-500 font-mono">
            {game.gameType === 'built-in' ? 'Instant HTML5' : 'Web Sandboxed'}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
            <span>Play</span>
            <Play className="w-3 h-3 fill-emerald-400" />
          </span>
        </div>
      </div>
    </div>
  );
};
