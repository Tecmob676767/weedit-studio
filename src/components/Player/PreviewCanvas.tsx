import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Repeat,
  Activity
} from 'lucide-react';
import { projectStore } from '../../state/projectStore';
import { Renderer, getResolutionForAspect } from '../../engine/Renderer';
import { AudioEngine } from '../../engine/AudioEngine';

export const PreviewCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [, setTick] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [vuLevel, setVuLevel] = useState(0);
  const [showSafeGuides, setShowSafeGuides] = useState(false);

  const audioEngine = AudioEngine.getInstance();

  useEffect(() => {
    const unsub = projectStore.subscribe(() => setTick((t) => t + 1));
    return () => {
      unsub();
    };
  }, []);

  // Initialize Renderer once
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new Renderer(canvasRef.current);
    }
  }, []);

  // Format seconds to frame-accurate timecode HH:MM:SS:FF
  const formatTimecode = useCallback((seconds: number, fps: number = 30) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * fps);
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  }, []);

  // Main Render & Playback Loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      const project = projectStore.getProject();
      const isPlaying = projectStore.getIsPlaying();
      let currentTime = projectStore.getCurrentTime();

      if (isPlaying) {
        currentTime += delta;
        if (currentTime >= project.duration) {
          if (isLooping) {
            currentTime = 0;
          } else {
            currentTime = project.duration;
            projectStore.setIsPlaying(false);
          }
        }
        projectStore.setCurrentTime(currentTime);

        // Update live VU meter
        const level = audioEngine.getVUMeterData();
        setVuLevel(level);
      } else {
        setVuLevel(0);
      }

      if (rendererRef.current) {
        rendererRef.current.syncMediaPlayback(project, currentTime, isPlaying);
        rendererRef.current.renderFrame(project, currentTime);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isLooping]);

  // Keyboard shortcut for Play/Pause (Spacebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        projectStore.setIsPlaying(!projectStore.getIsPlaying());
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const fps = projectStore.getProject().fps;
        projectStore.setCurrentTime(projectStore.getCurrentTime() - 1 / fps);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        const fps = projectStore.getProject().fps;
        projectStore.setCurrentTime(projectStore.getCurrentTime() + 1 / fps);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const project = projectStore.getProject();
  const isPlaying = projectStore.getIsPlaying();
  const currentTime = projectStore.getCurrentTime();
  const res = getResolutionForAspect(project.aspectRatio);

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-[#090b10] flex flex-col items-center justify-between p-4 overflow-hidden relative select-none"
    >
      {/* Top Monitor Bar */}
      <div className="w-full flex items-center justify-between text-xs text-slate-400 px-2 py-1">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-300">PREVIEW</span>
          <span className="text-[10px] bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
            {res.width} x {res.height}
          </span>
        </div>

        {/* Audio VU Meter */}
        <div className="flex items-center space-x-2 bg-slate-900/90 px-3 py-1 rounded-full border border-slate-800">
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <div className="flex items-center space-x-0.5 w-24 h-2 bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                vuLevel > 0.7 ? 'bg-red-500' : vuLevel > 0.4 ? 'bg-yellow-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, vuLevel * 100)}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => setShowSafeGuides(!showSafeGuides)}
          className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
            showSafeGuides ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Safe Guides
        </button>
      </div>

      {/* Canvas Viewport Area */}
      <div className="flex-1 w-full flex items-center justify-center relative min-h-0 py-2">
        <div 
          className="relative max-h-full max-w-full flex items-center justify-center rounded-lg shadow-2xl border border-slate-800/80 overflow-hidden bg-[#000000]"
          style={{
            aspectRatio: `${res.width} / ${res.height}`,
            maxHeight: '100%',
            maxWidth: '100%',
          }}
        >
          <canvas
            ref={canvasRef}
            width={res.width}
            height={res.height}
            className="w-full h-full object-contain"
          />

          {/* Safe Margins Overlay */}
          {showSafeGuides && (
            <div className="absolute inset-0 pointer-events-none border border-cyan-500/30 m-8">
              <div className="absolute inset-0 border border-dashed border-cyan-500/20 m-6" />
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-cyan-500/10" />
              <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-cyan-500/10" />
            </div>
          )}
        </div>
      </div>

      {/* Transport Controls Bar */}
      <div className="w-full max-w-2xl bg-[#11141b]/95 border border-slate-800 rounded-xl px-4 py-2 flex items-center justify-between shadow-xl mt-2 backdrop-blur-md">
        {/* Current Timecode */}
        <div className="flex items-center space-x-1.5 font-mono text-xs">
          <span className="text-indigo-400 font-bold tracking-wider">
            {formatTimecode(currentTime, project.fps)}
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">
            {formatTimecode(project.duration, project.fps)}
          </span>
        </div>

        {/* Playback Transport Buttons */}
        <div className="flex items-center space-x-2">
          {/* Rewind to start */}
          <button
            onClick={() => projectStore.setCurrentTime(0)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Jump to Start (Home)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Step frame backward */}
          <button
            onClick={() => projectStore.setCurrentTime(currentTime - 1 / project.fps)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Previous Frame (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={() => projectStore.setIsPlaying(!isPlaying)}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
            title="Play/Pause (Space)"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Step frame forward */}
          <button
            onClick={() => projectStore.setCurrentTime(currentTime + 1 / project.fps)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Next Frame (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Loop toggle */}
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`p-1.5 rounded-lg transition-colors ${
              isLooping ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Toggle Loop Playback"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Right Utility Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              const nextMute = !isMuted;
              setIsMuted(nextMute);
              audioEngine.setMasterVolume(nextMute ? 0 : 1);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Mute / Unmute Preview"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Fullscreen Monitor"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
