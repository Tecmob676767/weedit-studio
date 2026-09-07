export class AudioEngine {
  private static instance: AudioEngine;
  public ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private eqLow: BiquadFilterNode | null = null;
  private eqMid: BiquadFilterNode | null = null;
  private eqHigh: BiquadFilterNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public init() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;

      // 3-Band Parametric EQ
      this.eqLow = this.ctx.createBiquadFilter();
      this.eqLow.type = 'lowshelf';
      this.eqLow.frequency.value = 320; // Hz
      this.eqLow.gain.value = 0;

      this.eqMid = this.ctx.createBiquadFilter();
      this.eqMid.type = 'peaking';
      this.eqMid.frequency.value = 1000; // Hz
      this.eqMid.Q.value = 1.0;
      this.eqMid.gain.value = 0;

      this.eqHigh = this.ctx.createBiquadFilter();
      this.eqHigh.type = 'highshelf';
      this.eqHigh.frequency.value = 3200; // Hz
      this.eqHigh.gain.value = 0;

      // Connect DSP chain: EQ -> Master Gain -> Analyser -> Destination
      this.eqLow.connect(this.eqMid);
      this.eqMid.connect(this.eqHigh);
      this.eqHigh.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getAudioContext(): AudioContext {
    this.init();
    return this.ctx!;
  }

  public setMasterVolume(vol: number) {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(2, vol)), this.ctx?.currentTime || 0);
    }
  }

  public setEQ(lowGain: number, midGain: number, highGain: number) {
    const now = this.ctx?.currentTime || 0;
    if (this.eqLow) this.eqLow.gain.setValueAtTime(lowGain, now);
    if (this.eqMid) this.eqMid.gain.setValueAtTime(midGain, now);
    if (this.eqHigh) this.eqHigh.gain.setValueAtTime(highGain, now);
  }

  public getVUMeterData(): number {
    if (!this.analyser) return 0;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / (data.length * 255); // 0.0 to 1.0
  }

  /**
   * Generates a waveform array (e.g. 80 normalized amplitude points) from an AudioBuffer
   */
  public extractWaveform(audioBuffer: AudioBuffer, samples: number = 80): number[] {
    const rawData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(rawData.length / samples);
    const waveform: number[] = [];

    for (let i = 0; i < samples; i++) {
      const blockStart = blockSize * i;
      let max = 0;
      for (let j = 0; j < blockSize; j++) {
        const val = Math.abs(rawData[blockStart + j]);
        if (val > max) max = val;
      }
      waveform.push(Math.min(1, Math.round(max * 100) / 100));
    }
    return waveform;
  }

  /**
   * Decode an Audio file (Blob / ArrayBuffer) into an AudioBuffer
   */
  public async decodeAudio(data: ArrayBuffer): Promise<AudioBuffer> {
    this.init();
    return await this.ctx!.decodeAudioData(data);
  }

  /**
   * Procedural Audio FX Generators (Studio Grade SFX with zero external assets needed)
   */
  public generateProceduralSFX(type: 'whoosh' | 'impact' | 'pop' | 'riser' | 'ding' | 'subdrop'): AudioBuffer {
    this.init();
    const ctx = this.ctx!;
    const sampleRate = ctx.sampleRate;

    switch (type) {
      case 'whoosh': {
        const duration = 0.6;
        const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate;
          const noise = Math.random() * 2 - 1;
          const envelope = Math.sin((t / duration) * Math.PI);
          data[i] = noise * envelope * 0.7;
        }
        return buffer;
      }
      case 'impact': {
        const duration = 1.2;
        const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate;
          const freq = 120 * Math.exp(-t * 8);
          const tone = Math.sin(2 * Math.PI * freq * t);
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 12);
          const env = Math.exp(-t * 3.5);
          data[i] = (tone * 0.8 + noise * 0.4) * env;
        }
        return buffer;
      }
      case 'pop': {
        const duration = 0.08;
        const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate;
          const freq = 600 - t * 4000;
          data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 60);
        }
        return buffer;
      }
      case 'riser': {
        const duration = 2.0;
        const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate;
          const progress = t / duration;
          const freq = 150 + Math.pow(progress, 2.5) * 1200;
          const tone = Math.sin(2 * Math.PI * freq * t);
          const noise = (Math.random() * 2 - 1) * 0.3 * progress;
          data[i] = (tone * 0.7 + noise) * progress;
        }
        return buffer;
      }
      case 'ding': {
        const duration = 1.0;
        const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate;
          const harmonic1 = Math.sin(2 * Math.PI * 1800 * t);
          const harmonic2 = Math.sin(2 * Math.PI * 3600 * t) * 0.3;
          data[i] = (harmonic1 + harmonic2) * Math.exp(-t * 5) * 0.5;
        }
        return buffer;
      }
      case 'subdrop': {
        const duration = 1.5;
        const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate;
          const freq = 90 * Math.exp(-t * 2.2);
          data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 1.5) * 0.9;
        }
        return buffer;
      }
    }
  }

  /**
   * Convert an AudioBuffer to a playable Blob URL
   */
  public audioBufferToWavBlobUrl(buffer: AudioBuffer): string {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    const channels: Float32Array[] = [];
    let sampleRate = buffer.sampleRate;
    let offset = 0;
    let pos = 0;

    function setUint16(data: number) {
      out.setUint16(pos, data, true);
      pos += 2;
    }
    function setUint32(data: number) {
      out.setUint32(pos, data, true);
      pos += 4;
    }

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16);          // 16 for PCM
    setUint16(1);           // PCM format
    setUint16(numOfChan);
    setUint32(sampleRate);
    setUint32(sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);          // 16-bit
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (offset < buffer.length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        out.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    const blob = new Blob([out.buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  /**
   * Voiceover Recording via Microphone
   */
  public async startVoiceoverRecording(): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(stream);
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };
    this.mediaRecorder.start(100);
    return stream;
  }

  public stopVoiceoverRecording(): Promise<{ blob: Blob; url: string }> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve({ blob: new Blob(), url: '' });
        return;
      }
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        resolve({ blob, url });
      };
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach((t) => t.stop());
    });
  }

  /**
   * Extracts audio track from any video file (MP4, WebM, MOV, etc.)
   */
  public async extractAudioFromVideo(videoBlob: Blob): Promise<{ url: string; duration: number; waveform: number[] }> {
    this.init();
    const arrayBuffer = await videoBlob.arrayBuffer();
    const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
    const url = this.audioBufferToWavBlobUrl(audioBuffer);
    const waveform = this.extractWaveform(audioBuffer, 80);
    return {
      url,
      duration: audioBuffer.duration,
      waveform
    };
  }
}
