import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast.ts';
import { mapColors, type MapColorName } from './map.ts';

const themes = ['light', 'dark'] as const;

describe('map colors', () => {
  it('name the same things in both themes, all as hex colors', () => {
    expect(Object.keys(mapColors.dark).sort()).toEqual(Object.keys(mapColors.light).sort());
    for (const theme of themes) {
      for (const value of Object.values(mapColors[theme])) expect(value).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('keep labels readable on the land, like text on the page (4.5:1)', () => {
    const pairs: [MapColorName, MapColorName][] = [
      ['label', 'land'],
      ['label', 'landuse'],
      ['labelStrong', 'land'],
    ];
    for (const theme of themes) {
      for (const [text, background] of pairs) {
        expect(
          contrastRatio(mapColors[theme][text], mapColors[theme][background]),
          `${theme}: ${text} on ${background}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('set water and parks apart from the land', () => {
    for (const theme of themes) {
      expect(mapColors[theme].water).not.toBe(mapColors[theme].land);
      expect(mapColors[theme].park).not.toBe(mapColors[theme].land);
    }
  });
});
