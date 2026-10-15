import { describe, expect, it } from 'vitest';
import { colors, type ColorName } from './colors.ts';
import { contrastRatio } from './contrast.ts';
import { themes } from './theme.ts';

type Pair = [foreground: ColorName, background: ColorName];

// Every text color and the backgrounds it sits on in the designs. WCAG AA needs 4.5:1.
const textPairs: Pair[] = [
  ['ink', 'bg'],
  ['ink', 'surface'],
  ['ink', 'surface2'],
  ['ink', 'surfaceRaised'],
  ['ink2', 'bg'],
  ['ink2', 'surface'],
  ['ink2', 'surface2'],
  ['muted', 'bg'],
  ['muted', 'surface'],
  ['muted', 'surface2'],
  ['muted', 'divider'],
  ['primaryInk', 'bg'],
  ['primaryInk', 'surface'],
  ['primaryInk', 'surface2'],
  ['onPrimary', 'primary'],
  ['onTint', 'tint'],
  ['onLilac', 'lilac'],
  ['onPink', 'pink'],
  ['onGood', 'good'],
  ['onWarn', 'warn'],
  ['onDanger', 'danger'],
  ['onInverse', 'inverse'],
];

// Non-text marks (filled buttons, progress bars, focus rings) need 3:1 against what is around them.
const graphicPairs: Pair[] = [
  ['primary', 'bg'],
  ['primary', 'surface'],
];

describe.each(themes)('%s theme', (theme) => {
  const palette = colors[theme];

  it.each(textPairs)('%s text on %s reaches 4.5:1', (foreground, background) => {
    expect(contrastRatio(palette[foreground], palette[background])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(graphicPairs)('%s on %s reaches 3:1', (foreground, background) => {
    expect(contrastRatio(palette[foreground], palette[background])).toBeGreaterThanOrEqual(3);
  });
});
