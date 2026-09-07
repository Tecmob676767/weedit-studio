import type { Keyframe } from '../types';

export function getInterpolatedValue(
  keyframes: Keyframe[],
  property: 'x' | 'y' | 'scale' | 'rotation' | 'opacity',
  clipLocalTime: number,
  defaultValue: number
): number {
  const filtered = keyframes
    .filter((kf) => kf.property === property)
    .sort((a, b) => a.time - b.time);

  if (filtered.length === 0) return defaultValue;
  if (clipLocalTime <= filtered[0].time) return filtered[0].value;
  if (clipLocalTime >= filtered[filtered.length - 1].time) {
    return filtered[filtered.length - 1].value;
  }

  // Find surrounding keyframes
  for (let i = 0; i < filtered.length - 1; i++) {
    const k1 = filtered[i];
    const k2 = filtered[i + 1];
    if (clipLocalTime >= k1.time && clipLocalTime <= k2.time) {
      const span = k2.time - k1.time;
      if (span <= 0.0001) return k1.value;
      const progress = (clipLocalTime - k1.time) / span;
      // Smooth ease in-out curve
      const smoothProgress = progress * progress * (3 - 2 * progress);
      return k1.value + (k2.value - k1.value) * smoothProgress;
    }
  }

  return defaultValue;
}
