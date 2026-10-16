// Materials of the 3D shapes (landing page, 404, order success), from the canvas storyboard. The lights shade
// each flat face, so these are a step deeper than the UI's tints; the shapes look the same in both themes.

import { colors } from './colors.ts';

export const sceneColors = {
  /** «اللقمة» and the takeaway bag: the brand cobalt. */
  cobalt: colors.light.primary,
  /** The bag's side and handle. */
  deep: colors.light.primaryDeep,
  /** The bowl. */
  pink: '#FFB3D9',
  /** The pill and the inside of the bowl. */
  lilac: '#D4C7FF',
  /** The ring (the break-time clock). */
  tint: '#C9D1FF',
} as const;
