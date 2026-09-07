import type { AspectRatio, Clip, Project, Track } from '../types';

const STORAGE_KEY = 'weedit_project_v1';

export const DEFAULT_TRACKS: Track[] = [
  { id: 'v2', name: 'Overlay / Text', type: 'text', isMuted: false, isSolo: false, isLocked: false, volume: 1, order: 3 },
  { id: 'v1', name: 'Main Video', type: 'video', isMuted: false, isSolo: false, isLocked: false, volume: 1, order: 2 },
  { id: 'a1', name: 'BGM / Music', type: 'audio', isMuted: false, isSolo: false, isLocked: false, volume: 1, order: 1 },
  { id: 'a2', name: 'SFX / Voice', type: 'audio', isMuted: false, isSolo: false, isLocked: false, volume: 1, order: 0 },
];

/**
 * Procedural sample video generator (produces a high-res glowing motion video blob)
 */
export function createSampleVideoBlob(): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d')!;

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(URL.createObjectURL(blob));
    };

    recorder.start();

    let frame = 0;
    const totalFrames = 150; // 5 seconds at 30fps

    const drawFrame = () => {
      const t = frame / 30;
      
      // Cyberpunk futuristic gradient background
      const grad = ctx.createRadialGradient(
        640 + Math.sin(t * 2) * 200, 
        360 + Math.cos(t * 2) * 100, 
        50, 
        640, 360, 800
      );
      grad.addColorStop(0, '#8b5cf6');
      grad.addColorStop(0.5, '#3b82f6');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);

      // Geometric animated cyber rings
      ctx.save();
      ctx.translate(640, 360);
      ctx.rotate(t * 0.8);
      for (let r = 50; r < 400; r += 60) {
        ctx.strokeStyle = `hsla(${(t * 40 + r) % 360}, 90%, 65%, 0.6)`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, r + Math.sin(t * 4 + r) * 15, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Floating dynamic badge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.font = 'bold 44px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('WEEDIT NEXT-GEN STUDIO', 640, 360 + Math.sin(t * 3) * 20);

      frame++;
      if (frame < totalFrames) {
        requestAnimationFrame(drawFrame);
      } else {
        recorder.stop();
      }
    };

    drawFrame();
  });
}

export function createInitialProject(): Project {
  return {
    id: 'proj-' + Date.now(),
    name: 'Untitled Epic Project',
    aspectRatio: '16:9',
    fps: 30,
    duration: 12.0,
    tracks: DEFAULT_TRACKS,
    clips: [],
    beats: [0.8, 1.6, 2.4, 3.2, 4.0, 4.8, 5.6, 6.4, 7.2, 8.0, 8.8, 9.6, 10.4, 11.2],
    updatedAt: Date.now()
  };
}

