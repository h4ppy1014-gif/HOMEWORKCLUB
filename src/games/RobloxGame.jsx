import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from '../utils/audio.js';
import { RotateCcw, ExternalLink, Flag, Trophy, Shield, Globe } from 'lucide-react';

const CANVAS_WIDTH = 540;
const CANVAS_HEIGHT = 380;
const GRAVITY = 0.55;
const JUMP_FORCE = -11.5;

export const RobloxGame = ({ soundEnabled = true }) => {
  const [activeTab, setActiveTab] = useState('obby'); // 'obby' or 'cloud'
  const [cloudUrl, setCloudUrl] = useState('https://now.gg/apps/roblox-corporation/5349/roblox.html');
  const [proxyInput, setProxyInput] = useState('https://now.gg/apps/roblox-corporation/5349/roblox.html');
  const [stage, setStage] = useState(1);
  const [deaths, setDeaths] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const canvasRef = useRef(null);

  // Blox Avatar Ref
  const playerRef = useRef({
    x: 40,
    y: 280,
    vx: 0,
    vy: 0,
    width: 24,
    height: 36,
    onGround: false,
    facing: 'right',
  });

  const keysRef = useRef({
    left: false,
    right: false,
    jump: false,
  });

  // Stages configuration for the Blox Obby
  const getStagePlatforms = useCallback((s) => {
    switch (s) {
      case 1:
        // Easy intro: simple stepping blocks & first lava jump
        return {
          title: 'Stage 1: Rainbow Checkpoint',
          platforms: [
            { x: 20, y: 320, w: 90, h: 20, type: 'normal', color: '#10b981' },
            { x: 140, y: 290, w: 70, h: 20, type: 'normal', color: '#3b82f6' },
            { x: 240, y: 250, w: 70, h: 20, type: 'normal', color: '#8b5cf6' },
            { x: 340, y: 220, w: 60, h: 20, type: 'normal', color: '#ec4899' },
            { x: 440, y: 180, w: 80, h: 20, type: 'finish', color: '#eab308' },
          ],
          hazards: [
            { x: 0, y: 360, w: 540, h: 20, color: '#ef4444' }, // lava floor
          ],
          spawn: { x: 40, y: 280 },
        };
      case 2:
        // Stage 2: Disappearing floating blocks & moving lava lasers
        return {
          title: 'Stage 2: The Red Laser Run',
          platforms: [
            { x: 20, y: 320, w: 70, h: 20, type: 'normal', color: '#06b6d4' },
            { x: 120, y: 280, w: 50, h: 20, type: 'normal', color: '#3b82f6' },
            { x: 210, y: 240, w: 50, h: 20, type: 'normal', color: '#6366f1' },
            { x: 300, y: 200, w: 50, h: 20, type: 'normal', color: '#a855f7' },
            { x: 390, y: 160, w: 50, h: 20, type: 'normal', color: '#d946ef' },
            { x: 460, y: 130, w: 70, h: 20, type: 'finish', color: '#eab308' },
          ],
          hazards: [
            { x: 0, y: 360, w: 540, h: 20, color: '#ef4444' },
            { x: 175, y: 210, w: 16, h: 150, color: '#f43f5e' }, // vertical laser hazard
            { x: 355, y: 170, w: 16, h: 190, color: '#f43f5e' }, // vertical laser hazard
          ],
          spawn: { x: 35, y: 280 },
        };
      case 3:
      default:
        // Stage 3: The Sky Tower Climb
        return {
          title: 'Stage 3: Tower of Blox Victory',
          platforms: [
            { x: 20, y: 330, w: 60, h: 20, type: 'normal', color: '#10b981' },
            { x: 110, y: 300, w: 45, h: 20, type: 'normal', color: '#06b6d4' },
            { x: 180, y: 260, w: 45, h: 20, type: 'normal', color: '#3b82f6' },
            { x: 250, y: 220, w: 45, h: 20, type: 'normal', color: '#8b5cf6' },
            { x: 320, y: 180, w: 45, h: 20, type: 'normal', color: '#ec4899' },
            { x: 390, y: 140, w: 45, h: 20, type: 'normal', color: '#f97316' },
            { x: 450, y: 100, w: 80, h: 20, type: 'finish', color: '#eab308' },
          ],
          hazards: [
            { x: 0, y: 360, w: 540, h: 20, color: '#ef4444' },
            { x: 155, y: 230, w: 12, h: 130, color: '#f43f5e' },
            { x: 295, y: 160, w: 12, h: 200, color: '#f43f5e' },
          ],
          spawn: { x: 35, y: 290 },
        };
    }
  }, []);

  const respawn = useCallback(() => {
    const currentConfig = getStagePlatforms(stage);
    playerRef.current.x = currentConfig.spawn.x;
    playerRef.current.y = currentConfig.spawn.y;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    setDeaths((d) => d + 1);
    playSound('hit', soundEnabled);
  }, [getStagePlatforms, stage, soundEnabled]);

  const resetObby = () => {
    setStage(1);
    setDeaths(0);
    setGameWon(false);
    setIsGameOver(false);
    const config = getStagePlatforms(1);
    playerRef.current.x = config.spawn.x;
    playerRef.current.y = config.spawn.y;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    playSound('click', soundEnabled);
  };

  // Keyboard controls
  useEffect(() => {
    if (activeTab !== 'obby') return;

    const handleKeyDown = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
        playerRef.current.facing = 'left';
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
        playerRef.current.facing = 'right';
      }
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keysRef.current.jump = true;
        if (playerRef.current.onGround) {
          playerRef.current.vy = JUMP_FORCE;
          playerRef.current.onGround = false;
          playSound('jump', soundEnabled);
        }
      }
      if (e.key === 'r' || e.key === 'R') {
        respawn();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keysRef.current.jump = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeTab, respawn, soundEnabled]);

  // Main Obby Game Loop
  useEffect(() => {
    if (activeTab !== 'obby') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;

    const loop = () => {
      const p = playerRef.current;
      const currentConfig = getStagePlatforms(stage);

      // Movement
      const moveSpeed = 4.8;
      if (keysRef.current.left) {
        p.vx = -moveSpeed;
      } else if (keysRef.current.right) {
        p.vx = moveSpeed;
      } else {
        p.vx *= 0.7; // friction
      }

      // Gravity
      p.vy += GRAVITY;

      // Update positions
      p.x += p.vx;
      p.y += p.vy;

      // Wall limits
      if (p.x < 0) p.x = 0;
      if (p.x + p.width > CANVAS_WIDTH) p.x = CANVAS_WIDTH - p.width;

      // Check Platforms Collisions
      p.onGround = false;
      currentConfig.platforms.forEach((plat) => {
        // Falling down onto platform
        if (
          p.x + p.width > plat.x &&
          p.x < plat.x + plat.w &&
          p.y + p.height >= plat.y &&
          p.y + p.height <= plat.y + 14 &&
          p.vy >= 0
        ) {
          p.y = plat.y - p.height;
          p.vy = 0;
          p.onGround = true;

          // Check if Finish platform reached
          if (plat.type === 'finish') {
            if (stage < 3) {
              setStage((s) => s + 1);
              const nextConfig = getStagePlatforms(stage + 1);
              p.x = nextConfig.spawn.x;
              p.y = nextConfig.spawn.y;
              p.vx = 0;
              p.vy = 0;
              playSound('powerup', soundEnabled);
            } else {
              setGameWon(true);
              playSound('powerup', soundEnabled);
            }
          }
        }
      });

      // Check Hazard Collisions (Lava / Lasers)
      currentConfig.hazards.forEach((haz) => {
        if (
          p.x + p.width > haz.x &&
          p.x < haz.x + haz.w &&
          p.y + p.height > haz.y &&
          p.y < haz.y + haz.h
        ) {
          // OOF! Respawn
          respawn();
        }
      });

      // Pit fall
      if (p.y > CANVAS_HEIGHT) {
        respawn();
      }

      // Render Graphics
      // Roblox Skybox
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.6, '#38bdf8');
      skyGrad.addColorStop(1, '#bae6fd');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Distant Roblox clouds & blocky mountains
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(40, 60, 90, 24);
      ctx.fillRect(70, 48, 50, 24);
      ctx.fillRect(320, 80, 110, 26);
      ctx.fillRect(350, 68, 60, 26);

      // Render Platforms (Studded Roblox Block style!)
      currentConfig.platforms.forEach((plat) => {
        // Platform main block
        ctx.fillStyle = plat.color;
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

        // Platform border & bevel
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 2;
        ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);

        // Cylindrical studs on top of Roblox bricks!
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        for (let sx = plat.x + 8; sx < plat.x + plat.w - 4; sx += 14) {
          ctx.beginPath();
          ctx.arc(sx, plat.y + 3, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Finish platform marker
        if (plat.type === 'finish') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('WIN', plat.x + plat.w / 2 - 11, plat.y + 14);
        }
      });

      // Render Hazards (Lava & Neon Lasers)
      currentConfig.hazards.forEach((haz) => {
        ctx.fillStyle = haz.color;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.fillRect(haz.x, haz.y, haz.w, haz.h);

        // Lava glow lines
        ctx.fillStyle = '#fbbf24';
        for (let lx = haz.x + 10; lx < haz.x + haz.w; lx += 30) {
          ctx.fillRect(lx, haz.y + 2, 12, 3);
        }
      });
      ctx.shadowBlur = 0;

      // Draw Roblox Avatar (Blocky "Noob" / Character)
      ctx.save();
      ctx.translate(p.x, p.y);

      // Head (Yellow Block)
      ctx.fillStyle = '#fde047';
      ctx.fillRect(5, 0, 14, 12);
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1;
      ctx.strokeRect(5, 0, 14, 12);

      // Face (Classic smile)
      ctx.fillStyle = '#0f172a';
      if (p.facing === 'right') {
        ctx.fillRect(13, 3, 2, 2); // eye
        ctx.fillRect(11, 7, 4, 1.5); // smile
      } else {
        ctx.fillRect(9, 3, 2, 2); // eye
        ctx.fillRect(9, 7, 4, 1.5); // smile
      }

      // Torso (Cyan / Blue block)
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(4, 12, 16, 14);
      ctx.strokeStyle = '#0891b2';
      ctx.strokeRect(4, 12, 16, 14);

      // Roblox Block Logo on Chest
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(10, 15, 4, 4);

      // Left & Right Arms (Yellow blocks)
      ctx.fillStyle = '#fde047';
      ctx.fillRect(0, 12, 4, 13);
      ctx.fillRect(20, 12, 4, 13);

      // Legs (Green / Dark Blue blocks)
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(4, 26, 7, 10);
      ctx.fillRect(13, 26, 7, 10);

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [activeTab, stage, getStagePlatforms, respawn, soundEnabled]);

  return (
    <div className="flex flex-col items-center justify-center p-4 select-none">
      {/* Tab Switcher: Blox Obby vs Web Cloud Launcher */}
      <div className="w-full max-w-[540px] flex items-center justify-between mb-3 text-xs font-mono uppercase tracking-wider text-slate-300">
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('obby')}
            className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
              activeTab === 'obby' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Blox Obby Run
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'cloud' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Cloud Launcher
          </button>
        </div>

        {activeTab === 'obby' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs">
              <span className="text-slate-400">STAGE:</span>
              <span className="text-amber-400 font-bold tabular-nums">{stage}/3</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs">
              <span className="text-slate-400">OOFS:</span>
              <span className="text-red-400 font-bold tabular-nums">{deaths}</span>
            </div>
            <button
              onClick={resetObby}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Reset Obby"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Blox Obby Parkour Simulator */}
      {activeTab === 'obby' && (
        <div className="relative border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-950">
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block max-w-[540px] w-full" />

          {/* Victory Modal */}
          {gameWon && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <Trophy className="w-12 h-12 text-yellow-400 mb-2 animate-bounce" />
              <span className="text-yellow-400 font-black text-2xl font-mono uppercase mb-1">
                OBBY COMPLETED!
              </span>
              <p className="text-slate-300 text-sm mb-4">
                You mastered all 3 Roblox parkour stages with only{' '}
                <span className="text-red-400 font-bold">{deaths}</span> deaths!
              </p>
              <button
                onClick={resetObby}
                className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs rounded-lg uppercase tracking-wider shadow-lg"
              >
                Play Again
              </button>
            </div>
          )}

          {/* Controls Footer Overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-2xs font-mono text-slate-700 px-2 pointer-events-none">
            <span>A/D or Arrows: Move</span>
            <span>Space / Up: Jump</span>
            <span>R: Respawn</span>
          </div>
        </div>
      )}

      {/* Tab 2: Cloud Web Launcher / Proxy Mode */}
      {activeTab === 'cloud' && (
        <div className="w-full max-w-[540px] bg-slate-900 border-2 border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-200">Roblox Cloud Web Session</span>
            <p className="text-2xs text-slate-400">
              Launch real Roblox unblocked through browser cloud gaming (now.gg proxy or custom school web proxy URL).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={proxyInput}
              onChange={(e) => setProxyInput(e.target.value)}
              placeholder="Enter web proxy URL or now.gg embed URL..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-red-500"
            />
            <button
              onClick={() => setCloudUrl(proxyInput)}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition-colors whitespace-nowrap"
            >
              Load Session
            </button>
          </div>

          {/* Sandboxed Cloud Frame */}
          <div className="relative aspect-video w-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col items-center justify-center">
            <iframe
              src={cloudUrl}
              title="Roblox Web Launcher"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              allow="fullscreen; autoplay"
            />
            <div className="absolute top-2 right-2 flex gap-1.5">
              <a
                href={cloudUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-md text-2xs text-slate-300 font-medium transition-colors backdrop-blur-xs"
              >
                <ExternalLink className="w-3 h-3" />
                Open External Tab
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Touch controls for Obby */}
      {activeTab === 'obby' && (
        <div className="mt-3 flex items-center justify-between w-full max-w-[540px] md:hidden px-2">
          <div className="flex gap-2">
            <button
              onTouchStart={() => {
                keysRef.current.left = true;
                playerRef.current.facing = 'left';
              }}
              onTouchEnd={() => (keysRef.current.left = false)}
              className="px-5 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold"
            >
              ◀
            </button>
            <button
              onTouchStart={() => {
                keysRef.current.right = true;
                playerRef.current.facing = 'right';
              }}
              onTouchEnd={() => (keysRef.current.right = false)}
              className="px-5 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold"
            >
              ▶
            </button>
          </div>
          <button
            onTouchStart={() => {
              if (playerRef.current.onGround) {
                playerRef.current.vy = JUMP_FORCE;
                playerRef.current.onGround = false;
                playSound('jump', soundEnabled);
              }
            }}
            className="px-6 py-3 bg-red-600 active:bg-red-500 rounded-lg text-white font-bold uppercase tracking-wider text-xs"
          >
            JUMP ▲
          </button>
        </div>
      )}
    </div>
  );
};
