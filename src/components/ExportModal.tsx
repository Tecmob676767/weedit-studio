import React, { useState, useRef } from 'react';
import { 
  X, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { projectStore } from '../state/projectStore';
import { Exporter, type ExportProgress } from '../engine/Exporter';
import type { Resolution } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [fps, setFps] = useState<number>(30);
  const [quality, setQuality] = useState<'high' | 'ultra' | 'medium'>('high');
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exporterRef = useRef<Exporter | null>(null);

  if (!isOpen) return null;

  const project = projectStore.getProject();

  const handleStartExport = async () => {
    setIsExporting(true);
    exporterRef.current = new Exporter();

    try {
      await exporterRef.current.exportProject(
        project,
        {
          resolution,
          fps,
          format: 'webm',
          quality
        },
        (prog: ExportProgress) => {
          setProgress(prog);
          if (prog.status === 'completed') {
            setIsExporting(false);
            // Fire celebratory confetti!
            confetti({
              particleCount: 120,
              spread: 70,
              origin: { y: 0.6 }
            });
          }
        }
      );
    } catch (err: any) {
      setIsExporting(false);
      setProgress((p: ExportProgress | null) => (p ? { ...p, status: 'error', error: err.message } : null));
    }
  };

  const handleCancel = () => {
    if (exporterRef.current) {
      exporterRef.current.cancel();
    }
    setIsExporting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#141824] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0e111a]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-pink-600 flex items-center justify-center text-white">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Export Video Project</h3>
              <p className="text-[11px] text-slate-400">Render high-speed master video file directly in browser</p>
            </div>
          </div>
          {!isExporting && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {!isExporting && (!progress || progress.status !== 'completed') && (
            <>
              {/* Resolution Options */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Resolution</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['720p', '1080p', '4K'] as Resolution[]).map((res) => (
                    <button
                      key={res}
                      onClick={() => setResolution(res)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                        resolution === res
                          ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame Rate */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Frame Rate (FPS)</span>
                <div className="grid grid-cols-3 gap-2">
                  {[24, 30, 60].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFps(f)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                        fps === f
                          ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f} FPS
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality & Bitrate */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Bitrate & Encoding Quality</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'medium', label: 'Fast (6 Mbps)' },
                    { id: 'high', label: 'Pro (12 Mbps)' },
                    { id: 'ultra', label: 'Master (25 Mbps)' },
                  ].map((q) => (
                    <button
                      key={q.id}
                      onClick={() => setQuality(q.id as any)}
                      className={`py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                        quality === q.id
                          ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Project Stats Summary */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Duration: <strong className="text-slate-200">{project.duration.toFixed(1)}s</strong></span>
                <span>Aspect: <strong className="text-slate-200">{project.aspectRatio}</strong></span>
                <span>Tracks: <strong className="text-slate-200">{project.tracks.length}</strong></span>
              </div>
            </>
          )}

          {/* Export In-Progress View */}
          {isExporting && progress && (
            <div className="space-y-4 py-4 text-center">
              <div className="flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
              </div>

              <div>
                <h4 className="text-base font-bold text-white">Rendering Video Composition</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Frame {progress.currentFrame} of {progress.totalFrames} • Elapsed: {progress.elapsedTime.toFixed(1)}s
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-150"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              <div className="text-xl font-extrabold text-indigo-400 font-mono">
                {progress.percent}%
              </div>
            </div>
          )}

          {/* Export Completed View */}
          {progress?.status === 'completed' && progress.downloadUrl && (
            <div className="space-y-4 py-4 text-center">
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-white">Render Finished Successfully!</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Your video is encoded and ready for high-definition playback.
                </p>
              </div>

              {/* Video Preview Player */}
              <div className="max-h-48 rounded-xl overflow-hidden bg-black border border-slate-800 shadow-xl">
                <video
                  src={progress.downloadUrl}
                  controls
                  className="w-full max-h-48 object-contain"
                />
              </div>

              <a
                href={progress.downloadUrl}
                download={`${project.name.toLowerCase().replace(/\s+/g, '-')}-${resolution}.webm`}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/40 flex items-center justify-center space-x-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Rendered Video</span>
              </a>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#0e111a] flex items-center justify-end space-x-3">
          {isExporting ? (
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-semibold transition-colors"
            >
              Cancel Render
            </button>
          ) : progress?.status === 'completed' ? (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Close
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartExport}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start Export</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