export class ProjectStore {
  private project: Project;
  private currentTime: number = 0;
  private isPlaying: boolean = false;
  private zoom: number = 70; // pixels per second
  private selectedClipId: string | null = null;
  private selectedTrackId: string | null = 'v1';
  private snapToGrid: boolean = true;
  private activeTool: 'select' | 'split' | 'trim' = 'select';
  private undoStack: Project[] = [];
  private redoStack: Project[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.project = this.loadFromStorage() || createInitialProject();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private pushUndo() {
    this.undoStack.push(JSON.parse(JSON.stringify(this.project)));
    if (this.undoStack.length > 30) this.undoStack.shift();
    this.redoStack = [];
  }

  public undo() {
    if (this.undoStack.length > 0) {
      this.redoStack.push(JSON.parse(JSON.stringify(this.project)));
      this.project = this.undoStack.pop()!;
      this.saveToStorage();
      this.notify();
    }
  }

  public redo() {
    if (this.redoStack.length > 0) {
      this.undoStack.push(JSON.parse(JSON.stringify(this.project)));
      this.project = this.redoStack.pop()!;
      this.saveToStorage();
      this.notify();
    }
  }

  // Getters
  public getProject(): Project { return this.project; }
  public getCurrentTime(): number { return this.currentTime; }
  public getIsPlaying(): boolean { return this.isPlaying; }
  public getZoom(): number { return this.zoom; }
  public getSelectedClipId(): string | null { return this.selectedClipId; }
  public getSelectedClip(): Clip | undefined {
    return this.project.clips.find((c) => c.id === this.selectedClipId);
  }
  public getSelectedTrackId(): string | null { return this.selectedTrackId; }
  public getSnapToGrid(): boolean { return this.snapToGrid; }
  public getActiveTool(): 'select' | 'split' | 'trim' { return this.activeTool; }

  // Setters & Actions
  public setCurrentTime(time: number) {
    this.currentTime = Math.max(0, Math.min(this.project.duration, time));
    this.notify();
  }

  public setIsPlaying(playing: boolean) {
    this.isPlaying = playing;
    this.notify();
  }

  public setZoom(zoom: number) {
    this.zoom = Math.max(20, Math.min(300, zoom));
    this.notify();
  }

  public setSnapToGrid(snap: boolean) {
    this.snapToGrid = snap;
    this.notify();
  }

  public setActiveTool(tool: 'select' | 'split' | 'trim') {
    this.activeTool = tool;
    this.notify();
  }

  public selectClip(clipId: string | null) {
    this.selectedClipId = clipId;
    this.notify();
  }

  public selectTrack(trackId: string | null) {
    this.selectedTrackId = trackId;
    this.notify();
  }

  public setProjectName(name: string) {
    this.pushUndo();
    this.project.name = name;
    this.saveToStorage();
    this.notify();
  }

  public setAspectRatio(aspect: AspectRatio) {
    this.pushUndo();
    this.project.aspectRatio = aspect;
    this.saveToStorage();
    this.notify();
  }

  public setFps(fps: number) {
    this.pushUndo();
    this.project.fps = fps;
    this.saveToStorage();
    this.notify();
  }

  public setDuration(duration: number) {
    this.pushUndo();
    this.project.duration = Math.max(3, duration);
    this.saveToStorage();
    this.notify();
  }

  public addClip(clip: Clip) {
    this.pushUndo();
    this.project.clips.push(clip);
    // Expand timeline if clip goes past current duration
    const end = clip.startTime + clip.duration;
    if (end > this.project.duration) {
      this.project.duration = Math.ceil(end + 2);
    }
    this.selectedClipId = clip.id;
    this.saveToStorage();
    this.notify();
  }

  public updateClip(clipId: string, updates: Partial<Clip>) {
    this.pushUndo();
    const idx = this.project.clips.findIndex((c) => c.id === clipId);
    if (idx !== -1) {
      this.project.clips[idx] = { ...this.project.clips[idx], ...updates };
      const end = (this.project.clips[idx].startTime || 0) + (this.project.clips[idx].duration || 0);
      if (end > this.project.duration) {
        this.project.duration = Math.ceil(end + 2);
      }
      this.saveToStorage();
      this.notify();
    }
  }

  public deleteClip(clipId: string) {
    this.pushUndo();
    this.project.clips = this.project.clips.filter((c) => c.id !== clipId);
    if (this.selectedClipId === clipId) this.selectedClipId = null;
    this.saveToStorage();
    this.notify();
  }

  public duplicateClip(clipId: string) {
    const clip = this.project.clips.find((c) => c.id === clipId);
    if (!clip) return;
    this.pushUndo();
    const newClip: Clip = JSON.parse(JSON.stringify(clip));
    newClip.id = 'clip-' + Date.now();
    newClip.name = `${clip.name} (Copy)`;
    newClip.startTime = clip.startTime + clip.duration + 0.1;
    this.project.clips.push(newClip);
    this.selectedClipId = newClip.id;
    this.saveToStorage();
    this.notify();
  }

  public splitClipAtPlayhead(clipId?: string) {
    const targetId = clipId || this.selectedClipId;
    if (!targetId) return;

    const clip = this.project.clips.find((c) => c.id === targetId);
    if (!clip) return;

    const splitTime = this.currentTime;
    if (splitTime <= clip.startTime || splitTime >= clip.startTime + clip.duration) {
      return; // Outside bounds
    }

    this.pushUndo();
    const firstDuration = splitTime - clip.startTime;
    const secondDuration = clip.duration - firstDuration;

    // First part
    clip.duration = firstDuration;

    // Second part
    const secondClip: Clip = JSON.parse(JSON.stringify(clip));
    secondClip.id = 'clip-' + Date.now();
    secondClip.startTime = splitTime;
    secondClip.duration = secondDuration;
    secondClip.sourceStart = clip.sourceStart + firstDuration;
    secondClip.name = `${clip.name} (Part 2)`;

    this.project.clips.push(secondClip);
    this.selectedClipId = secondClip.id;
    this.saveToStorage();
    this.notify();
  }

  public addTrack(type: 'video' | 'audio' | 'text' | 'effect', name?: string) {
    this.pushUndo();
    const newOrder = this.project.tracks.length;
    const trackId = `track-${type}-${Date.now()}`;
    const newTrack: Track = {
      id: trackId,
      name: name || `${type.toUpperCase()} Track ${newOrder + 1}`,
      type,
      isMuted: false,
      isSolo: false,
      isLocked: false,
      volume: 1,
      order: newOrder
    };
    this.project.tracks.push(newTrack);
    this.saveToStorage();
    this.notify();
  }

  public toggleMuteTrack(trackId: string) {
    const track = this.project.tracks.find((t) => t.id === trackId);
    if (track) {
      track.isMuted = !track.isMuted;
      this.notify();
    }
  }

  public toggleLockTrack(trackId: string) {
    const track = this.project.tracks.find((t) => t.id === trackId);
    if (track) {
      track.isLocked = !track.isLocked;
      this.notify();
    }
  }

  public setBeats(beats: number[]) {
    this.pushUndo();
    this.project.beats = beats;
    this.saveToStorage();
    this.notify();
  }

  private saveToStorage() {
    try {
      this.project.updatedAt = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.project));
    } catch {
      // Ignore quota error for large blobs
    }
  }

  private loadFromStorage(): Project | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public async loadDemoProject() {
    this.pushUndo();
    const videoBlobUrl = await createSampleVideoBlob();

    const demoProject: Project = {
      id: 'demo-' + Date.now(),
      name: 'Cyberpunk Neon Intro Demo',
      aspectRatio: '16:9',
      fps: 30,
      duration: 10.0,
      tracks: [
        { id: 'v2', name: 'Kinetic Titles', type: 'text', isMuted: false, isSolo: false, isLocked: false, volume: 1, order: 3 },
        { id: 'v1', name: 'Main Video', type: 'video', isMuted: false, isSolo: false, isLocked: false, volume: 1, order: 2 },
        { id: 'a1', name: 'Synthwave Beats', type: 'audio', isMuted: false, isSolo: false, isLocked: false, volume: 1, order: 1 },
        { id: 'a2', name: 'SFX & Impacts', type: 'audio', isMuted: false, isSolo: false, isLocked: false, volume: 1, order: 0 }
      ],
      beats: [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0],
      clips: [
        {
          id: 'clip-demo-video',
          trackId: 'v1',
          name: 'Cyberpunk Neon Motion.mp4',
          type: 'video',
          src: videoBlobUrl,
          startTime: 0,
          duration: 5.0,
          sourceStart: 0,
          sourceDuration: 5.0,
          transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'source-over' },
          keyframes: [
            { id: 'kf-1', time: 0, property: 'scale', value: 1.2 },
            { id: 'kf-2', time: 4.5, property: 'scale', value: 1.0 }
          ],
          colorGrading: {
            brightness: 5,
            contrast: 20,
            saturation: 30,
            temperature: 10,
            tint: -5,
            exposure: 0,
            vignette: 40,
            hue: 0,
            blur: 0,
            sepia: 0,
            invert: 0
          },
          chromaKey: { enabled: false, color: '#00ff00', tolerance: 35, softness: 15 },
          effect: 'vignette',
          effectIntensity: 65,
          transitionIn: { type: 'crossfade', duration: 0.5 },
          transitionOut: { type: 'zoomOut', duration: 0.5 }
        },
        {
          id: 'clip-demo-text',
          trackId: 'v2',
          name: 'Title: WEEDIT STUDIO',
          type: 'text',
          src: '',
          startTime: 0.5,
          duration: 4.0,
          sourceStart: 0,
          sourceDuration: 4.0,
          transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, blendMode: 'source-over' },
          keyframes: [],
          colorGrading: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, exposure: 0, vignette: 0, hue: 0, blur: 0, sepia: 0, invert: 0 },
          chromaKey: { enabled: false, color: '#00ff00', tolerance: 35, softness: 15 },
          effect: 'none',
          effectIntensity: 0,
          transitionIn: { type: 'crossfade', duration: 0.4 },
          transitionOut: { type: 'crossfade', duration: 0.4 },
          textProps: {
            content: 'WEEDIT STUDIO',
            font: 'Montserrat',
            size: 64,
            color: '#ffffff',
            strokeColor: '#6366f1',
            strokeWidth: 3,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            bgPadding: 24,
            shadowColor: '#8b5cf6',
            shadowBlur: 20,
            textAlign: 'center',
            animation: 'bounce'
          }
        }
      ],
      updatedAt: Date.now()
    };

    this.project = demoProject;
    this.currentTime = 0;
    this.selectedClipId = 'clip-demo-video';
    this.saveToStorage();
    this.notify();
  }
}

export const projectStore = new ProjectStore();
