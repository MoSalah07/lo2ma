import { colors, type ColorName } from './colors.ts';
import { shadows, type ShadowName } from './shadows.ts';

/** camelCase token name → the kebab-case name used in CSS and class names: surface2 → surface-2. */
export const kebab = (name: string) => name.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase();

/** Color names as they appear in classes (bg-surface-2, text-on-primary). */
export const colorClassNames = (Object.keys(colors.light) as ColorName[]).map(kebab);

/** Shadow names as they appear in classes (shadow-card). */
export const shadowClassNames = (Object.keys(shadows.light) as ShadowName[]).map(kebab);
