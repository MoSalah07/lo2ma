// The curves the 3D scenes move on. Each takes progress from 0 to 1 and returns the eased value.

export const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

/** Fast out of the gate, gentle landing. */
export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** Overshoots a little, then settles: things that pop into place. */
export const easeOutBack = (t: number) => 1 + 2.7 * (t - 1) ** 3 + 1.7 * (t - 1) ** 2;

/** Lands with a couple of shrinking bounces: things that fall into a bowl. */
export function easeOutBounce(t: number) {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
}

/** Progress of a step that starts after `delay` seconds and lasts `duration` seconds, at time `time`. */
export const stepProgress = (time: number, delay: number, duration: number) =>
  clamp01((time - delay) / duration);
