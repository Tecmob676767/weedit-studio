export type AspectRatio = 
  | '16:9' 
  | '9:16' 
  | '1:1' 
  | '4:5' 
  | '21:9' 
  | '4:3' 
  | '3:4' 
  | '2:3' 
  | '2.39:1' 
  | '9:20';

export type Resolution = '720p' | '1080p' | '4K';
export type TrackType = 'video' | 'audio' | 'text' | 'effect';
export type MediaType = 'video' | 'audio' | 'image' | 'text' | 'color' | 'sticker';

export interface Keyframe {
  id: string;
  time: number; // timeline time relative to clip start in seconds
  property: 'x' | 'y' | 'scale' | 'rotation' | 'opacity';
  value: number;
}

export interface ColorGrading {
  brightness: number; // -100 to 100, default 0
  contrast: number;   // -100 to 100, default 0
  saturation: number; // -100 to 100, default 0
  temperature: number;// -100 to 100, default 0
  tint: number;       // -100 to 100, default 0
  exposure: number;   // -100 to 100, default 0
  vignette: number;   // 0 to 100, default 0
  hue: number;        // -180 to 180, default 0
  blur: number;       // 0 to 50px, default 0
  sepia: number;      // 0 to 100, default 0
  invert: number;     // 0 to 100, default 0
}

export interface ChromaKey {
  enabled: boolean;
  color: string;      // hex e.g. #00ff00
  tolerance: number;  // 0 to 100, default 35
  softness: number;   // 0 to 100, default 15
}

export type ClipFilterEffect = 
  | 'none' 
  | 'vignette'
  | 'glitch' 
  | 'vhs' 
  | 'filmGrain' 
  | 'chromatic' 
  | 'rgbSplit' 
  | 'zoomBlur' 
  | 'cyberpunk' 
  | 'vintage' 
  | 'cinematic';

export interface ClipTransition {
  type: 'none' | 'crossfade' | 'slideLeft' | 'slideRight' | 'slideUp' | 'zoomIn' | 'zoomOut' | 'glitch' | 'dissolve' | 'wipe';
  duration: number; // duration in seconds e.g. 0.5
}

export interface TextProperties {
  content: string;
  font: string;
  size: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  backgroundColor: string;
  bgPadding: number;
  shadowColor: string;
  shadowBlur: number;
  textAlign: 'left' | 'center' | 'right';
  animation: 'none' | 'typewriter' | 'bounce' | 'fadeIn' | 'karaoke' | 'slideUp';
}

export interface AudioProperties {
  volume: number;     // 0 to 2, default 1
  pan: number;        // -1 to 1, default 0
  bass: number;       // -15 to 15 dB
  mid: number;        // -15 to 15 dB
  treble: number;     // -15 to 15 dB
  reverb: number;     // 0 to 100%
  speed: number;      // 0.25 to 4.0
  muted: boolean;
  pitchCorrection: boolean;
}

export interface Clip {
  id: string;
  trackId: string;
  name: string;
  type: MediaType;
  src: string; // URL, blob or generator id
  thumbnail?: string;
  startTime: number; // Timeline start in seconds
  duration: number;  // Duration on timeline in seconds
  sourceStart: number; // Start offset within original media file
  sourceDuration: number; // Total length of original file
  
  // Transform & Compositing
  transform: {
    x: number;       // Offset X from center in px
    y: number;       // Offset Y from center in px
    scale: number;   // 0.1 to 10, default 1
    rotation: number;// degrees, -360 to 360
    opacity: number; // 0 to 1, default 1
    blendMode: GlobalCompositeOperation;
  };
  
  keyframes: Keyframe[];
  colorGrading: ColorGrading;
  chromaKey: ChromaKey;
  effect: ClipFilterEffect;
  effectIntensity: number; // 0 to 100
  
  transitionIn: ClipTransition;
  transitionOut: ClipTransition;

  textProps?: TextProperties;
  audioProps?: AudioProperties;
  waveform?: number[];
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  isMuted: boolean;
  isSolo: boolean;
  isLocked: boolean;
  volume: number; // 0 to 1
  order: number;
}

export interface Project {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  fps: number;
  duration: number; // Total timeline duration in seconds
  tracks: Track[];
  clips: Clip[];
  beats: number[]; // Array of timestamps in seconds
  updatedAt: number;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: MediaType;
  src: string;
  thumbnail?: string;
  duration: number;
  width?: number;
  height?: number;
  waveform?: number[];
}

export interface SoundEffectItem {
  id: string;
  name: string;
  category: 'Impact' | 'Transition' | 'UI' | 'Riser' | 'Atmosphere';
  duration: number;
  frequencyData: number[];
  generateAudio: () => AudioBuffer;
}
