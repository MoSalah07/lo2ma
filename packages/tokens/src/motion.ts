// Motion from the design system, after Material 3's motion tokens: how long things take and how they ease.
// CSS transitions (through the Tailwind theme) and Motion components (through the web app's presets) read these
// same values, so a fade lasts the same everywhere.

/** Durations, in milliseconds. */
export const durations = {
  /** A state change in place: a press, a hover, a toggle. */
  fast: 150,
  /** Something leaving the screen. Exits are quicker than entrances. */
  exit: 200,
  /** Something arriving: a message, a card, a notice, a screen. */
  enter: 300,
  /** A large or decorative entrance, like a section of the landing page. */
  slow: 500,
} as const;

/** Cubic-bézier curves, as [x1, y1, x2, y2]. */
export const easings = {
  /** Moving or changing in place. Material's standard curve. */
  standard: [0.2, 0, 0, 1],
  /** Arriving: quick to start, gentle to land. Material's emphasized decelerate. */
  enter: [0.05, 0.7, 0.1, 1],
  /** Leaving: gentle to start, quick to finish. Material's emphasized accelerate. */
  exit: [0.3, 0, 0.8, 0.15],
} as const;

export type Easing = keyof typeof easings;

/** How far an element travels while it appears, in px: enough to read as movement, not as a jump. */
export const travel = 12;

/** The gap between items of a list that appear one after another, in milliseconds. */
export const staggerGap = 50;

/** The CSS form of a curve: cubic-bezier(…). */
export const cubicBezier = (easing: Easing) => `cubic-bezier(${easings[easing].join(', ')})`;
