/**
 * BeatDetector: Analyzes AudioBuffer transients and returns rhythmic beat timestamps
 * for magnetic timeline snapping and rhythm-synchronized cuts.
 */
export function detectBeats(audioBuffer: AudioBuffer, sensitivity: number = 1.3): number[] {
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);
  const beats: number[] = [];

  // Break down into 1024-sample chunks (approx 21ms at 48kHz)
  const windowSize = 1024;
  const energies: number[] = [];

  for (let i = 0; i < channelData.length; i += windowSize) {
    let energy = 0;
    const end = Math.min(i + windowSize, channelData.length);
    for (let j = i; j < end; j++) {
      energy += channelData[j] * channelData[j];
    }
    energies.push(energy / (end - i));
  }

  // Sliding average energy window (approx 1 second)
  const historySize = Math.floor(sampleRate / windowSize);
  const minIntervalSeconds = 0.25; // Max 240 BPM to prevent double-hits
  let lastBeatTime = -1;

  for (let i = historySize; i < energies.length; i++) {
    let localAvg = 0;
    for (let j = i - historySize; j < i; j++) {
      localAvg += energies[j];
    }
    localAvg /= historySize;

    const instantEnergy = energies[i];
    const threshold = localAvg * sensitivity;

    if (instantEnergy > threshold && instantEnergy > 0.005) {
      const timeInSec = (i * windowSize) / sampleRate;
      if (lastBeatTime === -1 || timeInSec - lastBeatTime >= minIntervalSeconds) {
        beats.push(Math.round(timeInSec * 100) / 100);
        lastBeatTime = timeInSec;
      }
    }
  }

  return beats;
}
