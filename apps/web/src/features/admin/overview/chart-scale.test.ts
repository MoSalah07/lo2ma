import { describe, expect, it } from 'vitest';
import { chartScale, shareOf } from './chart-scale';

describe('chartScale', () => {
  it('rounds the top up to a friendly number with at most four steps', () => {
    expect(chartScale(142)).toEqual({ top: 150, ticks: [150, 100, 50, 0] });
    expect(chartScale(52)).toEqual({ top: 75, ticks: [75, 50, 25, 0] });
    expect(chartScale(7)).toEqual({ top: 8, ticks: [8, 6, 4, 2, 0] });
  });

  it('still draws an axis when every value is zero', () => {
    expect(chartScale(0)).toEqual({ top: 1, ticks: [1, 0] });
    expect(shareOf(0, 0)).toBe('0%');
  });
});
