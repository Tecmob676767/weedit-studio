import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Palette, 
  Volume2, 
  Type, 
  Key, 
  Trash2, 
  RotateCcw,
  Eye,
  Shuffle,
  FileAudio
} from 'lucide-react';
import { projectStore } from '../../state/projectStore';
import { AudioEngine } from '../../engine/AudioEngine';
import type { Clip, ColorGrading, Keyframe } from '../../types';

export const PropertiesInspector: React.FC = () => {
  const [, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState<'transform' | 'color' | 'chroma' | 'audio' | 'text' | 'transition'>('transform');

  useEffect(() => {
    const unsub = projectStore.subscribe(() => setTick((t) => t + 1));
    return () => {
      unsub();
    };
  }, []);

  const selectedClip = projectStore.getSelectedClip();

  if (!selectedClip) {
    return (
      <div className="w-80 bg-[#121620] border-l border-slate-800 flex flex-col items-center justify-center p-6 text-center select-none z-20">
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
          <Sliders className="w-6 h-6" />
        </div>
        <h4 className="text-xs font-bold text-slate-300">No Clip Selected</h4>
        <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
          Select any video, audio, image, or text clip on the timeline to inspect and edit its parameters.
        </p>
      </div>
    );
  }

  // Update helper
  const updateTransform = (partial: Partial<typeof selectedClip.transform>) => {
    projectStore.updateClip(selectedClip.id, {
      transform: { ...selectedClip.transform, ...partial }
    });
  };

  const updateColorGrading = (partial: Partial<ColorGrading>) => {
    projectStore.updateClip(selectedClip.id, {
      colorGrading: { ...selectedClip.colorGrading, ...partial }
    });
  };

  const updateChromaKey = (partial: Partial<typeof selectedClip.chromaKey>) => {
    projectStore.updateClip(selectedClip.id, {
      chromaKey: { ...selectedClip.chromaKey, ...partial }
    });
  };

  const updateAudio = (partial: any) => {
    projectStore.updateClip(selectedClip.id, {
      audioProps: { ...(selectedClip.audioProps || { volume: 1, pan: 0, bass: 0, mid: 0, treble: 0, reverb: 0, speed: 1, muted: false, pitchCorrection: true }), ...partial }
    });
  };

  const updateText = (partial: any) => {
    projectStore.updateClip(selectedClip.id, {
      textProps: { ...(selectedClip.textProps || {}), ...partial } as any
    });
  };

  // Add Keyframe at current playhead time
  const handleAddKeyframe = (property: 'scale' | 'opacity' | 'x' | 'y' | 'rotation') => {
    const currentTime = projectStore.getCurrentTime();
    const localTime = Math.max(0, Math.min(selectedClip.duration, currentTime - selectedClip.startTime));
    const currentValue = selectedClip.transform[property];

    const newKeyframe: Keyframe = {
      id: 'kf-' + Date.now(),
      time: Math.round(localTime * 100) / 100,
      property,
      value: currentValue
    };

    const existingFiltered = selectedClip.keyframes.filter(
      (k) => !(k.property === property && Math.abs(k.time - localTime) < 0.05)
    );

    projectStore.updateClip(selectedClip.id, {
      keyframes: [...existingFiltered, newKeyframe]
    });
  };

  const removeKeyframe = (id: string) => {
    projectStore.updateClip(selectedClip.id, {
      keyframes: selectedClip.keyframes.filter((k) => k.id !== id)
    });
  };

  const handleDetachAudio = async () => {
    if (selectedClip.type !== 'video') return;
    try {
      const resp = await fetch(selectedClip.src);
      const blob = await resp.blob();
      const { url, duration, waveform } = await AudioEngine.getInstance().extractAudioFromVideo(blob);

      const audioClip: Clip = {
        id: 'detached-audio-' + Date.now(),
        trackId: 'a1',
        name: `Audio (${selectedClip.name})`,
        type: 'audio',
        src: url,
        startTime: selectedClip.startTime,
        duration: selectedClip.duration,
        sourceStart: selectedClip.sourceStart,
        sourceDuration: duration,
        transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'source-over' },
        keyframes: [],
        colorGrading: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, exposure: 0, vignette: 0, hue: 0, blur: 0, sepia: 0, invert: 0 },
        chromaKey: { enabled: false, color: '#00ff00', tolerance: 35, softness: 15 },
        effect: 'none',
        effectIntensity: 0,
        transitionIn: { type: 'none', duration: 0.5 },
        transitionOut: { type: 'none', duration: 0.5 },
        audioProps: { volume: 1, pan: 0, bass: 0, mid: 0, treble: 0, reverb: 0, speed: 1, muted: false, pitchCorrection: true },
        waveform
      };

      projectStore.addClip(audioClip);
      projectStore.updateClip(selectedClip.id, {
        audioProps: { ...(selectedClip.audioProps || { volume: 0, pan: 0, bass: 0, mid: 0, treble: 0, reverb: 0, speed: 1, pitchCorrection: true }), volume: 0, muted: true }
      });
    } catch {
      alert('Could not detach audio. Ensure the video clip has a valid audio track.');
    }
  };

  return (
    <div className="w-80 bg-[#121620] border-l border-slate-800 flex flex-col h-full select-none z-20">
      {/* Clip Header Title */}
      <div className="p-3 bg-[#0e1118] border-b border-slate-800 flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-xs font-bold text-slate-200 truncate">{selectedClip.name}</span>
          </div>
          <button
            onClick={() => projectStore.deleteClip(selectedClip.id)}
            className="p-1 rounded hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition-colors"
            title="Delete Clip (Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {selectedClip.type === 'video' && (
          <button
            onClick={handleDetachAudio}
            className="w-full flex items-center justify-center space-x-1.5 py-1 px-2 rounded-md bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 text-[11px] font-semibold transition-all hover:scale-[1.01]"
            title="Extract & separate audio from this video clip onto an audio track"
          >
            <FileAudio className="w-3.5 h-3.5" />
            <span>Detach Audio to Separate Track</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-around bg-[#0e1118]/80 border-b border-slate-800 px-1 py-1.5 text-slate-400">
        <button
          onClick={() => setActiveTab('transform')}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            activeTab === 'transform' ? 'text-indigo-400 bg-indigo-950/40 font-semibold' : 'hover:text-slate-200'
          }`}
          title="Transform"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {selectedClip.type !== 'audio' && (
          <button
            onClick={() => setActiveTab('color')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              activeTab === 'color' ? 'text-indigo-400 bg-indigo-950/40 font-semibold' : 'hover:text-slate-200'
            }`}
            title="Color Grading"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
        )}

        {(selectedClip.type === 'video' || selectedClip.type === 'image') && (
          <button
            onClick={() => setActiveTab('chroma')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              activeTab === 'chroma' ? 'text-emerald-400 bg-emerald-950/40 font-semibold' : 'hover:text-slate-200'
            }`}
            title="Chroma Key (Green Screen)"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        )}

        {(selectedClip.type === 'audio' || selectedClip.type === 'video') && (
          <button
            onClick={() => setActiveTab('audio')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              activeTab === 'audio' ? 'text-indigo-400 bg-indigo-950/40 font-semibold' : 'hover:text-slate-200'
            }`}
            title="Audio DSP"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
        )}

        {selectedClip.type === 'text' && (
          <button
            onClick={() => setActiveTab('text')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              activeTab === 'text' ? 'text-indigo-400 bg-indigo-950/40 font-semibold' : 'hover:text-slate-200'
            }`}
            title="Typography"
          >
            <Type className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={() => setActiveTab('transition')}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            activeTab === 'transition' ? 'text-indigo-400 bg-indigo-950/40 font-semibold' : 'hover:text-slate-200'
          }`}
          title="Transitions"
        >
          <Shuffle className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TRANSFORM TAB */}
        {activeTab === 'transform' && (
          <div className="space-y-4">
            {/* Scale */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Scale</span>
                <span className="text-slate-200 font-mono">{(selectedClip.transform.scale * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.05"
                  value={selectedClip.transform.scale}
                  onChange={(e) => updateTransform({ scale: parseFloat(e.target.value) })}
                  className="flex-1"
                />
                <button
                  onClick={() => handleAddKeyframe('scale')}
                  className="p-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white transition-colors"
                  title="Add Keyframe at Playhead"
                >
                  <Key className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Opacity */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Opacity</span>
                <span className="text-slate-200 font-mono">{(selectedClip.transform.opacity * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={selectedClip.transform.opacity}
                  onChange={(e) => updateTransform({ opacity: parseFloat(e.target.value) })}
                  className="flex-1"
                />
                <button
                  onClick={() => handleAddKeyframe('opacity')}
                  className="p-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white transition-colors"
                  title="Add Keyframe at Playhead"
                >
                  <Key className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Rotation */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Rotation</span>
                <span className="text-slate-200 font-mono">{selectedClip.transform.rotation}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={selectedClip.transform.rotation}
                onChange={(e) => updateTransform({ rotation: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Position X / Y */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Position X (px)</span>
                <input
                  type="number"
                  value={selectedClip.transform.x}
                  onChange={(e) => updateTransform({ x: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Position Y (px)</span>
                <input
                  type="number"
                  value={selectedClip.transform.y}
                  onChange={(e) => updateTransform({ y: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Blend Mode */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400">Compositing Blend Mode</span>
              <select
                value={selectedClip.transform.blendMode}
                onChange={(e) => updateTransform({ blendMode: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="source-over">Normal (Default)</option>
                <option value="screen">Screen (Lighten)</option>
                <option value="multiply">Multiply (Darken)</option>
                <option value="overlay">Overlay</option>
                <option value="color-dodge">Color Dodge</option>
                <option value="soft-light">Soft Light</option>
                <option value="difference">Difference</option>
              </select>
            </div>

            {/* Active Keyframes List */}
            {selectedClip.keyframes.length > 0 && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">
                  Keyframes ({selectedClip.keyframes.length})
                </span>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {selectedClip.keyframes.map((kf) => (
                    <div
                      key={kf.id}
                      className="flex items-center justify-between bg-slate-900 p-1.5 rounded text-xs border border-slate-800/80"
                    >
                      <div className="flex items-center space-x-1.5">
                        <Key className="w-3 h-3 text-indigo-400" />
                        <span className="text-slate-300 font-medium capitalize">{kf.property}:</span>
                        <span className="text-slate-400 font-mono">{kf.value}</span>
                        <span className="text-[10px] text-slate-500 font-mono">@{kf.time}s</span>
                      </div>
                      <button
                        onClick={() => removeKeyframe(kf.id)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* COLOR GRADING TAB */}
        {activeTab === 'color' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Pro Color Grading</span>
              <button
                onClick={() =>
                  updateColorGrading({
                    brightness: 0,
                    contrast: 0,
                    saturation: 0,
                    temperature: 0,
                    tint: 0,
                    vignette: 0,
                    blur: 0,
                    hue: 0,
                    invert: 0
                  })
                }
                className="text-[10px] text-slate-400 hover:text-indigo-400 flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {[
              { label: 'Brightness', key: 'brightness', min: -100, max: 100 },
              { label: 'Contrast', key: 'contrast', min: -100, max: 100 },
              { label: 'Saturation', key: 'saturation', min: -100, max: 100 },
              { label: 'Vignette', key: 'vignette', min: 0, max: 100 },
              { label: 'Hue Shift', key: 'hue', min: -180, max: 180 },
              { label: 'Blur', key: 'blur', min: 0, max: 20 },
            ].map((slider) => (
              <div key={slider.key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">{slider.label}</span>
                  <span className="text-slate-200 font-mono">
                    {(selectedClip.colorGrading as any)[slider.key]}
                  </span>
                </div>
                <input
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  value={(selectedClip.colorGrading as any)[slider.key] || 0}
                  onChange={(e) => updateColorGrading({ [slider.key]: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        )}

        {/* CHROMA KEY (GREEN SCREEN) TAB */}
        {activeTab === 'chroma' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-xs font-semibold text-slate-200">Enable Chroma Key</span>
              <input
                type="checkbox"
                checked={selectedClip.chromaKey?.enabled || false}
                onChange={(e) => updateChromaKey({ enabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0"
              />
            </div>

            {selectedClip.chromaKey?.enabled && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">Keying Color</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={selectedClip.chromaKey.color}
                      onChange={(e) => updateChromaKey({ color: e.target.value })}
                      className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-300 uppercase">
                      {selectedClip.chromaKey.color}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Tolerance</span>
                    <span className="text-slate-200 font-mono">{selectedClip.chromaKey.tolerance}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedClip.chromaKey.tolerance}
                    onChange={(e) => updateChromaKey({ tolerance: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Edge Softness</span>
                    <span className="text-slate-200 font-mono">{selectedClip.chromaKey.softness}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedClip.chromaKey.softness}
                    onChange={(e) => updateChromaKey({ softness: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* AUDIO DSP TAB */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Volume</span>
                <span className="text-slate-200 font-mono">
                  {((selectedClip.audioProps?.volume || 1) * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={selectedClip.audioProps?.volume ?? 1}
                onChange={(e) => updateAudio({ volume: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                3-Band Parametric EQ (dB)
              </span>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Bass (Low)</span>
                  <span className="text-slate-200 font-mono">{selectedClip.audioProps?.bass ?? 0} dB</span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  value={selectedClip.audioProps?.bass ?? 0}
                  onChange={(e) => updateAudio({ bass: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Midrange</span>
                  <span className="text-slate-200 font-mono">{selectedClip.audioProps?.mid ?? 0} dB</span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  value={selectedClip.audioProps?.mid ?? 0}
                  onChange={(e) => updateAudio({ mid: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Treble (High)</span>
                  <span className="text-slate-200 font-mono">{selectedClip.audioProps?.treble ?? 0} dB</span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  value={selectedClip.audioProps?.treble ?? 0}
                  onChange={(e) => updateAudio({ treble: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Playback Speed</span>
                <span className="text-slate-200 font-mono">{selectedClip.audioProps?.speed ?? 1}x</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[0.5, 1.0, 1.5, 2.0].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => updateAudio({ speed: spd })}
                    className={`py-1 text-xs rounded border transition-colors ${
                      (selectedClip.audioProps?.speed ?? 1) === spd
                        ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TEXT TAB */}
        {activeTab === 'text' && selectedClip.textProps && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400">Text Content</span>
              <textarea
                rows={2}
                value={selectedClip.textProps.content}
                onChange={(e) => updateText({ content: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded p-2 text-xs text-white resize-none focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Font Family</span>
                <select
                  value={selectedClip.textProps.font}
                  onChange={(e) => updateText({ font: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="Inter">Inter</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Fira Code">Fira Code</option>
                  <option value="Playfair Display">Playfair</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Font Size (px)</span>
                <input
                  type="number"
                  value={selectedClip.textProps.size}
                  onChange={(e) => updateText({ size: parseInt(e.target.value) || 30 })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Fill Color</span>
                <input
                  type="color"
                  value={selectedClip.textProps.color}
                  onChange={(e) => updateText({ color: e.target.value })}
                  className="w-full h-8 bg-transparent cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Outline Color</span>
                <input
                  type="color"
                  value={selectedClip.textProps.strokeColor}
                  onChange={(e) => updateText({ strokeColor: e.target.value })}
                  className="w-full h-8 bg-transparent cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400">Kinetic Animation</span>
              <select
                value={selectedClip.textProps.animation}
                onChange={(e) => updateText({ animation: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
              >
                <option value="none">None (Static)</option>
                <option value="typewriter">Typewriter Reveal</option>
                <option value="bounce">Pop & Bounce</option>
                <option value="fadeIn">Soft Fade In</option>
              </select>
            </div>
          </div>
        )}

        {/* TRANSITIONS TAB */}
        {activeTab === 'transition' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300">Transition In</span>
              <select
                value={selectedClip.transitionIn?.type || 'none'}
                onChange={(e) =>
                  projectStore.updateClip(selectedClip.id, {
                    transitionIn: {
                      type: e.target.value as any,
                      duration: selectedClip.transitionIn?.duration || 0.5
                    }
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="none">None</option>
                <option value="crossfade">Crossfade</option>
                <option value="zoomIn">Zoom In</option>
                <option value="zoomOut">Zoom Out</option>
                <option value="slideLeft">Slide Left</option>
              </select>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Duration</span>
                  <span className="text-slate-200 font-mono">
                    {(selectedClip.transitionIn?.duration || 0.5).toFixed(1)}s
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={selectedClip.transitionIn?.duration || 0.5}
                  onChange={(e) =>
                    projectStore.updateClip(selectedClip.id, {
                      transitionIn: {
                        type: selectedClip.transitionIn?.type || 'crossfade',
                        duration: parseFloat(e.target.value)
                      }
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
