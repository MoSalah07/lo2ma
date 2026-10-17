// Corners by role, so one kind of element has one radius everywhere, and changing it here changes them all.
// Medium rather than pill-shaped: the look chosen on 2026-10-17. Circles (avatars, dots, the progress track)
// use rounded-full.
export const radii = {
  /** Badges, tags and chart bars. */
  tag: 6,
  /** Anything you tap or type in: buttons, fields, chips, segmented controls, icon buttons. */
  control: 12,
  /** Cards, notices, list groups and chat bubbles. */
  card: 16,
  /** Sheets, dialogs, the bars that float over a screen, the landing's photo cards. */
  panel: 24,
} as const;

export type RadiusName = keyof typeof radii;
