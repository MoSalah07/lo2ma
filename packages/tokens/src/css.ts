import { colors, type ColorName } from './colors.ts';
import { containers, layoutSpacing, safeOffsets } from './layout.ts';
import { cubicBezier, durations, easings, type Easing } from './motion.ts';
import { kebab } from './names.ts';
import { radius } from './radius.ts';
import { sceneColors } from './scene.ts';
import { shadows, type ShadowName } from './shadows.ts';
import type { Theme } from './theme.ts';
import { fontFallback, fontVariable, lineHeights, textRoles, type TextRole } from './typography.ts';

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
    // Text roles: text-title-lg sets the size, the line height and the weight in one class. A screen can still
    // change the weight (font-bold) or the line height (leading-body) on top.
    '--text-*: initial;',
    ...Object.entries(textRoles).flatMap(([name, role]) => textRole(name, role)),
    ...Object.entries(lineHeights).map(([name, value]) => `--leading-${name}: ${value};`),
    `--font-sans: var(${fontVariable}), ${fontFallback};`,
    // Motion: only our curves exist (ease-standard, ease-enter, ease-exit), and every transition-* utility
    // defaults to the fast duration on the standard curve.
    '--ease-*: initial;',
    ...(Object.keys(easings) as Easing[]).map((name) => `--ease-${name}: ${cubicBezier(name)};`),
    `--default-transition-duration: ${durations.fast}ms;`,
    `--default-transition-timing-function: ${cubicBezier('standard')};`,
    '--container-*: initial;',
    ...Object.entries(containers).map(([name, px]) => `--container-${name}: ${rem(px)};`),
    // From this width the app's column no longer fills the screen (app:), so a full-screen panel becomes a card.
    `--breakpoint-app: ${rem(containers.app)};`,
    ...Object.entries(layoutSpacing).map(([name, px]) => `--spacing-${name}: ${rem(px)};`),
    ...Object.entries(safeOffsets).map(
      ([name, px]) => `--spacing-${name}: calc(${rem(px)} + env(safe-area-inset-bottom));`,
    ),
  ]);
}

/** The Tailwind theme variables of one text role: --text-<name> and its line height and weight. */
function textRole(name: string, { size, lineHeight, weight }: TextRole): string[] {
  return [
    `--text-${name}: ${rem(size)};`,
    `--text-${name}--line-height: ${lineHeight};`,
    ...(weight === undefined ? [] : [`--text-${name}--font-weight: ${weight};`]),
  ];
}

export function buildTokensCss(): string {
  return `${[HEADER, themeBlock('light'), themeBlock('dark'), tailwindTheme()].join('\n\n')}\n`;
}
