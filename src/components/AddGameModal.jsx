import React, { useState } from 'react';
import { X, Plus, Gamepad2 } from 'lucide-react';

const ICON_OPTIONS = [
  'Gamepad2',
  'Box',
  'Grid3X3',
  'Boxes',
  'Rocket',
  'Zap',
  'Layers',
  'Trophy',
  'Flame',
  'ShieldAlert',
  'Disc',
  'Sparkles',
];

const CATEGORY_OPTIONS = ['Arcade', 'Action', 'Puzzle', 'Retro', 'Sports', 'Strategy'];

export const AddGameModal = ({ onAddGame, onClose }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Arcade');
  const [icon, setIcon] = useState('Gamepad2');
  const [badge, setBadge] = useState('Custom');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [gameType, setGameType] = useState('iframe');
  const [embedUrl, setEmbedUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newGame = {
      id: `custom-${Date.now()}`,
      title: title.trim(),
      category,
      icon,
      badge: badge.trim() || undefined,
      color: 'from-cyan-500 to-blue-600',
      description: description.trim() || 'Custom user added web game.',
      instructions: instructions.trim() || 'Use keyboard and mouse to play.',
      controls: [
        { key: 'Mouse / Keys', label: 'Primary controls' },
        { key: 'R', label: 'Restart' },
      ],
      rating: 5.0,
      playsCount: 1,
      gameType: 'iframe',
      embedUrl: embedUrl.trim() || undefined,
      isCustom: true,
    };

    onAddGame(newGame);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Game to JSON Store</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Game Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Slope Runner, Retro Bowl, Tunnel Rush"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Icon Representation
              </label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Embed / Sandbox Web Game URL
            </label>
            <input
              type="url"
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              placeholder="https://example.com/games/my-game"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
            />
            <span className="text-3xs text-slate-500 mt-1 block">
              Any secure HTTPS web game, itch.io embed link, or GitHub pages game.
            </span>
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief game synopsis..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Badge (Optional)
            </label>
            <input
              type="text"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="e.g. Hot, New, Unblocked"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md"
            >
              Add to Catalog
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
