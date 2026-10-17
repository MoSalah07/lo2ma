// Elevation. Every shadow starts with a 1px hairline (a spread, so it takes no layout space), then a soft two-layer
// shade. Light mode shades with Sage 12 (26, 33, 30) at low alpha; dark mode outlines with white at low alpha, since
// a shadow barely shows on a dark page. The primary button's glow is the theme's primary: jade 11 in light, jade 9
// in dark.
const light = {
  /** Cards and everything that sits on the page. */
  card: '0 0 0 1px rgba(26, 33, 30, 0.07), 0 1px 2px rgba(26, 33, 30, 0.05), 0 4px 12px -4px rgba(26, 33, 30, 0.08)',
  /** Menus, popovers and the controls over the map. */
  float:
    '0 0 0 1px rgba(26, 33, 30, 0.06), 0 2px 4px rgba(26, 33, 30, 0.05), 0 12px 28px -8px rgba(26, 33, 30, 0.16)',
  /** Translucent bars over content: the tab bar, the composer. */
  glass: 'inset 0 0 0 1px rgba(26, 33, 30, 0.07), 0 10px 24px -12px rgba(26, 33, 30, 0.22)',
  /** A sheet rising from the bottom. */
  sheet: '0 -1px 0 rgba(26, 33, 30, 0.06), 0 -10px 30px -14px rgba(26, 33, 30, 0.25)',
  /** The selected option of a segmented control. */
  segment: '0 0 0 1px rgba(26, 33, 30, 0.04), 0 1px 2px rgba(26, 33, 30, 0.1)',
  /** A filled button: a highlight along its top edge, so it reads as raised. */
  button: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 1px 2px rgba(26, 33, 30, 0.12)',
  /** The primary button under the pointer. */
  glow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 6px 18px -6px rgba(32, 131, 104, 0.55)',
} as const;

export type ShadowName = keyof typeof light;

const dark: Record<ShadowName, string> = {
  card: '0 0 0 1px rgba(255, 255, 255, 0.06), 0 6px 18px -8px rgba(0, 0, 0, 0.6)',
  float: '0 0 0 1px rgba(255, 255, 255, 0.08), 0 12px 28px -8px rgba(0, 0, 0, 0.6)',
  glass: 'inset 0 0 0 1px rgba(255, 255, 255, 0.07), 0 10px 30px -10px rgba(0, 0, 0, 0.6)',
  sheet: 'inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 -10px 30px -14px rgba(0, 0, 0, 0.7)',
  segment: 'inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
  button: 'inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 1px 2px rgba(0, 0, 0, 0.4)',
  glow: 'inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 6px 20px -6px rgba(41, 163, 131, 0.5)',
};

export const shadows = { light, dark };
