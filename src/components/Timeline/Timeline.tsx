import React, { useRef, useState, useEffect } from 'react';
import { 
  Scissors, 
  Trash2, 
  Copy, 
  Magnet, 
  ZoomIn, 
  ZoomOut, 
  Plus, 
  Volume2, 
  VolumeX, 
  Lock, 
  Unlock, 
  Music, 
  Video, 
  Type,
  MousePointer,
  Sparkles
} from 'lucide-react';
import { projectStore } from '../../state/projectStore';

export const Timeline: React.FC = () => {
  const [, setTick] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [draggedClip, setDraggedClip] = useState<{ id: string; startX: number; originalStart: number } | null>(null);
  const [trimmingClip, setTrimmingClip] = useState<{ id: string; edge: 'left' | 'right'; startX: number; originalStart: number; originalDuration: number } | null>(null);

  useEffect(() => {
    const unsub = projectStore.subscribe(() => setTick((t) => t + 1));
    return () => {
      unsub();
    };
  }, []);

  const project = projectStore.getProject();
  const currentTime = projectStore.getCurrentTime();
  const zoom = projectStore.getZoom(); // px per second
  const selectedClipId = projectStore.getSelectedClipId();
  const snapToGrid = projectStore.getSnapToGrid();
  const activeTool = projectStore.getActiveTool();

  // Convert time to pixels and vice-versa
  const timeToPx = (time: number) => time * zoom;
  const pxToTime = (px: number) => Math.max(0, px / zoom);

  // Magnetic snapping calculation
  const getSnappedTime = (time: number, thresholdSec: number = 0.15): number => {
    if (!snapToGrid) return time;

    // Check playhead
    if (Math.abs(time - currentTime) < thresholdSec) return currentTime;

    // Check beats
    for (const beat of project.beats) {
      if (Math.abs(time - beat) < thresholdSec) return beat;
    }

    // Check edges of other clips
    for (const clip of project.clips) {
      if (Math.abs(time - clip.startTime) < thresholdSec) return clip.startTime;
      if (Math.abs(time - (clip.startTime + clip.duration)) < thresholdSec) return clip.startTime + clip.duration;
    }

    return time;
  };

  // Scrubber dragging
  const handleRulerMouseDown = (e: React.MouseEvent) => {
    setIsScrubbing(true);
    updateScrubber(e);
  };

  const updateScrubber = (e: React.MouseEvent | MouseEvent) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const scrollLeft = containerRef.current?.scrollLeft || 0;
    const clickX = e.clientX - rect.left + scrollLeft;
    const rawTime = pxToTime(clickX);
    const finalTime = getSnappedTime(rawTime);
    projectStore.setCurrentTime(finalTime);
  };

  // Global mouse move and up for scrubbing, dragging, and trimming
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing) {
        updateScrubber(e);
      } else if (draggedClip) {
        const deltaX = e.clientX - draggedClip.startX;
        const deltaTime = deltaX / zoom;
        let newStartTime = Math.max(0, draggedClip.originalStart + deltaTime);
        newStartTime = getSnappedTime(newStartTime);
        projectStore.updateClip(draggedClip.id, { startTime: Math.round(newStartTime * 100) / 100 });
      } else if (trimmingClip) {
        const deltaX = e.clientX - trimmingClip.startX;
        const deltaTime = deltaX / zoom;
        
        if (trimmingClip.edge === 'right') {
          let newDuration = Math.max(0.3, trimmingClip.originalDuration + deltaTime);
          const rawEndTime = trimmingClip.originalStart + newDuration;
          const snappedEnd = getSnappedTime(rawEndTime);
          newDuration = Math.max(0.3, snappedEnd - trimmingClip.originalStart);
          projectStore.updateClip(trimmingClip.id, { duration: Math.round(newDuration * 100) / 100 });
        } else {
          // Left trim: adjust start time and duration
          let newStart = Math.max(0, trimmingClip.originalStart + deltaTime);
          newStart = getSnappedTime(newStart);
          const timeDiff = newStart - trimmingClip.originalStart;
          const newDuration = Math.max(0.3, trimmingClip.originalDuration - timeDiff);
          projectStore.updateClip(trimmingClip.id, {
            startTime: Math.round(newStart * 100) / 100,
            duration: Math.round(newDuration * 100) / 100
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      setDraggedClip(null);
      setTrimmingClip(null);
    };

    if (isScrubbing || draggedClip || trimmingClip) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isScrubbing, draggedClip, trimmingClip, zoom, snapToGrid, currentTime]);

  // Timeline width in pixels
  const timelinePxWidth = Math.max(1200, (project.duration + 5) * zoom);

  // Time ruler ticks generator
  const renderRulerTicks = () => {
    const ticks = [];
    const stepSeconds = zoom > 120 ? 0.5 : zoom > 50 ? 1 : 2;
    const totalSteps = Math.ceil((project.duration + 5) / stepSeconds);

    for (let i = 0; i < totalSteps; i++) {
      const time = i * stepSeconds;
      const left = timeToPx(time);
      const isMajor = time % (stepSeconds * 2) === 0;

      ticks.push(
        <div
          key={time}
          className="absolute top-0 flex flex-col items-center pointer-events-none"
          style={{ left: `${left}px` }}
        >
          <div className={`w-[1px] ${isMajor ? 'h-3 bg-slate-600' : 'h-1.5 bg-slate-800'}`} />
          {isMajor && (
            <span className="text-[9px] font-mono text-slate-400 mt-0.5 select-none">
              {time.toFixed(1)}s
            </span>
          )}
        </div>
      );
    }
    return ticks;
  };

  return (
    <div className="h-72 bg-[#0c0e14] border-t border-slate-800 flex flex-col select-none z-30">
      {/* Timeline Controls Toolbar */}
      <div className="h-10 bg-[#11141c] border-b border-slate-800/80 px-4 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center space-x-1">
          {/* Select Tool */}
          <button
            onClick={() => projectStore.setActiveTool('select')}
            className={`p-1.5 rounded transition-colors ${
              activeTool === 'select' ? 'bg-indigo-600/30 text-indigo-400' : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="Selection Tool (V)"
          >
            <MousePointer className="w-4 h-4" />
          </button>

          {/* Razor Cut Tool */}
          <button
            onClick={() => projectStore.setActiveTool('split')}
            className={`p-1.5 rounded transition-colors ${
              activeTool === 'split' ? 'bg-indigo-600/30 text-indigo-400' : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="Razor Split Tool (C)"
          >
            <Scissors className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          {/* Split at Playhead */}
          <button
            onClick={() => projectStore.splitClipAtPlayhead()}
            disabled={!selectedClipId}
            className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Split Selected Clip at Current Time"
          >
            <Scissors className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px]">Split Clip</span>
          </button>

          {/* Delete Clip */}
          <button
            onClick={() => selectedClipId && projectStore.deleteClip(selectedClipId)}
            disabled={!selectedClipId}
            className="p-1.5 rounded hover:bg-red-950/60 text-slate-400 hover:text-red-400 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Delete Selected Clip (Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Duplicate Clip */}
          <button
            onClick={() => selectedClipId && projectStore.duplicateClip(selectedClipId)}
            disabled={!selectedClipId}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Duplicate Selected Clip (Ctrl+D)"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          {/* Magnetic Snap Toggle */}
          <button
            onClick={() => projectStore.setSnapToGrid(!snapToGrid)}
            className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
              snapToGrid ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="Toggle Magnetic Snapping"
          >
            <Magnet className="w-3.5 h-3.5" />
            <span className="text-[11px]">Magnetic Snap</span>
          </button>

          {/* Auto Beat Markers */}
          <button
            onClick={() => {
              // Generate rhythmic beats e.g. every 0.8s
              const newBeats = [];
              for (let b = 0.6; b < project.duration; b += 0.8) {
                newBeats.push(Math.round(b * 100) / 100);
              }
              projectStore.setBeats(newBeats);
            }}
            className="flex items-center space-x-1 px-2 py-1 rounded bg-amber-950/30 border border-amber-600/30 text-amber-400 hover:bg-amber-950/60 transition-colors"
            title="Generate Rhythm Beat Markers"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[11px]">Auto Beat Marks</span>
          </button>
        </div>

        {/* Zoom Controls & Add Track */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => projectStore.setZoom(zoom - 15)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min="25"
              max="200"
              value={zoom}
              onChange={(e) => projectStore.setZoom(parseInt(e.target.value))}
              className="w-20"
            />
            <button
              onClick={() => projectStore.setZoom(zoom + 15)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-slate-800" />

          {/* Add Track Menu */}
          <div className="relative group">
            <button className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors">
              <Plus className="w-3.5 h-3.5" />
              <span className="text-[11px]">Track</span>
            </button>
            <div className="absolute right-0 bottom-full mb-1 w-32 bg-[#161a23] border border-slate-700 rounded-lg shadow-2xl py-1 hidden group-hover:block z-50">
              <button
                onClick={() => projectStore.addTrack('video', 'Overlay Track')}
                className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-indigo-600/20 hover:text-indigo-300"
              >
                + Video Track
              </button>
              <button
                onClick={() => projectStore.addTrack('audio', 'SFX Track')}
                className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-indigo-600/20 hover:text-indigo-300"
              >
                + Audio Track
              </button>
              <button
                onClick={() => projectStore.addTrack('text', 'Title Track')}
                className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-indigo-600/20 hover:text-indigo-300"
              >
                + Text Track
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Multi-Track Lanes and Ruler */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers Column (Sticky Left) */}
        <div className="w-48 bg-[#0f121a] border-r border-slate-800 flex flex-col z-20 shrink-0">
          <div className="h-6 bg-[#0c0e14] border-b border-slate-800 flex items-center px-3 text-[10px] font-mono text-slate-400">
            TRACKS
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {[...project.tracks].reverse().map((track) => (
              <div
                key={track.id}
                className="h-12 border-b border-slate-800/80 px-3 flex items-center justify-between bg-[#11141c]/50 hover:bg-[#11141c] transition-colors"
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    track.type === 'video' ? 'bg-indigo-500' : track.type === 'audio' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                  <span className="text-xs font-semibold text-slate-200 truncate">{track.name}</span>
                </div>

                <div className="flex items-center space-x-1 text-slate-500">
                  <button
                    onClick={() => projectStore.toggleMuteTrack(track.id)}
                    className="hover:text-slate-300 p-1"
                    title={track.isMuted ? 'Unmute Track' : 'Mute Track'}
                  >
                    {track.isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => projectStore.toggleLockTrack(track.id)}
                    className="hover:text-slate-300 p-1"
                    title={track.isLocked ? 'Unlock Track' : 'Lock Track'}
                  >
                    {track.isLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Tracks & Timeline Lanes */}
        <div
          ref={containerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden relative bg-[#090a0f]"
        >
          <div style={{ width: `${timelinePxWidth}px`, minWidth: '100%' }} className="relative h-full">
            {/* Time Ruler (Top Bar) */}
            <div
              ref={rulerRef}
              onMouseDown={handleRulerMouseDown}
              className="h-6 bg-[#0c0f16] border-b border-slate-800 relative cursor-pointer select-none"
            >
              {renderRulerTicks()}

              {/* Rhythm Beat Snapping Diamonds */}
              {project.beats.map((beat, idx) => (
                <div
                  key={idx}
                  className="absolute top-1 w-2 h-2 bg-amber-400/80 rotate-45 pointer-events-none -ml-1 shadow-sm shadow-amber-500/50"
                  style={{ left: `${timeToPx(beat)}px` }}
                  title={`Beat: ${beat}s`}
                />
              ))}
            </div>

            {/* Track Lanes */}
            <div className="flex flex-col">
              {[...project.tracks].reverse().map((track) => {
                const trackClips = project.clips.filter((c) => c.trackId === track.id);

                return (
                  <div
                    key={track.id}
                    className="h-12 border-b border-slate-800/40 relative flex items-center bg-slate-950/20"
                  >
                    {trackClips.map((clip) => {
                      const isSelected = selectedClipId === clip.id;
                      const clipLeft = timeToPx(clip.startTime);
                      const clipWidth = timeToPx(clip.duration);

                      // Style accents by clip type
                      let bgGrad = 'from-indigo-900/80 to-indigo-800/80 border-indigo-500/60';
                      let icon = <Video className="w-3.5 h-3.5 text-indigo-300 mr-1.5" />;
                      if (clip.type === 'audio') {
                        bgGrad = 'from-emerald-950/90 to-teal-900/90 border-emerald-500/60';
                        icon = <Music className="w-3.5 h-3.5 text-emerald-300 mr-1.5" />;
                      } else if (clip.type === 'text') {
                        bgGrad = 'from-amber-950/90 to-orange-900/90 border-amber-500/60';
                        icon = <Type className="w-3.5 h-3.5 text-amber-300 mr-1.5" />;
                      }

                      return (
                        <div
                          key={clip.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeTool === 'split') {
                              projectStore.splitClipAtPlayhead(clip.id);
                            } else {
                              projectStore.selectClip(clip.id);
                            }
                          }}
                          onMouseDown={(e) => {
                            if (activeTool === 'select') {
                              projectStore.selectClip(clip.id);
                              setDraggedClip({
                                id: clip.id,
                                startX: e.clientX,
                                originalStart: clip.startTime
                              });
                            }
                          }}
                          style={{
                            left: `${clipLeft}px`,
                            width: `${clipWidth}px`,
                          }}
                          className={`absolute h-10 top-1 rounded-md border bg-gradient-to-r ${bgGrad} shadow-lg cursor-grab active:cursor-grabbing flex items-center px-2 text-xs text-white overflow-hidden transition-shadow ${
                            isSelected ? 'ring-2 ring-indigo-400 border-white shadow-indigo-500/40 z-10' : ''
                          }`}
                        >
                          {/* Left Trim Handle */}
                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setTrimmingClip({
                                id: clip.id,
                                edge: 'left',
                                startX: e.clientX,
                                originalStart: clip.startTime,
                                originalDuration: clip.duration
                              });
                            }}
                            className="absolute left-0 top-0 bottom-0 w-2.5 bg-white/20 hover:bg-white/60 cursor-ew-resize rounded-l-md"
                            title="Trim Clip Start"
                          />

                          {/* Clip Content Label & Waveform */}
                          <div className="flex items-center truncate pl-1 pr-1 pointer-events-none">
                            {icon}
                            <span className="font-semibold text-[11px] truncate">{clip.name}</span>
                            <span className="text-[10px] text-slate-300/80 font-mono ml-1.5">
                              {clip.duration.toFixed(1)}s
                            </span>
                          </div>

                          {/* Visual Waveform for Audio */}
                          {clip.type === 'audio' && clip.waveform && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-around opacity-30 px-3">
                              {clip.waveform.map((amp, idx) => (
                                <div
                                  key={idx}
                                  className="w-[1.5px] bg-white rounded-full"
                                  style={{ height: `${Math.max(4, amp * 28)}px` }}
                                />
                              ))}
                            </div>
                          )}

                          {/* Keyframe Diamond Indicators */}
                          {clip.keyframes.map((kf) => (
                            <div
                              key={kf.id}
                              className="absolute bottom-1 w-2 h-2 bg-indigo-300 rotate-45 border border-indigo-900 pointer-events-none"
                              style={{ left: `${(kf.time / clip.duration) * 100}%` }}
                              title={`Keyframe: ${kf.property}`}
                            />
                          ))}

                          {/* Right Trim Handle */}
                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setTrimmingClip({
                                id: clip.id,
                                edge: 'right',
                                startX: e.clientX,
                                originalStart: clip.startTime,
                                originalDuration: clip.duration
                              });
                            }}
                            className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/20 hover:bg-white/60 cursor-ew-resize rounded-r-md"
                            title="Trim Clip End"
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Vertical Red Playhead Line */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-red-500 pointer-events-none z-30 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
              style={{ left: `${timeToPx(currentTime)}px` }}
            >
              <div className="w-3.5 h-3.5 bg-red-500 rounded-sm rotate-45 -ml-[6px] -mt-[6px] border border-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
