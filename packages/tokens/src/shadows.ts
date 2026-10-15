// In light mode depth comes from soft shadows; in dark mode from 1px inner outlines.
const light = {
  card: '0 1px 2px rgba(12, 12, 16, 0.04), 0 10px 28px -8px rgba(12, 12, 16, 0.08)',
  float: '0 1px 2px rgba(12, 12, 16, 0.05), 0 8px 24px -8px rgba(12, 12, 16, 0.14)',
  glass: 'inset 0 0 0 1px rgba(12, 12, 16, 0.06), 0 10px 30px -10px rgba(12, 12, 16, 0.18)',
  sheet: '0 -12px 40px -12px rgba(12, 12, 16, 0.25)',
  segment: '0 1px 2px rgba(12, 12, 16, 0.08), 0 2px 8px -2px rgba(12, 12, 16, 0.08)',
} as const;

export type ShadowName = keyof typeof light;

const dark: Record<ShadowName, string> = {
  card: 'inset 0 0 0 1px #24242C',
  float: 'inset 0 0 0 1px #2A2A33, 0 8px 24px -8px rgba(0, 0, 0, 0.5)',
  glass: 'inset 0 0 0 1px rgba(255, 255, 255, 0.07), 0 10px 30px -10px rgba(0, 0, 0, 0.6)',
  sheet: 'inset 0 1px 0 #2A2A33',
  segment: 'none',
};

export const shadows = { light, dark };
