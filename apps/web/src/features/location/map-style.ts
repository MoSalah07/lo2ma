import type { Locale } from '@lo2ma/i18n/locales';
import type { MapColors } from '@lo2ma/tokens';
import type {
  ExpressionSpecification,
  FilterSpecification,
  LayerSpecification,
  StyleSpecification,
} from '@maplibre/maplibre-gl-style-spec';

/**
 * OpenFreeMap: free OpenStreetMap vector tiles and fonts, with no key and no limits. The style is ours (OpenFreeMap
 * asks that a changed style be hosted by whoever changes it), so only the tiles and the fonts come from them.
 */
export const OPENFREEMAP = {
  tiles: 'https://tiles.openfreemap.org/planet',
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
};

const SOURCE = 'openmaptiles';
const REGULAR = ['Noto Sans Regular'];
const BOLD = ['Noto Sans Bold'];

const isLine: ExpressionSpecification = [
  'match',
  ['geometry-type'],
  ['LineString', 'MultiLineString'],
  true,
  false,
];
const isArea: ExpressionSpecification = [
  'match',
  ['geometry-type'],
  ['Polygon', 'MultiPolygon'],
  true,
  false,
];
const ofClass = (...classes: string[]): ExpressionSpecification => [
  'match',
  ['get', 'class'],
  classes,
  true,
  false,
];

/**
 * Names in the page's language. In Egypt OpenStreetMap's own name is Arabic; English pages fall back to the Latin
 * spelling where there is no English one.
 */
function labelText(locale: Locale): ExpressionSpecification {
  return locale === 'ar'
    ? ['coalesce', ['get', 'name:ar'], ['get', 'name']]
    : ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name:latin'], ['get', 'name']];
}

/** Street width by zoom, from a hairline across a district to a real street up close. */
const width = (at13: number, at20: number): ExpressionSpecification => [
  'interpolate',
  ['exponential', 1.5],
  ['zoom'],
  13,
  at13,
  20,
  at20,
];

/** A street class drawn twice: the casing under, the fill over, so streets read as edges on a flat map. */
function road(
  id: string,
  classes: string[],
  minzoom: number,
  fill: string,
  casing: string,
  [inner, outer]: [number, number],
): [casing: LayerSpecification, fill: LayerSpecification] {
  const filter: FilterSpecification = ['all', isLine, ofClass(...classes)];
  const base = { source: SOURCE, 'source-layer': 'transportation', minzoom, filter } as const;
  const layout = { 'line-cap': 'round', 'line-join': 'round' } as const;
  return [
    {
      id: `${id}-casing`,
      type: 'line',
      ...base,
      layout,
      paint: { 'line-color': casing, 'line-width': width(inner + 1, outer + 4) },
    },
    {
      id,
      type: 'line',
      ...base,
      layout,
      paint: { 'line-color': fill, 'line-width': width(inner, outer) },
    },
  ];
}

/**
 * Lo2ma's map: the OpenMapTiles layers a courier map needs (land, parks, water, buildings, streets, names), in
 * the theme's map colors and the page's language. No icons and no points of interest, so the pin stays the only
 * thing that stands out.
 */
export function mapStyle(colors: MapColors, locale: Locale): StyleSpecification {
  const text = labelText(locale);
  const halo = { 'text-halo-color': colors.labelHalo, 'text-halo-width': 1.5 };
  const [minorCasing, minor] = road(
    'road-minor',
    ['minor', 'service'],
    13,
    colors.road,
    colors.roadCasing,
    [1, 14],
  );
  const [majorCasing, major] = road(
    'road-major',
    ['primary', 'secondary', 'tertiary', 'trunk'],
    9,
    colors.road,
    colors.roadCasing,
    [2, 22],
  );
  const [motorwayCasing, motorway] = road(
    'motorway',
    ['motorway'],
    7,
    colors.motorway,
    colors.motorwayCasing,
    [2.5, 26],
  );

  return {
    version: 8,
    name: 'Lo2ma',
    sources: { [SOURCE]: { type: 'vector', url: OPENFREEMAP.tiles } },
    glyphs: OPENFREEMAP.glyphs,
    layers: [
      { id: 'land', type: 'background', paint: { 'background-color': colors.land } },
      {
        id: 'landuse',
        type: 'fill',
        source: SOURCE,
        'source-layer': 'landuse',
        filter: ['all', isArea, ofClass('residential', 'commercial', 'industrial', 'retail')],
        paint: { 'fill-color': colors.landuse },
      },
      {
        id: 'park',
        type: 'fill',
        source: SOURCE,
        'source-layer': 'park',
        filter: isArea,
        paint: { 'fill-color': colors.park },
      },
      {
        id: 'green',
        type: 'fill',
        source: SOURCE,
        'source-layer': 'landcover',
        filter: ['all', isArea, ofClass('grass', 'wood', 'farmland')],
        paint: { 'fill-color': colors.park, 'fill-opacity': 0.7 },
      },
      {
        id: 'water',
        type: 'fill',
        source: SOURCE,
        'source-layer': 'water',
        filter: ['all', isArea, ['!=', ['get', 'brunnel'], 'tunnel']],
        paint: { 'fill-color': colors.water },
      },
      {
        id: 'waterway',
        type: 'line',
        source: SOURCE,
        'source-layer': 'waterway',
        filter: isLine,
        paint: { 'line-color': colors.water, 'line-width': width(1, 8) },
      },
      {
        id: 'building',
        type: 'fill',
        source: SOURCE,
        'source-layer': 'building',
        minzoom: 14,
        paint: { 'fill-color': colors.building },
      },
      minorCasing,
      majorCasing,
      motorwayCasing,
      minor,
      major,
      motorway,
      {
        id: 'boundary',
        type: 'line',
        source: SOURCE,
        'source-layer': 'boundary',
        filter: ['<=', ['get', 'admin_level'], 4],
        paint: { 'line-color': colors.boundary, 'line-dasharray': [3, 2], 'line-width': 1 },
      },
      {
        id: 'water-name',
        type: 'symbol',
        source: SOURCE,
        'source-layer': 'water_name',
        layout: { 'text-field': text, 'text-font': REGULAR, 'text-size': 13 },
        paint: { 'text-color': colors.label, ...halo },
      },
      {
        id: 'street-name',
        type: 'symbol',
        source: SOURCE,
        'source-layer': 'transportation_name',
        minzoom: 14,
        layout: {
          'symbol-placement': 'line',
          'text-field': text,
          'text-font': REGULAR,
          'text-size': 12,
        },
        paint: { 'text-color': colors.label, ...halo },
      },
      {
        id: 'district-name',
        type: 'symbol',
        source: SOURCE,
        'source-layer': 'place',
        minzoom: 11,
        filter: ofClass('suburb', 'quarter', 'neighbourhood', 'town', 'village'),
        layout: { 'text-field': text, 'text-font': REGULAR, 'text-size': 13, 'text-max-width': 8 },
        paint: { 'text-color': colors.label, ...halo },
      },
      {
        id: 'city-name',
        type: 'symbol',
        source: SOURCE,
        'source-layer': 'place',
        filter: ofClass('city'),
        layout: { 'text-field': text, 'text-font': BOLD, 'text-size': 16, 'text-max-width': 8 },
        paint: { 'text-color': colors.labelStrong, ...halo },
      },
    ],
  };
}
