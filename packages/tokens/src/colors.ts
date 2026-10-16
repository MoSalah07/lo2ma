// Semantic colors, built from Radix Colors 3.0 scales: Jade (the brand), Sage (its gray), Violet (the lilac
// accent), Pink, Grass (good), Amber (warn) and Red (danger). Components use these names (bg-surface, text-ink),
// so switching the theme swaps the values without any dark: classes.
//
// Every value is a Radix step, mostly the usual ones: 1–3 for backgrounds, 6 for lines, 9 for solid fills,
// 11 for colored text and 12 for the main text. Where a usual step misses 4.5:1 (WCAG AA), the next one is used
// and noted below.
const light = {
  /** sage 2 */
  bg: '#F7F9F8',
  surface: '#FFFFFF',
  /** sage 3 */
  surface2: '#EEF1F0',
  /** The selected segment of a segmented control. */
  surfaceRaised: '#FFFFFF',
  /** sage 12 */
  ink: '#1A211E',
  /** sage 11. Radix has two text levels, so the secondary and the quiet text share it. */
  ink2: '#5F6563',
  muted: '#5F6563',
  /** Borders, outlines and progress tracks. sage 6 */
  line: '#D7DAD9',
  /** Separators inside cards and disabled fills. sage 4 */
  divider: '#E6E9E8',
  /** jade 11: jade 9 is too light for white text in the light theme (3.2:1). */
  primary: '#208368',
  /** The primary button under the pointer: one step toward more contrast. jade 12 */
  primaryHover: '#1D3B31',
  onPrimary: '#FFFFFF',
  /** Brand-colored text and icons on bg or surface (links, «غيّر»). jade 12: jade 11 is 4.4:1 on bg. */
  primaryInk: '#1D3B31',
  /** Brand text on a button colored onPrimary that sits on a primary surface. jade 11 */
  primaryDeep: '#208368',
  /** jade 3 */
  tint: '#E6F7ED',
  /** jade 12: jade 11 is 4.2:1 on jade 3. */
  onTint: '#1D3B31',
  /** violet 3 and 11 */
  lilac: '#F4F0FE',
  onLilac: '#6550B9',
  /** pink 3 and 11 */
  pink: '#FEE9F5',
  onPink: '#C2298A',
  /** grass 3 and 11 */
  good: '#E9F6E9',
  onGood: '#2A7E3B',
  /** amber 3 and 12: amber 11 is 4.3:1 on amber 3. */
  warn: '#FFF7C2',
  onWarn: '#4F3422',
  /** red 3 and 11 */
  danger: '#FEEBEC',
  onDanger: '#CE2C31',
  /** sage 12 and 1 */
  inverse: '#1A211E',
  onInverse: '#FBFDFC',
  glass: 'rgba(255, 255, 255, 0.86)',
  /** sage 12 at 48% */
  scrim: 'rgba(26, 33, 30, 0.48)',
} as const;

export type ColorName = keyof typeof light;

// The dark scales of the same colors, at the same steps.
const dark: Record<ColorName, string> = {
  /** sage 1 */
  bg: '#101211',
  /** sage 2 */
  surface: '#171918',
  /** sage 3 */
  surface2: '#202221',
  /** sage 4 */
  surfaceRaised: '#272A29',
  /** sage 12 */
  ink: '#ECEEED',
  /** sage 11 */
  ink2: '#ADB5B2',
  muted: '#ADB5B2',
  /** sage 6 */
  line: '#373B39',
  /** sage 4 */
  divider: '#272A29',
  /** jade 9, with the darkest gray on it: Radix's advice for bright colors, and 6:1. */
  primary: '#29A383',
  /** jade 10, Radix's hover step for a step-9 fill. */
  primaryHover: '#27B08B',
  onPrimary: '#101211',
  /** jade 11 */
  primaryInk: '#1FD8A4',
  /** jade 11, light enough for the dark onPrimary. */
  primaryDeep: '#1FD8A4',
  /** jade 3 and 11 */
  tint: '#0F2E22',
  onTint: '#1FD8A4',
  /** violet 3 and 11 */
  lilac: '#291F43',
  onLilac: '#BAA7FF',
  /** pink 3 and 11 */
  pink: '#37172F',
  onPink: '#FF8DCC',
  /** grass 3 and 11 */
  good: '#1B2A1E',
  onGood: '#71D083',
  /** amber 3 and 11 */
  warn: '#302008',
  onWarn: '#FFCA16',
  /** red 3 and 11 */
  danger: '#3B1219',
  onDanger: '#FF9592',
  /** sage 12 and 1 */
  inverse: '#ECEEED',
  onInverse: '#101211',
  /** sage 2 at 84% */
  glass: 'rgba(23, 25, 24, 0.84)',
  scrim: 'rgba(0, 0, 0, 0.62)',
};

export const colors = { light, dark };
