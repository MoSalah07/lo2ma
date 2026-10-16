import { colors, type ColorName } from './colors.ts';
import { containers, layoutSpacing, safeOffsets } from './layout.ts';
import { kebab } from './names.ts';
import { radius } from './radius.ts';
import { sceneColors } from './scene.ts';
import { shadows, type ShadowName } from './shadows.ts';
import type { Theme } from './theme.ts';
import { fontFallback, fontSizes, fontVariable, lineHeights } from './typography.ts';

const HEADER =
  '/* Generated from packages/tokens/src by `npm run build -w @lo2ma/tokens`. Do not edit by hand. */';

const selectors: Record<Theme, string> = { light: ':root', dark: '.dark' };

export const colorVar = (name: ColorName) => `--lq-${kebab(name)}`;
export const shadowVar = (name: ShadowName) => `--lq-shadow-${kebab(name)}`;

/** px → rem, so layout follows the browser's font size like the text does. */
const rem = (px: number) => `${px / 16}rem`;

const block = (selector: string, lines: string[]) =>
  `${selector} {\n${lines.map((line) => `  ${line}`).join('\n')}\n}`;

function themeBlock(theme: Theme): string {
  return block(selectors[theme], [
    `color-scheme: ${theme};`,
    ...Object.entries(colors[theme]).map(
      ([name, value]) => `${colorVar(name as ColorName)}: ${value};`,
    ),
    ...Object.entries(shadows[theme]).map(
      ([name, value]) => `${shadowVar(name as ShadowName)}: ${value};`,
    ),
  ]);
}

// `inline` makes each utility read the runtime variable, so `.dark` swaps every color and shadow at once.
// `initial` removes Tailwind's defaults, so only design tokens exist (no bg-red-500, rounded-lg or text-sm).
function tailwindTheme(): string {
  const colorNames = Object.keys(colors.light) as ColorName[];
  const shadowNames = Object.keys(shadows.light) as ShadowName[];
  return block('@theme inline', [
    '--color-*: initial;',
    ...colorNames.map((name) => `--color-${kebab(name)}: var(${colorVar(name)});`),
    // The 3D materials, the same in both themes, so a scene's still picture matches the scene (bg-scene-highlight).
    ...Object.entries(sceneColors).map(
      ([name, value]) => `--color-scene-${kebab(name)}: ${value};`,
    ),
    '--shadow-*: initial;',
    ...shadowNames.map((name) => `--shadow-${kebab(name)}: var(${shadowVar(name)});`),
    '--radius-*: initial;',
    ...radius.map((px) => `--radius-${px}: ${px}px;`),
    '--text-*: initial;',
    ...fontSizes.map((px) => `--text-${px}: ${px / 16}rem;`),
    ...Object.entries(lineHeights).map(([name, value]) => `--leading-${name}: ${value};`),
    `--font-sans: var(${fontVariable}), ${fontFallback};`,
    '--container-*: initial;',
    ...Object.entries(containers).map(([name, px]) => `--container-${name}: ${rem(px)};`),
    ...Object.entries(layoutSpacing).map(([name, px]) => `--spacing-${name}: ${rem(px)};`),
    ...Object.entries(safeOffsets).map(
      ([name, px]) => `--spacing-${name}: calc(${rem(px)} + env(safe-area-inset-bottom));`,
    ),
  ]);
}

export function buildTokensCss(): string {
  return `${[HEADER, themeBlock('light'), themeBlock('dark'), tailwindTheme()].join('\n\n')}\n`;
}
