// The map's colors, in Radix Colors 3.0 steps like the rest of the UI, so the map reads as part of Lo2ma in both
// themes: land in the page's jade background, water in teal, parks in grass, streets one step off the land,
// motorways in amber, and labels in the same grays as text.
import { colors } from './colors.ts';

const light = {
  /** jade 2: the page background. */
  land: colors.light.bg,
  /** Residential areas. sage 2 */
  landuse: '#F7F9F8',
  /** grass 4 */
  park: '#DAF1DB',
  /** teal 5: the Nile and the canals stand out from the land. */
  water: '#B8EAE0',
  /** sage 4 */
  building: '#E6E9E8',
  /** jade 1 */
  road: colors.light.surface,
  /** sage 6 */
  roadCasing: colors.light.line,
  /** amber 4 */
  motorway: '#FFEE9C',
  /** amber 6 */
  motorwayCasing: '#F3D673',
  /** sage 7 */
  boundary: '#CBCFCD',
  /** sage 11: streets and districts. */
  label: colors.light.muted,
  /** sage 12: cities. */
  labelStrong: colors.light.ink,
  /** jade 1: keeps a label readable over roads. */
  labelHalo: colors.light.surface,
} as const;

export type MapColorName = keyof typeof light;

const dark: Record<MapColorName, string> = {
  /** jade 1 */
  land: colors.dark.bg,
  /** jade 2 */
  landuse: colors.dark.surface,
  /** grass 3 */
  park: '#1B2A1E',
  /** teal 4 */
  water: '#023B37',
  /** sage 3 */
  building: colors.dark.surface2,
  /** sage 5 */
  road: '#2E3130',
  /** sage 3 */
  roadCasing: colors.dark.surface2,
  /** amber 4 */
  motorway: '#3F2700',
  /** amber 6 */
  motorwayCasing: '#5C3D05',
  /** sage 7 */
  boundary: '#444947',
  /** sage 11 */
  label: colors.dark.muted,
  /** sage 12 */
  labelStrong: colors.dark.ink,
  /** jade 1 */
  labelHalo: colors.dark.bg,
};

export const mapColors = { light, dark };
export type MapColors = Record<MapColorName, string>;
