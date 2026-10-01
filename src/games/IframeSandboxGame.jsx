import React, { useState } from 'react';
import { ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

export const IframeSandboxGame = ({ embedUrl, customHtml, title = 'Web Game' }) => {
  const [key, setKey] = useState(0);

  const reloadGame = () => {
    setKey((prev) => prev + 1);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-2">
      <div className="w-full flex items-center justify-between mb-2 px-1 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">{title}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={reloadGame}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-md text-2xs text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Reload
          </button>
          {embedUrl && (
            <a
              href={embedUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-md text-2xs text-slate-300 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              New Window
            </a>
          )}
        </div>
      </div>

      <div className="relative w-full aspect-16/10 max-h-[580px] bg-slate-950 border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        {customHtml ? (
          <iframe
            key={key}
            title={title}
            srcDoc={customHtml}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        ) : embedUrl ? (
          <iframe
            key={key}
            title={title}
            src={embedUrl}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            allow="fullscreen; autoplay; gamepad"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-400">
            <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
            <p className="text-sm font-semibold text-slate-200">No Web URL or Code Specified</p>
            <p className="text-xs text-slate-500 mt-1">
              Add a valid game URL or HTML code in the game configuration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
