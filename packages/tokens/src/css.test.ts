import { describe, expect, it } from 'vitest';
import { colors, type ColorName } from './colors.ts';
import { buildTokensCss, colorVar, shadowVar } from './css.ts';
import { sceneColors } from './scene.ts';
import { shadows, type ShadowName } from './shadows.ts';

const css = buildTokensCss();

function blockOf(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  expect(start).toBeGreaterThanOrEqual(0);
  return css.slice(start, css.indexOf('}', start));
}

const colorNames = Object.keys(colors.light) as ColorName[];
const shadowNames = Object.keys(shadows.light) as ShadowName[];

describe('buildTokensCss', () => {
  it.each([
    ['light', ':root'],
    ['dark', '.dark'],
  ] as const)('puts every %s color and shadow on %s', (theme, selector) => {
    const block = blockOf(selector);
    expect(block).toContain(`color-scheme: ${theme};`);
    for (const name of colorNames) {
      expect(block).toContain(`${colorVar(name)}: ${colors[theme][name]};`);
    }
    for (const name of shadowNames) {
      expect(block).toContain(`${shadowVar(name)}: ${shadows[theme][name]};`);
    }
  });

  it('points every Tailwind color and shadow at its runtime variable', () => {
    const theme = blockOf('@theme inline');
    expect(theme).toContain('--color-surface-2: var(--lq-surface-2);');
    expect(theme).toContain('--color-on-primary: var(--lq-on-primary);');
    expect(theme).toContain('--shadow-card: var(--lq-shadow-card);');
  });

  it("turns off Tailwind's default colors, shadows, radii and font sizes", () => {
    const theme = blockOf('@theme inline');
    for (const namespace of ['color', 'shadow', 'radius', 'text']) {
      expect(theme).toContain(`--${namespace}-*: initial;`);
    }
  });

  it('writes font sizes in rem and radii in px', () => {
    expect(css).toContain('--text-15: 0.9375rem;');
    expect(css).toContain('--radius-26: 26px;');
  });

  it("replaces Tailwind's container widths with the layout ones, and adds the layout spacing", () => {
    const theme = blockOf('@theme inline');
    expect(theme).toContain('--container-*: initial;');
    expect(theme).toContain('--container-app: 30rem;');
    expect(theme).toContain('--container-site: 80rem;');
    expect(theme).toContain('--container-form: 27.5rem;');
  });

  it('replaces the default curves with the motion tokens, and sets the default transition from them', () => {
    const theme = buildTokensCss().split('@theme inline')[1] ?? '';
    expect(theme).toContain('--ease-*: initial;');
    expect(theme).toContain('--ease-enter: cubic-bezier(0.05, 0.7, 0.1, 1);');
    expect(theme).toContain('--default-transition-duration: 150ms;');
    expect(theme).toContain('--default-transition-timing-function: cubic-bezier(0.2, 0, 0, 1);');
  });

  it('gives the 3D materials utilities too, so still pictures match the scenes', () => {
    const theme = buildTokensCss().split('@theme inline')[1] ?? '';
    expect(theme).toContain(`--color-scene-highlight: ${sceneColors.highlight};`);
    expect(theme).toContain(`--color-scene-brand: ${sceneColors.brand};`);
    expect(theme).toContain('--spacing-gutter: 1.25rem;');
    expect(theme).toContain('--spacing-stack: 1rem;');
  });

  it('adds the safe area to every distance from the bottom edge', () => {
    expect(css).toContain('--spacing-above-nav: calc(5.75rem + env(safe-area-inset-bottom));');
  });
});
