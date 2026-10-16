// Page layout from the design system's Layout card. Pages use these names (max-w-app, px-gutter, gap-stack,
// pb-clear-nav…) instead of raw numbers, so every screen has the same widths and spacing.

/** Widths of the page containers, in px. */
export const containers = {
  /** The app screens: a phone-shaped column, centered on wider screens. Fixed bars and sheets match it. */
  app: 480,
  /** The landing page. */
  site: 1280,
  /** The admin dashboard. */
  admin: 1440,
  /** A form card alone in the middle of a wide page: the admin sign-in. */
  form: 440,
} as const;

/** Page-level spacing, in px. */
export const layoutSpacing = {
  /** The side space of every screen: titles, cards and bars line up on it. */
  gutter: 20,
  /** The side space of the top bar and the floating bars: tighter, so round buttons sit near the edge. */
  bar: 12,
  /** The wider side space of the landing page and the dashboard from tablet width. */
  'gutter-md': 32,
  'gutter-lg': 48,
  /** Between the rows of one list: plan days, orders. */
  list: 8,
  /** Between the blocks of a screen: cards, a form's groups, chat messages. */
  stack: 16,
  /** Between the bands of the landing page. */
  section: 32,
  'section-lg': 56,
  /** Kept free at the end of a screen, so the last card clears what floats over it. */
  'clear-end': 32,
  'clear-nav': 128,
  'clear-action': 176,
  'clear-composer': 272,
  'clear-nav-action': 256,
} as const;

/** Distances from the bottom edge, in px, that also clear the phone's home indicator (the safe area). */
export const safeOffsets = {
  /** Under the tab bar. */
  'nav-end': 14,
  /** Under the last button of a screen without a tab bar. */
  'screen-end': 22,
  /** Above the tab bar, where the composer and bottom actions sit on tab screens. */
  'above-nav': 92,
} as const;
