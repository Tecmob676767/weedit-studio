import React, { useState, useEffect } from 'react';
import { 
  Download, 
  RotateCcw, 
  RotateCw, 
  Monitor, 
  Smartphone, 
  Square, 
  Film, 
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';
import { projectStore } from '../../state/projectStore';
import type { AspectRatio } from '../../types';

interface TopNavBarProps {
  onOpenExport: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({ onOpenExport }) => {
  const [, setTick] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const unsub = projectStore.subscribe(() => setTick((t) => t + 1));
    
    // PWA BeforeInstallPrompt listener
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      unsub();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const project = projectStore.getProject();

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const aspectOptions: { label: string; value: AspectRatio; icon: any; category: string }[] = [
    { label: '16:9 (YouTube / TV)', value: '16:9', icon: Monitor, category: 'Standard' },
    { label: '9:16 (TikTok / Reels / Shorts)', value: '9:16', icon: Smartphone, category: 'Vertical' },
    { label: '1:1 (Instagram Post)', value: '1:1', icon: Square, category: 'Square' },
    { label: '4:5 (Instagram Portrait)', value: '4:5', icon: Film, category: 'Social' },
    { label: '21:9 (UltraWide Cinema)', value: '21:9', icon: Layers, category: 'Cinematic' },
    { label: '4:3 (Classic Retro TV / iPad)', value: '4:3', icon: Monitor, category: 'Classic' },
    { label: '3:4 (Vertical Tablet / Story)', value: '3:4', icon: Smartphone, category: 'Tablet' },
    { label: '2:3 (Pinterest / Photo)', value: '2:3', icon: Film, category: 'Photo' },
    { label: '2.39:1 (Anamorphic Widescreen)', value: '2.39:1', icon: Layers, category: 'Cinematic' },
    { label: '9:20 (Ultrawide Smartphone)', value: '9:20', icon: Smartphone, category: 'Vertical' },
  ];

  return (
    <header className="h-14 bg-[#11141b] border-b border-slate-800/80 px-3 flex items-center justify-between z-30 select-none gap-2 overflow-x-auto">
      {/* Brand & Project Name */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
            <Film className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold tracking-wider text-sm bg-gradient-to-r from-white via-indigo-200 to-purple-400 bg-clip-text text-transparent">
              WEEDIT
            </span>
            <span className="text-[8px] font-mono tracking-widest text-indigo-400 uppercase font-semibold hidden sm:block">
              Pro Studio
            </span>
          </div>
        </div>

        {/* Project Name — hidden on very small screens */}
        <input
          type="text"
          value={project.name}
          onChange={(e) => projectStore.setProjectName(e.target.value)}
          className="hidden sm:block bg-slate-900/60 hover:bg-slate-900 border border-slate-700 focus:border-indigo-500 px-2 py-1 rounded text-xs text-slate-200 font-medium focus:outline-none transition-colors w-32 md:w-44 truncate"
          title="Click to rename project"
        />

        {/* Aspect Ratio Selector — hidden on mobile */}
        <div className="relative group hidden sm:block">
          <button className="flex items-center gap-1 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 px-2 py-1 rounded text-xs text-slate-300 transition-colors">
            <span>{project.aspectRatio}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          <div className="absolute left-0 mt-1 w-44 bg-[#161a23] border border-slate-700 rounded-lg shadow-2xl py-1 hidden group-hover:block z-50">
            {aspectOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => projectStore.setAspectRatio(opt.value)}
                className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-indigo-600/20 hover:text-indigo-300 transition-colors ${
                  project.aspectRatio === opt.value ? 'text-indigo-400 font-semibold bg-indigo-950/40' : 'text-slate-300'
                }`}
              >
                <opt.icon className="w-3 h-3" />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <span className="hidden md:inline text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          {project.fps} FPS
        </span>
      </div>

      {/* Center Tools: Undo/Redo — hidden on mobile */}
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={() => projectStore.undo()}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => projectStore.redo()}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          onClick={() => projectStore.loadDemoProject()}
          className="flex items-center gap-1.5 text-xs bg-slate-800/80 hover:bg-indigo-950/60 hover:border-indigo-500/50 border border-slate-700 text-slate-300 hover:text-indigo-300 px-2.5 py-1 rounded transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Demo</span>
        </button>
      </div>

      {/* Right Tools: PWA Install & Export Video */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isInstallable && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium px-2.5 py-1.5 rounded-md shadow-md shadow-emerald-900/30 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install</span>
          </button>
        )}

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-semibold text-xs px-3 py-1.5 rounded-md shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
