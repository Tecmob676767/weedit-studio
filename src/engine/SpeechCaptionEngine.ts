export interface SubtitleCue {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  words?: { word: string; start: number; end: number }[];
}

export class SpeechCaptionEngine {
  private recognition: any = null;

  constructor() {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  /**
   * Generates auto-captions from audio or video using browser speech recognition or smart sentence timing
   */
  public generateSmartSubtitlesFromText(fullText: string, totalDuration: number): SubtitleCue[] {
    const sentences = fullText.split(/(?<=[.?!])\s+/).filter(Boolean);
    if (sentences.length === 0) return [];

    const durationPerSentence = totalDuration / sentences.length;
    const cues: SubtitleCue[] = [];

    sentences.forEach((sentence, idx) => {
      const startTime = idx * durationPerSentence;
      const endTime = Math.min(totalDuration, (idx + 1) * durationPerSentence);
      const words = sentence.split(/\s+/).filter(Boolean);
      const wordDuration = (endTime - startTime) / Math.max(1, words.length);

      const wordCues = words.map((w, wIdx) => ({
        word: w,
        start: startTime + wIdx * wordDuration,
        end: startTime + (wIdx + 1) * wordDuration
      }));

      cues.push({
        id: 'cue-' + idx + '-' + Date.now(),
        startTime: Math.round(startTime * 100) / 100,
        endTime: Math.round(endTime * 100) / 100,
        text: sentence,
        words: wordCues
      });
    });

    return cues;
  }

  /**
   * Export Subtitles to SRT format
   */
  public exportToSRT(cues: SubtitleCue[]): string {
    const formatTime = (seconds: number): string => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 1000);
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    };

    return cues.map((cue, index) => {
      return `${index + 1}\n${formatTime(cue.startTime)} --> ${formatTime(cue.endTime)}\n${cue.text}\n`;
    }).join('\n');
  }

  /**
   * Parse uploaded SRT file into SubtitleCues
   */
  public parseSRT(srtContent: string): SubtitleCue[] {
    const parseTime = (timeStr: string): number => {
      const [hms, ms] = timeStr.trim().split(',');
      const [h, m, s] = hms.split(':').map(Number);
      return h * 3600 + m * 60 + s + (Number(ms) || 0) / 1000;
    };

    const blocks = srtContent.trim().split(/\n\s*\n/);
    const cues: SubtitleCue[] = [];

    blocks.forEach((block, idx) => {
      const lines = block.split('\n');
      if (lines.length >= 2) {
        const timeMatch = lines[1].match(/(.*) --> (.*)/);
        if (timeMatch) {
          const startTime = parseTime(timeMatch[1]);
          const endTime = parseTime(timeMatch[2]);
          const text = lines.slice(2).join(' ');
          cues.push({
            id: 'srt-' + idx,
            startTime,
            endTime,
            text
          });
        }
      }
    });

    return cues;
  }
}
