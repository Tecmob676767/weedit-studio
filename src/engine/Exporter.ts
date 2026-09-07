import type { Project, Resolution } from '../types';
import { Renderer, getResolutionForAspect } from './Renderer';
import { AudioEngine } from './AudioEngine';

export interface ExportOptions {
  resolution: Resolution;
  fps: number;
  format: 'webm' | 'mp4';
  quality: 'high' | 'ultra' | 'medium';
}

export interface ExportProgress {
  percent: number;
  currentFrame: number;
  totalFrames: number;
  elapsedTime: number;
  status: 'rendering' | 'encoding' | 'completed' | 'canceled' | 'error';
  downloadUrl?: string;
  error?: string;
}

export class Exporter {
  private isCanceled: boolean = false;

  public cancel() {
    this.isCanceled = true;
  }

  public async exportProject(
    project: Project,
    options: ExportOptions,
    onProgress: (progress: ExportProgress) => void
  ): Promise<Blob> {
    this.isCanceled = false;
    const startTime = Date.now();

    const baseDimensions = getResolutionForAspect(project.aspectRatio);
    let scaleMultiplier = 1;
    if (options.resolution === '720p') scaleMultiplier = 0.666;
    if (options.resolution === '4K') scaleMultiplier = 2.0;

    const exportWidth = Math.round(baseDimensions.width * scaleMultiplier);
    const exportHeight = Math.round(baseDimensions.height * scaleMultiplier);

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportWidth;
    exportCanvas.height = exportHeight;

    const renderer = new Renderer(exportCanvas);
    const audioEngine = AudioEngine.getInstance();
    const audioCtx = audioEngine.getAudioContext();

    // Prepare audio destination
    const audioDest = audioCtx.createMediaStreamDestination();
    const mixedStream = exportCanvas.captureStream(options.fps);

    // Add audio tracks if any
    const audioTracks = audioDest.stream.getAudioTracks();
    if (audioTracks.length > 0) {
      mixedStream.addTrack(audioTracks[0]);
    }

    // Determine mimeType
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
    }

    let videoBitsPerSecond = 12000000; // 12 Mbps
    if (options.quality === 'ultra') videoBitsPerSecond = 25000000;
    if (options.quality === 'medium') videoBitsPerSecond = 6000000;

    const recordedChunks: Blob[] = [];
    const recorder = new MediaRecorder(mixedStream, {
      mimeType,
      videoBitsPerSecond
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    recorder.start(100);

    const totalDuration = Math.max(1, project.duration);
    const totalFrames = Math.ceil(totalDuration * options.fps);
    const frameInterval = 1 / options.fps;

    let currentFrame = 0;

    return new Promise(async (resolve, reject) => {
      const renderNext = async () => {
        if (this.isCanceled) {
          recorder.stop();
          onProgress({
            percent: 0,
            currentFrame,
            totalFrames,
            elapsedTime: (Date.now() - startTime) / 1000,
            status: 'canceled'
          });
          reject(new Error('Export canceled by user'));
          return;
        }

        const currentTime = currentFrame * frameInterval;
        renderer.renderFrame(project, currentTime);

        currentFrame++;
        const percent = Math.min(100, Math.round((currentFrame / totalFrames) * 100));
        const elapsedTime = (Date.now() - startTime) / 1000;

        onProgress({
          percent,
          currentFrame,
          totalFrames,
          elapsedTime,
          status: currentFrame >= totalFrames ? 'encoding' : 'rendering'
        });

        if (currentFrame < totalFrames) {
          // Allow render tick to capture
          setTimeout(renderNext, 1000 / options.fps);
        } else {
          // Finish recording
          setTimeout(() => {
            recorder.onstop = () => {
              const blob = new Blob(recordedChunks, { type: mimeType });
              const downloadUrl = URL.createObjectURL(blob);
              onProgress({
                percent: 100,
                currentFrame: totalFrames,
                totalFrames,
                elapsedTime: (Date.now() - startTime) / 1000,
                status: 'completed',
                downloadUrl
              });
              resolve(blob);
            };
            recorder.stop();
          }, 400);
        }
      };

      renderNext();
    });
  }
}
