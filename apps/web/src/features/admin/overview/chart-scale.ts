const STEPS = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];
const MAX_INTERVALS = 4;

/**
 * A y-axis with round numbers that fits `max`: 142 → top 150, ticks 150, 100, 50, 0.
 * Ticks are listed from the top down, the order the axis draws them.
 */
export function chartScale(max: number): { top: number; ticks: number[] } {
  const step =
    STEPS.find((candidate) => Math.ceil(max / candidate) <= MAX_INTERVALS) ?? STEPS.at(-1)!;
  const intervals = Math.max(1, Math.ceil(max / step));
  const top = intervals * step;
  return { top, ticks: Array.from({ length: intervals + 1 }, (_, index) => top - index * step) };
}

/** A value's share of the axis height, as a CSS percentage. */
export const shareOf = (value: number, top: number) => `${top === 0 ? 0 : (value / top) * 100}%`;
