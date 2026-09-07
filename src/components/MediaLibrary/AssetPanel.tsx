import React, { useState } from 'react';
import { 
  FolderPlus, 
  Music, 
  Mic, 
  Type, 
  Sparkles, 
  Shuffle, 
  Play, 
  Plus, 
  Video, 
  Wand2,
  FileAudio,
  Smile,
  CheckCircle
} from 'lucide-react';
import { projectStore, createSampleVideoBlob } from '../../state/projectStore';
import { AudioEngine } from '../../engine/AudioEngine';
import { SpeechCaptionEngine } from '../../engine/SpeechCaptionEngine';
import type { Clip, ClipFilterEffect, ClipTransition, TextProperties, ColorGrading } from '../../types';

export const AssetPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'media' | 'audio' | 'stickers' | 'text' | 'effects' | 'transitions' | 'voiceover'>('media');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [autoCaptionText, setAutoCaptionText] = useState('Create epic videos with WeEdit studio right in your browser. Fully offline and ultra fast!');
  const [extractStatus, setExtractStatus] = useState<string | null>(null);

  const audioEngine = AudioEngine.getInstance();
  const captionEngine = new SpeechCaptionEngine();

  // Extract Audio from Video Handler
  const handleExtractAudioFromVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setExtractStatus('Extracting audio track from video...');
      const { url, duration, waveform } = await audioEngine.extractAudioFromVideo(file);

      const newClip: Clip = {
        id: 'extracted-audio-' + Date.now(),
        trackId: 'a1',
        name: `Audio from ${file.name}`,
        type: 'audio',
        src: url,
        startTime: projectStore.getCurrentTime(),
        duration: Math.max(0.5, duration),
        sourceStart: 0,
        sourceDuration: duration,
        transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'source-over' },
        keyframes: [],
        colorGrading: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, exposure: 0, vignette: 0, hue: 0, blur: 0, sepia: 0, invert: 0 },
        chromaKey: { enabled: false, color: '#00ff00', tolerance: 35, softness: 15 },
        effect: 'none',
        effectIntensity: 0,
        transitionIn: { type: 'none', duration: 0.5 },
        transitionOut: { type: 'none', duration: 0.5 },
        audioProps: { volume: 1.0, pan: 0, bass: 0, mid: 0, treble: 0, reverb: 0, speed: 1, muted: false, pitchCorrection: true },
        waveform
      };

      projectStore.addClip(newClip);
      setExtractStatus(`Extracted ${duration.toFixed(1)}s audio successfully!`);
      setTimeout(() => setExtractStatus(null), 4000);
    } catch (err) {
      alert('Could not decode audio from this video file. Ensure the video contains a valid audio stream.');
      setExtractStatus(null);
    }
    e.target.value = '';
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video');
      const isAudio = file.type.startsWith('audio');
      const isImage = file.type.startsWith('image');

      if (isVideo) {
        const video = document.createElement('video');
        video.src = url;
        video.onloadedmetadata = () => {
          const duration = Math.min(60, video.duration || 5);
          const newClip: Clip = {
            id: 'clip-' + Date.now() + Math.random(),
            trackId: 'v1',
            name: file.name,
            type: 'video',
            src: url,
            startTime: projectStore.getCurrentTime(),
            duration: duration,
            sourceStart: 0,
            sourceDuration: video.duration || 5,
            transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'source-over' },
            keyframes: [],
            colorGrading: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, exposure: 0, vignette: 0, hue: 0, blur: 0, sepia: 0, invert: 0 },
            chromaKey: { enabled: false, color: '#00ff00', tolerance: 35, softness: 15 },
            effect: 'none',
            effectIntensity: 0,
            transitionIn: { type: 'none', duration: 0.5 },
            transitionOut: { type: 'none', duration: 0.5 }
          };
          projectStore.addClip(newClip);
        };
      } else if (isAudio) {
        const audio = new Audio(url);
        audio.onloadedmetadata = () => {
          const duration = Math.min(120, audio.duration || 5);
          const newClip: Clip = {
            id: 'clip-' + Date.now() + Math.random(),
            trackId: 'a1',
            name: file.name,
            type: 'audio',
            src: url,
            startTime: projectStore.getCurrentTime(),
            duration: duration,
            sourceStart: 0,
            sourceDuration: audio.duration || 5,
            transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'source-over' },
            keyframes: [],
            colorGrading: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, exposure: 0, vignette: 0, hue: 0, blur: 0, sepia: 0, invert: 0 },
            chromaKey: { enabled: false, color: '#00ff00', tolerance: 35, softness: 15 },
            effect: 'none',
            effectIntensity: 0,
            transitionIn: { type: 'none', duration: 0.5 },
            transitionOut: { type: 'none', duration: 0.5 },
            audioProps: { volume: 1, pan: 0, bass: 0, mid: 0, treble: 0, reverb: 0, speed: 1, muted: false, pitchCorrection: true }
          };
          projectStore.addClip(newClip);
        };
      } else if (isImage) {
        const newClip: Clip = {
          id: 'clip-' + Date.now() + Math.random(),
          trackId: 'v1',
          name: file.name,
          type: 'image',
          src: url,
          startTime: projectStore.getCurrentTime(),
          duration: 4.0,
          sourceStart: 0,
          sourceDuration: 4.0,
          transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'source-over' },
          keyframes: [],
          colorGrading: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, exposure: 0, vignette: 0, hue: 0, blur: 0, sepia: 0, invert: 0 },
          chromaKey: { enabled: false, color: '#00ff00', tolerance: 35, softness: 15 },
          effect: 'none',
          effectIntensity: 0,
          transitionIn: { type: 'none', duration: 0.5 },
          transitionOut: { type: 'none', duration: 0.5 }
        };
        projectStore.addClip(newClip);
      }
    });

    e.target.value = '';
  };

  // Add procedural sound effect
  const handleAddSFX = (type: 'whoosh' | 'impact' | 'pop' | 'riser' | 'ding' | 'subdrop', name: string) => {
    const buffer = audioEngine.generateProceduralSFX(type);
    const url = audioEngine.audioBufferToWavBlobUrl(buffer);
    const waveform = audioEngine.extractWaveform(buffer, 60);

    const newClip: Clip = {
      id: 'sfx-' + Date.now() + Math.random(),
      trackId: 'a2',
      name: `${name} (SFX)`,
      type: 'audio',
      src: url,
      startTime: projectStore.getCurrentTime(),
      duration: buffer.duration,
      sourceStart: 0,
      sourceDuration: buffer.duration,
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
    projectStore.addClip(newClip);
  };

  const previewSFX = (type: 'whoosh' | 'impact' | 'pop' | 'riser' | 'ding' | 'subdrop') => {
    const buffer = audioEngine.generateProceduralSFX(type);
    const ctx = audioEngine.getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  };

  // Voiceover recorder
  const toggleVoiceRecording = async () => {
    if (!isRecordingVoice) {
      try {
        await audioEngine.startVoiceoverRecording();
        setIsRecordingVoice(true);
        setRecordingSeconds(0);
        const interval = setInterval(() => {
          setRecordingSeconds((s) => s + 1);
        }, 1000);
        (window as any).__voiceInterval = interval;
      } catch {
        alert('Microphone access was denied or is not available.');
      }
    } else {
      clearInterval((window as any).__voiceInterval);
      setIsRecordingVoice(false);
      const { url } = await audioEngine.stopVoiceoverRecording();
      if (url) {
        const newClip: Clip = {
          id: 'voice-' + Date.now(),
          trackId: 'a2',
          name: `Voiceover (${recordingSeconds}s)`,
          type: 'audio',
          src: url,
          startTime: projectStore.getCurrentTime(),
          duration: Math.max(1, recordingSeconds),
          sourceStart: 0,
          sourceDuration: Math.max(1, recordingSeconds),
          transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'source-over' },
          keyframes: [],
          colorGrading: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, exposure: 0, vignette: 0, hue: 0, blur: 0, sepia: 0, invert: 0 },
          chromaKey: { enabled: false, color: '#00ff00', tolerance: 35, softness: 15 },
          effect: 'none',
          effectIntensity: 0,
          transitionIn: { type: 'none', duration: 0.5 },
          transitionOut: { type: 'none', duration: 0.5 },
          audioProps: { volume: 1.2, pan: 0, bass: 2, mid: 1, treble: 2, reverb: 5, speed: 1, muted: false, pitchCorrection: true }
        };
        projectStore.addClip(newClip);
      }
    }
  };

  // Add animated text title
  const handleAddText = (type: 'title' | 'sub' | 'kinetic' | 'glow') => {
    let textProps: TextProperties = {
      content: 'YOUR TITLE HERE',
      font: 'Inter',
      size: 60,
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 2,
      backgroundColor: 'transparent',
      bgPadding: 16,
      shadowColor: 'rgba(0,0,0,0.8)',
      shadowBlur: 10,
      textAlign: 'center',
      animation: 'none'
    };

    if (type === 'kinetic') {
      textProps.content = 'TYPEWRITER TEXT';
      textProps.animation = 'typewriter';
      textProps.backgroundColor = 'rgba(15, 23, 42, 0.8)';
    } else if (type === 'glow') {
      textProps.content = 'CYBER GLOW';
      textProps.font = 'Montserrat';
      textProps.color = '#38bdf8';
      textProps.shadowColor = '#0284c7';
      textProps.shadowBlur = 25;
      textProps.animation = 'bounce';
    }

    const newClip: Clip = {
      id: 'text-' + Date.now(),
      trackId: 'v2',
      name: `Text: ${textProps.content}`,
      type: 'text',
      src: '',
      startTime: projectStore.getCurrentTime(),
      duration: 3.5,
      sourceStart: 0,
      sourceDuration: 3.5,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'source-over' },
      keyframes: [],
      colorGrading: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, exposure: 0, vignette: 0, hue: 0, blur: 0, sepia: 0, invert: 0 },
      chromaKey: { enabled: false, color: '#00ff00', tolerance: 35, softness: 15 },
      effect: 'none',
      effectIntensity: 0,
      transitionIn: { type: 'crossfade', duration: 0.3 },
      transitionOut: { type: 'crossfade', duration: 0.3 },
      textProps
    };
    projectStore.addClip(newClip);
  };

  // Add Sticker Overlay
  const handleAddSticker = (emoji: string, label: string) => {
    const newClip: Clip = {
      id: 'sticker-' + Date.now(),
      trackId: 'v2',
      name: `Sticker: ${label}`,
      type: 'sticker',
      src: emoji,
      startTime: projectStore.getCurrentTime(),
      duration: 3.0,
      sourceStart: 0,
      sourceDuration: 3.0,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'source-over' },
      keyframes: [
        { id: 'kf-s1', time: 0, property: 'scale', value: 0.2 },
        { id: 'kf-s2', time: 0.4, property: 'scale', value: 1.15 },
        { id: 'kf-s3', time: 0.6, property: 'scale', value: 1.0 }
      ],
      colorGrading: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, exposure: 0, vignette: 0, hue: 0, blur: 0, sepia: 0, invert: 0 },
      chromaKey: { enabled: false, color: '#00ff00', tolerance: 35, softness: 15 },
      effect: 'none',
      effectIntensity: 0,
      transitionIn: { type: 'zoomIn', duration: 0.4 },
      transitionOut: { type: 'zoomOut', duration: 0.4 }
    };
    projectStore.addClip(newClip);
  };

  // Generate Auto-Captions from Text
  const handleGenerateCaptions = () => {
    const cues = captionEngine.generateSmartSubtitlesFromText(autoCaptionText, 6.0);
    cues.forEach((cue) => {
      const clip: Clip = {
        id: 'cap-' + cue.id,
        trackId: 'v2',
        name: `Caption: ${cue.text.substring(0, 15)}...`,
        type: 'text',
        src: '',
        startTime: projectStore.getCurrentTime() + cue.startTime,
        duration: Math.max(1.2, cue.endTime - cue.startTime),
        sourceStart: 0,
        sourceDuration: cue.endTime - cue.startTime,
        transform: { x: 0, y: 350, scale: 1, rotation: 0, opacity: 1, blendMode: 'source-over' },
        keyframes: [],
        colorGrading: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, exposure: 0, vignette: 0, hue: 0, blur: 0, sepia: 0, invert: 0 },
        chromaKey: { enabled: false, color: '#00ff00', tolerance: 35, softness: 15 },
        effect: 'none',
        effectIntensity: 0,
        transitionIn: { type: 'crossfade', duration: 0.2 },
        transitionOut: { type: 'crossfade', duration: 0.2 },
        textProps: {
          content: cue.text,
          font: 'Montserrat',
          size: 44,
          color: '#facc15',
          strokeColor: '#000000',
          strokeWidth: 4,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          bgPadding: 16,
          shadowColor: '#000000',
          shadowBlur: 10,
          textAlign: 'center',
          animation: 'bounce'
        }
      };
      projectStore.addClip(clip);
    });
  };

  // Add Effect to selected clip
  const handleApplyEffect = (effect: ClipFilterEffect) => {
    const selected = projectStore.getSelectedClip();
    if (selected) {
      projectStore.updateClip(selected.id, { effect, effectIntensity: 60 });
    } else {
      alert('Please click on a video or image clip in the timeline first to apply this effect!');
    }
  };

  // Apply Color LUT preset to selected clip
  const handleApplyLUT = (preset: Partial<ColorGrading>) => {
    const selected = projectStore.getSelectedClip();
    if (selected) {
      projectStore.updateClip(selected.id, {
        colorGrading: { ...selected.colorGrading, ...preset }
      });
    } else {
      alert('Please click on a video or image clip on the timeline first to apply this color LUT!');
    }
  };

  // Add Transition to selected clip
  const handleApplyTransition = (type: ClipTransition['type']) => {
    const selected = projectStore.getSelectedClip();
    if (selected) {
      projectStore.updateClip(selected.id, {
        transitionIn: { type, duration: 0.6 }
      });
    } else {
      alert('Please click on a clip in the timeline first to apply this transition!');
    }
  };

  return (
    <div className="w-80 bg-[#10131b] border-r border-slate-800/90 flex flex-col h-full select-none z-20 shadow-2xl">
      {/* Tab Navigation Icons */}
      <div className="flex items-center justify-around bg-[#0c0e15] border-b border-slate-800/80 px-1 py-2">
        <button
          onClick={() => setActiveTab('media')}
          className={`flex flex-col items-center space-y-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
            activeTab === 'media' ? 'text-indigo-400 bg-indigo-950/50 border border-indigo-600/40' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Media Library"
        >
          <FolderPlus className="w-4 h-4" />
          <span className="text-[10px] font-medium">Media</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`flex flex-col items-center space-y-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
            activeTab === 'audio' ? 'text-indigo-400 bg-indigo-950/50 border border-indigo-600/40' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Sound FX & Audio Extraction"
        >
          <Music className="w-4 h-4" />
          <span className="text-[10px] font-medium">Audio</span>
        </button>

        <button
          onClick={() => setActiveTab('stickers')}
          className={`flex flex-col items-center space-y-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
            activeTab === 'stickers' ? 'text-pink-400 bg-pink-950/50 border border-pink-600/40' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Stickers & Emojis"
        >
          <Smile className="w-4 h-4" />
          <span className="text-[10px] font-medium">Stickers</span>
        </button>

        <button
          onClick={() => setActiveTab('text')}
          className={`flex flex-col items-center space-y-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
            activeTab === 'text' ? 'text-indigo-400 bg-indigo-950/50 border border-indigo-600/40' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Text & Subtitles"
        >
          <Type className="w-4 h-4" />
          <span className="text-[10px] font-medium">Text</span>
        </button>

        <button
          onClick={() => setActiveTab('effects')}
          className={`flex flex-col items-center space-y-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
            activeTab === 'effects' ? 'text-indigo-400 bg-indigo-950/50 border border-indigo-600/40' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Visual Effects & LUTs"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] font-medium">VFX</span>
        </button>

        <button
          onClick={() => setActiveTab('transitions')}
          className={`flex flex-col items-center space-y-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
            activeTab === 'transitions' ? 'text-indigo-400 bg-indigo-950/50 border border-indigo-600/40' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Transitions"
        >
          <Shuffle className="w-4 h-4" />
          <span className="text-[10px] font-medium">Motion</span>
        </button>

        <button
          onClick={() => setActiveTab('voiceover')}
          className={`flex flex-col items-center space-y-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
            activeTab === 'voiceover' ? 'text-red-400 bg-red-950/50 border border-red-600/40' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Voiceover"
        >
          <Mic className="w-4 h-4" />
          <span className="text-[10px] font-medium">Mic</span>
        </button>
      </div>

      {/* Extraction Notification Banner */}
      {extractStatus && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/40 p-2.5 flex items-center space-x-2 text-xs text-emerald-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{extractStatus}</span>
        </div>
      )}

      {/* Tab Body Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 1. MEDIA TAB */}
        {activeTab === 'media' && (
          <div className="space-y-4">
            {/* Take Audio from Video Callout */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/40 hover:border-purple-400 cursor-pointer shadow-lg transition-all group">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-purple-600/30 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform">
                  <FileAudio className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                    Extract Audio from Other Video
                  </div>
                  <div className="text-[10px] text-slate-400">Pulls raw audio & waveform into track</div>
                </div>
              </div>
              <Plus className="w-4 h-4 text-purple-400" />
              <input
                type="file"
                accept="video/*"
                onChange={handleExtractAudioFromVideo}
                className="hidden"
              />
            </label>

            {/* Standard Media Upload */}
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700/80 hover:border-indigo-500 rounded-xl p-5 bg-slate-900/40 hover:bg-slate-900/80 cursor-pointer transition-all group">
              <FolderPlus className="w-7 h-7 text-slate-400 group-hover:text-indigo-400 transition-colors mb-2" />
              <span className="text-xs font-semibold text-slate-200">Import Media Files</span>
              <span className="text-[10px] text-slate-400 text-center mt-1">MP4, WebM, MP3, WAV, PNG, JPG</span>
              <input
                type="file"
                multiple
                accept="video/*,audio/*,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Procedural Stock Media
              </span>
              <button
                onClick={async () => {
                  const url = await createSampleVideoBlob();
                  const clip: Clip = {
                    id: 'clip-sample-' + Date.now(),
                    trackId: 'v1',
                    name: 'Cyberpunk Neon Visuals.webm',
                    type: 'video',
                    src: url,
                    startTime: projectStore.getCurrentTime(),
                    duration: 5.0,
                    sourceStart: 0,
                    sourceDuration: 5.0,
                    transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'source-over' },
                    keyframes: [],
                    colorGrading: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, exposure: 0, vignette: 0, hue: 0, blur: 0, sepia: 0, invert: 0 },
                    chromaKey: { enabled: false, color: '#00ff00', tolerance: 35, softness: 15 },
                    effect: 'none',
                    effectIntensity: 0,
                    transitionIn: { type: 'none', duration: 0.5 },
                    transitionOut: { type: 'none', duration: 0.5 }
                  };
                  projectStore.addClip(clip);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <Video className="w-4 h-4 text-purple-400" />
                  <div className="text-left">
                    <div className="text-xs font-medium">Generate Cyberpunk Motion</div>
                    <div className="text-[10px] text-slate-400">1280x720 30FPS dynamic loop</div>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-indigo-400" />
              </button>
            </div>
          </div>
        )}

        {/* 2. AUDIO & SFX TAB */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            {/* Extract Audio Direct Button */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-950/70 to-teal-950/70 border border-emerald-500/40 hover:border-emerald-400 cursor-pointer shadow-md transition-all group">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/30 flex items-center justify-center text-emerald-300">
                  <FileAudio className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                    Extract Audio from Video
                  </div>
                  <div className="text-[10px] text-slate-400">Import music/dialogue from any clip</div>
                </div>
              </div>
              <Plus className="w-4 h-4 text-emerald-400" />
              <input
                type="file"
                accept="video/*"
                onChange={handleExtractAudioFromVideo}
                className="hidden"
              />
            </label>

            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Built-in Studio SFX Library
            </span>

            {[
              { type: 'whoosh', name: 'Cinematic Whoosh', cat: 'Transition' },
              { type: 'impact', name: 'Heavy Bass Impact', cat: 'Impact' },
              { type: 'subdrop', name: '808 Sub Boom Drop', cat: 'Bass' },
              { type: 'riser', name: 'Tension Riser Build', cat: 'Build' },
              { type: 'pop', name: 'Snappy Bubble Pop', cat: 'UI' },
              { type: 'ding', name: 'Crystal Bell Ding', cat: 'Notice' },
            ].map((sfx) => (
              <div
                key={sfx.type}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => previewSFX(sfx.type as any)}
                    className="w-7 h-7 rounded-full bg-slate-800 hover:bg-indigo-600 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                    title="Preview Sound"
                  >
                    <Play className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                  <div className="text-left">
                    <div className="text-xs font-medium text-slate-200">{sfx.name}</div>
                    <div className="text-[10px] text-slate-400">{sfx.cat}</div>
                  </div>
                </div>

                <button
                  onClick={() => handleAddSFX(sfx.type as any, sfx.name)}
                  className="p-1.5 rounded-md bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors"
                  title="Add to Timeline"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 3. STICKERS & EMOJIS TAB */}
        {activeTab === 'stickers' && (
          <div className="space-y-3">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Animated Stickers & Overlays
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[
                { emoji: '🔥', label: 'Fire' },
                { emoji: '✨', label: 'Sparkles' },
                { emoji: '🎯', label: 'Target' },
                { emoji: '❤️', label: 'Heart' },
                { emoji: '👑', label: 'Crown' },
                { emoji: '⚠️', label: 'Warning' },
                { emoji: '💎', label: 'Diamond' },
                { emoji: '🚀', label: 'Rocket' },
                { emoji: '⚡', label: 'Lightning' },
                { emoji: '💯', label: '100' },
                { emoji: '🎬', label: 'Action' },
                { emoji: '⭐', label: 'Star' },
              ].map((st) => (
                <button
                  key={st.label}
                  onClick={() => handleAddSticker(st.emoji, st.label)}
                  className="p-3 bg-slate-900 border border-slate-800 hover:border-pink-500 rounded-xl flex flex-col items-center justify-center space-y-1 hover:scale-105 transition-all"
                  title={`Add ${st.label} Sticker`}
                >
                  <span className="text-2xl">{st.emoji}</span>
                  <span className="text-[10px] text-slate-400">{st.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. TEXT & CAPTIONS TAB */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Typography Presets
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAddText('title')}
                className="p-3 bg-slate-900 rounded-lg border border-slate-800 hover:border-indigo-500/50 text-left transition-colors"
              >
                <div className="text-sm font-bold text-white">Main Title</div>
                <div className="text-[10px] text-slate-400">Bold center headline</div>
              </button>

              <button
                onClick={() => handleAddText('kinetic')}
                className="p-3 bg-slate-900 rounded-lg border border-slate-800 hover:border-indigo-500/50 text-left transition-colors"
              >
                <div className="text-sm font-bold text-amber-400">Typewriter</div>
                <div className="text-[10px] text-slate-400">Animated letter reveal</div>
              </button>

              <button
                onClick={() => handleAddText('glow')}
                className="p-3 bg-slate-900 rounded-lg border border-slate-800 hover:border-indigo-500/50 text-left transition-colors col-span-2"
              >
                <div className="text-sm font-extrabold text-cyan-400 tracking-wide">CYBER GLOW TITLE</div>
                <div className="text-[10px] text-slate-400">Neon shadow & pop bounce</div>
              </button>
            </div>

            {/* Smart Auto Captions */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-indigo-900/30 space-y-2.5">
              <div className="flex items-center space-x-1.5 text-indigo-400 text-xs font-bold">
                <Wand2 className="w-3.5 h-3.5" />
                <span>Auto-Captions & Subtitles</span>
              </div>
              <textarea
                value={autoCaptionText}
                onChange={(e) => setAutoCaptionText(e.target.value)}
                rows={3}
                placeholder="Enter speech or transcript..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded p-2 text-xs text-slate-200 resize-none focus:outline-none"
              />
              <button
                onClick={handleGenerateCaptions}
                className="w-full py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded shadow-md shadow-indigo-600/30 transition-all"
              >
                Generate Synchronized Subtitles
              </button>
            </div>
          </div>
        )}

        {/* 5. EFFECTS & LUTs TAB */}
        {activeTab === 'effects' && (
          <div className="space-y-4">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              1-Click Color Grading LUTs
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: '🌆 Cyber Neon', preset: { saturation: 40, contrast: 25, hue: 15, vignette: 30 } },
                { name: '🏖️ Golden Hour', preset: { temperature: 35, saturation: 20, brightness: 5, vignette: 20 } },
                { name: '🎬 Teal & Orange', preset: { contrast: 30, saturation: 35, temperature: 15, tint: -20 } },
                { name: '🕶️ Noir B&W', preset: { saturation: -100, contrast: 40, vignette: 45 } },
                { name: '💚 Matrix', preset: { tint: 40, saturation: 10, contrast: 25 } },
                { name: '📼 Retro 1970', preset: { sepia: 40, contrast: 15, vignette: 35 } },
              ].map((lut) => (
                <button
                  key={lut.name}
                  onClick={() => handleApplyLUT(lut.preset)}
                  className="p-2.5 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-lg text-left transition-colors"
                >
                  <div className="text-xs font-semibold text-slate-200">{lut.name}</div>
                </button>
              ))}
            </div>

            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase block pt-2">
              Shaders & VFX Filters
            </span>
            {[
              { id: 'vignette', name: 'Cinematic Vignette', desc: 'Focus radial shadow' },
              { id: 'glitch', name: 'RGB Cyber Glitch', desc: 'Slicing & RGB displacement' },
              { id: 'vhs', name: 'Retro VHS Scanlines', desc: 'Analog tape aesthetic' },
              { id: 'filmGrain', name: 'Film Grain 35mm', desc: 'Photographic grain texture' },
            ].map((fx) => (
              <button
                key={fx.id}
                onClick={() => handleApplyEffect(fx.id as ClipFilterEffect)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white transition-colors"
              >
                <div className="text-left">
                  <div className="text-xs font-semibold">{fx.name}</div>
                  <div className="text-[10px] text-slate-400">{fx.desc}</div>
                </div>
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </button>
            ))}
          </div>
        )}

        {/* 6. TRANSITIONS TAB */}
        {activeTab === 'transitions' && (
          <div className="space-y-3">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Motion Transitions
            </span>
            {[
              { type: 'crossfade', name: 'Smooth Crossfade', desc: 'Soft opacity blend' },
              { type: 'zoomIn', name: 'Zoom In Push', desc: 'Dynamic scale push' },
              { type: 'zoomOut', name: 'Zoom Out Pull', desc: 'Cinematic scale retreat' },
              { type: 'slideLeft', name: 'Slide Left Pan', desc: 'Lateral camera sweep' },
            ].map((tr) => (
              <button
                key={tr.type}
                onClick={() => handleApplyTransition(tr.type as any)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white transition-colors"
              >
                <div className="text-left">
                  <div className="text-xs font-semibold">{tr.name}</div>
                  <div className="text-[10px] text-slate-400">{tr.desc}</div>
                </div>
                <Shuffle className="w-4 h-4 text-purple-400" />
              </button>
            ))}
          </div>
        )}

        {/* 7. VOICEOVER TAB */}
        {activeTab === 'voiceover' && (
          <div className="flex flex-col items-center justify-center p-6 bg-slate-900/60 rounded-xl border border-slate-800 text-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isRecordingVoice ? 'bg-red-600 animate-pulse ring-8 ring-red-600/30' : 'bg-slate-800'
            }`}>
              <Mic className={`w-8 h-8 ${isRecordingVoice ? 'text-white' : 'text-slate-400'}`} />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-100">
                {isRecordingVoice ? `Recording: ${recordingSeconds}s` : 'Studio Voiceover'}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {isRecordingVoice ? 'Speak into your microphone now...' : 'Record live commentary directly into your audio track.'}
              </p>
            </div>

            <button
              onClick={toggleVoiceRecording}
              className={`px-5 py-2 rounded-full font-bold text-xs shadow-lg transition-all ${
                isRecordingVoice
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/40'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              {isRecordingVoice ? 'Stop & Insert Track' : 'Start Recording'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
