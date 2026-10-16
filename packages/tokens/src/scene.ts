// Materials of the 3D shapes (landing page, 404, order success), from the canvas storyboard. The lights shade
// each flat face, so these are a step deeper than the UI's tints; the shapes look the same in both themes.
// Radix Colors steps, like the UI colors.

import { colors } from './colors.ts';

export const sceneColors = {
  /** «اللقمة» and the takeaway bag: jade 9, the brand's solid green (the dark theme's primary). */
  brand: colors.dark.primary,
  /** The bag's side and handle: jade 11 (the light theme's primary). */
  deep: colors.light.primary,
  /** The bowl: amber 7. */
  highlight: '#E9C162',
  /** The pill and the inside of the bowl: teal 7. */
  accent: '#83CDC1',
  /** The ring (the break-time clock): jade 6. */
  tint: '#ACDEC8',
} as const;

/**
 * The color of the studio lights in every scene, from the color of a black body at that temperature (Mitchell
 * Charity's table): a warm key, like a window in the afternoon, and a cool rim from behind, so food reads as lit,
 * not flat, on both themes.
 */
export const sceneLights = {
  /** 5000 K */
  key: '#FFE4CE',
  /** 8000 K */
  rim: '#E3E9FF',
} as const;
