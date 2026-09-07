import type { AspectRatio, Clip, Project } from '../types';
import { getInterpolatedValue } from './KeyframeEngine';

export interface RenderDimensions {
  width: number;
  height: number;
}

export function getResolutionForAspect(aspect: AspectRatio): RenderDimensions {
  switch (aspect) {
    case '16:9':   return { width: 1920, height: 1080 };
    case '9:16':   return { width: 1080, height: 1920 };
    case '1:1':    return { width: 1080, height: 1080 };
    case '4:5':    return { width: 1080, height: 1350 };
    case '21:9':   return { width: 2560, height: 1080 };
    case '4:3':    return { width: 1440, height: 1080 };
    case '3:4':    return { width: 1080, height: 1440 };
    case '2:3':    return { width: 1080, height: 1620 };
    case '2.39:1': return { width: 2560, height: 1070 };
    case '9:20':   return { width: 1080, height: 2400 };
    default:       return { width: 1920, height: 1080 };
  }
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private videoCache: Map<string, HTMLVideoElement> = new Map();
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true })!;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public setSize(width: number, height: number) {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.offscreenCanvas.width = width;
      this.offscreenCanvas.height = height;
    }
  }

  /**
   * Preloads or retrieves HTMLVideoElement for a video source
   */
  public getVideoElement(src: string): HTMLVideoElement {
    let video = this.videoCache.get(src);
    if (!video) {
      video = document.createElement('video');
      video.src = src;
      video.crossOrigin = 'anonymous';
      video.playsInline = true;
      video.muted = true;
      video.preload = 'auto';
      this.videoCache.set(src, video);
    }
    return video;
  }

  /**
   * Preloads or retrieves HTMLImageElement for an image source
   */
  public getImageElement(src: string): HTMLImageElement {
    let img = this.imageCache.get(src);
    if (!img) {
      img = new Image();
      img.src = src;
      img.crossOrigin = 'anonymous';
      this.imageCache.set(src, img);
    }
    return img;
  }

  /**
   * Synchronize video elements to current playhead time
   */
  public syncMediaPlayback(project: Project, currentTime: number, isPlaying: boolean) {
    project.clips.forEach((clip) => {
      if (clip.type === 'video') {
        const video = this.getVideoElement(clip.src);
        const isWithinClip = currentTime >= clip.startTime && currentTime <= clip.startTime + clip.duration;
        const targetMediaTime = (currentTime - clip.startTime) + clip.sourceStart;

        if (isWithinClip) {
          if (Math.abs(video.currentTime - targetMediaTime) > 0.15) {
            video.currentTime = targetMediaTime;
          }
          if (isPlaying && video.paused) {
            video.play().catch(() => {});
          } else if (!isPlaying && !video.paused) {
            video.pause();
          }
        } else {
          if (!video.paused) {
            video.pause();
          }
        }
      }
    });
  }

  /**
   * Main render loop executing frame composition
   */
  public renderFrame(project: Project, time: number) {
    const { width, height } = getResolutionForAspect(project.aspectRatio);
    this.setSize(width, height);

    const ctx = this.ctx;
    // Clear canvas with deep studio black
    ctx.save();
    ctx.fillStyle = '#0a0c10';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // Sort tracks by order (V1 -> V2 -> Text -> FX)
    const sortedTracks = [...project.tracks].sort((a, b) => a.order - b.order);

    for (const track of sortedTracks) {
      if (track.isMuted) continue;

      // Find active clips on this track
      const activeClips = project.clips.filter(
        (clip) => clip.trackId === track.id && time >= clip.startTime && time <= clip.startTime + clip.duration
      );

      for (const clip of activeClips) {
        this.renderClip(clip, time, width, height);
      }
    }

    // Watermark — tiny, bottom-right corner
    this.drawWatermark(width, height);
  }

  private drawWatermark(width: number, height: number) {
    const ctx = this.ctx;
    const fontSize = Math.max(14, Math.round(width * 0.012));
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.font = `600 ${fontSize}px Inter, Arial, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    // Soft shadow for readability
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('WeEdit Studio', width - Math.round(width * 0.012), height - Math.round(height * 0.01));
    ctx.restore();
  }

  private renderClip(clip: Clip, time: number, canvasWidth: number, canvasHeight: number) {
    const localTime = time - clip.startTime;
    const ctx = this.ctx;

    // Calculate interpolated transform values
    const posX = getInterpolatedValue(clip.keyframes, 'x', localTime, clip.transform.x);
    const posY = getInterpolatedValue(clip.keyframes, 'y', localTime, clip.transform.y);
    let scale = getInterpolatedValue(clip.keyframes, 'scale', localTime, clip.transform.scale);
    const rotation = getInterpolatedValue(clip.keyframes, 'rotation', localTime, clip.transform.rotation);
    let opacity = getInterpolatedValue(clip.keyframes, 'opacity', localTime, clip.transform.opacity);

    // Transitions handling
    // Transition In
    if (clip.transitionIn && clip.transitionIn.type !== 'none' && localTime < clip.transitionIn.duration) {
      const p = Math.max(0, Math.min(1, localTime / clip.transitionIn.duration));
      if (clip.transitionIn.type === 'crossfade') {
        opacity *= p;
      } else if (clip.transitionIn.type === 'zoomIn') {
        scale *= 0.5 + 0.5 * p;
        opacity *= p;
      } else if (clip.transitionIn.type === 'slideLeft') {
        ctx.translate(canvasWidth * (1 - p), 0);
      }
    }

    // Transition Out
    const remainingTime = clip.duration - localTime;
    if (clip.transitionOut && clip.transitionOut.type !== 'none' && remainingTime < clip.transitionOut.duration) {
      const p = Math.max(0, Math.min(1, remainingTime / clip.transitionOut.duration));
      if (clip.transitionOut.type === 'crossfade') {
        opacity *= p;
      } else if (clip.transitionOut.type === 'zoomOut') {
        scale *= 0.5 + 0.5 * p;
        opacity *= p;
      }
    }

    if (opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
    ctx.globalCompositeOperation = clip.transform.blendMode || 'source-over';

    // Build CSS filter string for color grading
    const filters: string[] = [];
    const cg = clip.colorGrading;
    if (cg) {
      if (cg.brightness !== 0) filters.push(`brightness(${100 + cg.brightness}%)`);
      if (cg.contrast !== 0) filters.push(`contrast(${100 + cg.contrast}%)`);
      if (cg.saturation !== 0) filters.push(`saturate(${100 + cg.saturation}%)`);
      if (cg.hue !== 0) filters.push(`hue-rotate(${cg.hue}deg)`);
      if (cg.blur > 0) filters.push(`blur(${cg.blur}px)`);
      if (cg.sepia > 0) filters.push(`sepia(${cg.sepia}%)`);
      if (cg.invert > 0) filters.push(`invert(${cg.invert}%)`);
    }

    ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';

    // Position & Transform Matrix
    const centerX = canvasWidth / 2 + posX;
    const centerY = canvasHeight / 2 + posY;
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    if (clip.type === 'video') {
      const video = this.getVideoElement(clip.src);
      if (video.readyState >= 2) {
        // Render video frame to offscreen for chroma key or direct
        if (clip.chromaKey?.enabled) {
          this.renderChromaKeyMedia(video, video.videoWidth, video.videoHeight, clip.chromaKey);
        } else {
          const w = canvasWidth;
          const h = (video.videoHeight / video.videoWidth) * canvasWidth;
          ctx.drawImage(video, -w / 2, -h / 2, w, h);
        }
      }
    } else if (clip.type === 'image') {
      const img = this.getImageElement(clip.src);
      if (img.complete && img.naturalWidth > 0) {
        const aspect = img.naturalWidth / img.naturalHeight;
        const w = canvasWidth;
        const h = w / aspect;
        if (clip.chromaKey?.enabled) {
          this.renderChromaKeyMedia(img, img.naturalWidth, img.naturalHeight, clip.chromaKey);
        } else {
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
        }
      }
    } else if (clip.type === 'text' && clip.textProps) {
      this.renderAnimatedText(clip.textProps, localTime, clip.duration);
    } else if (clip.type === 'sticker') {
      ctx.font = '120px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(clip.src || '⭐', 0, 0);
    }

    ctx.restore();

    // Post-processing VFX Shaders (Vignette, Glitch, VHS, Film Grain)
    if (clip.effect && clip.effect !== 'none') {
      this.applyPostFX(clip.effect, clip.effectIntensity || 50, canvasWidth, canvasHeight, localTime);
    }
  }

  /**
   * Chroma Key (Green Screen) Real-Time Color Keying
   */
  private renderChromaKeyMedia(
    media: HTMLVideoElement | HTMLImageElement,
    srcWidth: number,
    srcHeight: number,
    chroma: { color: string; tolerance: number; softness: number }
  ) {
    const offCanvas = this.offscreenCanvas;
    const offCtx = this.offscreenCtx;
    offCanvas.width = srcWidth;
    offCanvas.height = srcHeight;

    offCtx.clearRect(0, 0, srcWidth, srcHeight);
    offCtx.drawImage(media, 0, 0, srcWidth, srcHeight);

    const imgData = offCtx.getImageData(0, 0, srcWidth, srcHeight);
    const data = imgData.data;

    // Parse hex target color e.g. #00ff00
    const hex = chroma.color.replace('#', '');
    const keyR = parseInt(hex.substring(0, 2), 16) || 0;
    const keyG = parseInt(hex.substring(2, 4), 16) || 255;
    const keyB = parseInt(hex.substring(4, 6), 16) || 0;

    const tol = (chroma.tolerance / 100) * 200;
    const soft = (chroma.softness / 100) * 100;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const diff = Math.sqrt((r - keyR) ** 2 + (g - keyG) ** 2 + (b - keyB) ** 2);

      if (diff < tol) {
        data[i + 3] = 0; // Completely transparent
      } else if (diff < tol + soft) {
        const factor = (diff - tol) / soft;
        data[i + 3] = Math.floor(data[i + 3] * factor);
      }
    }

    offCtx.putImageData(imgData, 0, 0);

    const w = this.canvas.width;
    const h = (srcHeight / srcWidth) * w;
    this.ctx.drawImage(offCanvas, -w / 2, -h / 2, w, h);
  }

  /**
   * Kinetic Text & Subtitles Renderer
   */
  private renderAnimatedText(props: any, localTime: number, totalDuration: number) {
    const ctx = this.ctx;
    let displayText = props.content || '';

    // Typewriter effect
    if (props.animation === 'typewriter') {
      const charCount = Math.floor((localTime / Math.max(1, totalDuration * 0.8)) * displayText.length);
      displayText = displayText.substring(0, charCount);
    }

    // Bounce / Pop effect
    if (props.animation === 'bounce') {
      const bounceProgress = Math.min(1, localTime * 4);
      const bounceScale = 1 + Math.sin(bounceProgress * Math.PI) * 0.25;
      ctx.scale(bounceScale, bounceScale);
    }

    ctx.font = `800 ${props.size || 56}px "${props.font || 'Inter'}", sans-serif`;
    ctx.textAlign = props.textAlign || 'center';
    ctx.textBaseline = 'middle';

    const metrics = ctx.measureText(displayText);
    const textWidth = metrics.width;
    const textHeight = (props.size || 56) * 1.2;

    // Background pill/box
    if (props.backgroundColor && props.backgroundColor !== 'transparent') {
      ctx.fillStyle = props.backgroundColor;
      const pad = props.bgPadding || 16;
      ctx.beginPath();
      ctx.roundRect(-textWidth / 2 - pad, -textHeight / 2 - pad / 2, textWidth + pad * 2, textHeight + pad, 12);
      ctx.fill();
    }

    // Drop shadow / glow
    if (props.shadowBlur > 0) {
      ctx.shadowColor = props.shadowColor || 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = props.shadowBlur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
    }

    // Stroke / Outline
    if (props.strokeWidth > 0) {
      ctx.strokeStyle = props.strokeColor || '#000000';
      ctx.lineWidth = props.strokeWidth;
      ctx.lineJoin = 'round';
      ctx.strokeText(displayText, 0, 0);
    }

    // Fill
    ctx.fillStyle = props.color || '#ffffff';
    ctx.fillText(displayText, 0, 0);
  }

  /**
   * Post-Processing Visual Effects
   */
  private applyPostFX(effect: string, intensity: number, width: number, height: number, _time: number) {
    const ctx = this.ctx;
    const factor = intensity / 100;

    if (effect === 'vignette') {
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, width * 0.25,
        width / 2, height / 2, width * 0.75
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, `rgba(0, 0, 0, ${0.85 * factor})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    } else if (effect === 'glitch') {
      if (Math.random() < 0.4 * factor) {
        const sliceH = Math.floor(Math.random() * 40 + 10);
        const sliceY = Math.floor(Math.random() * (height - sliceH));
        const shift = (Math.random() * 40 - 20) * factor;
        ctx.drawImage(this.canvas, 0, sliceY, width, sliceH, shift, sliceY, width, sliceH);
      }
    } else if (effect === 'vhs') {
      ctx.fillStyle = `rgba(0, 0, 0, ${0.15 * factor})`;
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1.5);
      }
    } else if (effect === 'filmGrain') {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      const amount = 30 * factor;
      for (let i = 0; i < data.length; i += 16) {
        const noise = (Math.random() - 0.5) * amount;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);
    }
  }
}
