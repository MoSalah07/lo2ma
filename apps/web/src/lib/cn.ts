import { colorClassNames, fontSizes, lineHeights, radius, shadowClassNames } from '@lo2ma/tokens';
import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// tailwind-merge must know our token names. Without this it can't tell that text-15 is a size and text-ink
// is a color, so it would drop one of them.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: colorClassNames,
      text: fontSizes.map(String),
      radius: radius.map(String),
      shadow: shadowClassNames,
      leading: Object.keys(lineHeights),
    },
  },
});

/** Joins class names and lets later Tailwind classes override earlier ones: cn('p-4', isTight && 'p-2'). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
