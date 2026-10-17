import { mapColors } from '@lo2ma/tokens';
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import { describe, expect, it } from 'vitest';
import { mapStyle, OPENFREEMAP } from './map-style';

describe('mapStyle', () => {
  it('is a valid MapLibre style in both themes and both languages', () => {
    for (const theme of ['light', 'dark'] as const) {
      for (const locale of ['ar', 'en'] as const) {
        expect(validateStyleMin(mapStyle(mapColors[theme], locale))).toEqual([]);
      }
    }
  });

  it('takes only the tiles and the fonts from OpenFreeMap', () => {
    const style = mapStyle(mapColors.light, 'ar');
    expect(style.sources).toEqual({ openmaptiles: { type: 'vector', url: OPENFREEMAP.tiles } });
    expect(style.glyphs).toBe(OPENFREEMAP.glyphs);
    expect(style.sprite).toBeUndefined();
  });

  it('paints with the theme map colors only', () => {
    const dark = JSON.stringify(mapStyle(mapColors.dark, 'en'));
    const palette = new Set(Object.values(mapColors.dark));
    const used = dark.match(/#[0-9A-F]{6}/gi) ?? [];
    expect(used.length).toBeGreaterThan(0);
    for (const color of used) expect(palette).toContain(color);
  });

  it('names places in the page language', () => {
    const label = (locale: 'ar' | 'en') =>
      mapStyle(mapColors.light, locale).layers.find((layer) => layer.id === 'city-name');
    expect(JSON.stringify(label('ar'))).toContain('name:ar');
    expect(JSON.stringify(label('en'))).toContain('name:en');
    expect(JSON.stringify(label('en'))).not.toContain('name:ar');
  });

  it('draws every street casing under every street fill', () => {
    const ids = mapStyle(mapColors.light, 'ar').layers.map((layer) => layer.id);
    const lastCasing = Math.max(...ids.flatMap((id, i) => (id.endsWith('-casing') ? [i] : [])));
    expect(lastCasing).toBeLessThan(ids.indexOf('road-minor'));
  });
});
