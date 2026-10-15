import { describe, expect, it } from 'vitest';
import { contrastRatio, relativeLuminance } from './contrast.ts';

describe('contrastRatio', () => {
  it('gives 21 for black on white and 1 for a color on itself', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#3452FF', '#3452FF')).toBe(1);
  });

  it('matches the published WCAG value for #777777 on white', () => {
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
  });

  it('does not depend on argument order', () => {
    expect(contrastRatio('#0C0C10', '#F5F5F7')).toBe(contrastRatio('#F5F5F7', '#0C0C10'));
  });
});

describe('relativeLuminance', () => {
  it('accepts lowercase hex', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
  });

  it('rejects anything that is not #RRGGBB', () => {
    expect(() => relativeLuminance('#FFF')).toThrow();
    expect(() => relativeLuminance('rgba(0, 0, 0, 0.5)')).toThrow();
  });
});
