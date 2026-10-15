// Semantic colors from the «لقمة مودرن» design system. Components use these names (bg-surface, text-ink),
// so switching the theme swaps the values without any dark: classes.
const light = {
  bg: '#F5F5F7',
  surface: '#FFFFFF',
  surface2: '#F2F2F5',
  /** The selected segment of a segmented control. */
  surfaceRaised: '#FFFFFF',
  ink: '#0C0C10',
  ink2: '#3A3A44',
  muted: '#6B6B76',
  /** Borders, outlines and progress tracks. */
  line: '#E4E4EA',
  /** Separators inside cards and disabled fills. */
  divider: '#EEEEF2',
  primary: '#3452FF',
  onPrimary: '#FFFFFF',
  /** Brand-colored text and icons on bg or surface (links, «غيّر»). */
  primaryInk: '#2238C9',
  tint: '#E3E7FF',
  onTint: '#2238C9',
  lilac: '#E9E3FF',
  onLilac: '#4B2FB8',
  pink: '#FFE1F0',
  onPink: '#9B1C5E',
  good: '#DDF2E8',
  onGood: '#14724F',
  warn: '#FFEBD6',
  onWarn: '#8A4B00',
  danger: '#FDE7E5',
  onDanger: '#B42318',
  inverse: '#0C0C10',
  onInverse: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.86)',
  scrim: 'rgba(12, 12, 16, 0.48)',
} as const;

export type ColorName = keyof typeof light;

const dark: Record<ColorName, string> = {
  bg: '#0C0C10',
  surface: '#17171D',
  surface2: '#202028',
  surfaceRaised: '#2A2A33',
  ink: '#F4F4F6',
  ink2: '#C9C9D1',
  muted: '#A0A0AB',
  line: '#2A2A33',
  divider: '#2A2A33',
  primary: '#4A63FF',
  onPrimary: '#FFFFFF',
  primaryInk: '#9DAEFF',
  tint: '#232A55',
  onTint: '#C3CCFF',
  lilac: '#2D2550',
  onLilac: '#D4C7FF',
  pink: '#4A1D36',
  onPink: '#FFB3D9',
  good: '#12372A',
  onGood: '#7FE0B4',
  warn: '#47300F',
  onWarn: '#FFC98A',
  danger: '#4A1A17',
  onDanger: '#FF9C94',
  inverse: '#F4F4F6',
  onInverse: '#0C0C10',
  glass: 'rgba(30, 30, 38, 0.84)',
  scrim: 'rgba(0, 0, 0, 0.62)',
};

export const colors = { light, dark };
