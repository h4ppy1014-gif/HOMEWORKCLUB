import React, { useState } from 'react';
import { X, Copy, Download, Upload, Check, RotateCcw } from 'lucide-react';

export const JsonManagerModal = ({
  games,
  onUpdateGames,
  onResetToDefault,
  onClose,
}) => {
  const [jsonText, setJsonText] = useState(() => JSON.stringify(games, null, 2));
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'unblockzone_games.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON root must be an array of game objects.');
      }
      onUpdateGames(parsed);
      setErrorMsg('');
      setSuccessMsg('Games successfully updated from JSON!');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err) {
      setErrorMsg(`JSON Parse Error: ${err.message}`);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (typeof content === 'string') {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            setJsonText(JSON.stringify(parsed, null, 2));
            onUpdateGames(parsed);
            setSuccessMsg('Loaded and applied JSON file!');
            setTimeout(() => setSuccessMsg(''), 2500);
          } else {
            setErrorMsg('Uploaded file must contain a JSON array of games.');
          }
        }
      } catch (err) {
        setErrorMsg(`Failed to parse file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400 font-mono">{'{ }'}</span>
              <span>Game Registry (JSON Catalog)</span>
            </h3>
            <p className="text-2xs text-slate-400 mt-0.5">
              All unblocked games are registered and configured as pure JSON objects with icon keys and metadata.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-2.5 bg-slate-950/50 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <button
            onClick={() => {
              onResetToDefault();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-red-400 transition-colors cursor-pointer text-2xs"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Default</span>
          </button>
        </div>

        {/* JSON Code Editor / Viewer */}
        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          {errorMsg && (
            <div className="mb-2 p-2.5 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-2 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs">
              {successMsg}
            </div>
          )}

          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            spellCheck={false}
            className="w-full flex-1 bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:outline-hidden focus:border-cyan-500 resize-none overflow-auto leading-relaxed"
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <span className="text-2xs text-slate-500 font-mono">
            {games.length} games registered in JSON
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyJson}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Save & Apply JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
