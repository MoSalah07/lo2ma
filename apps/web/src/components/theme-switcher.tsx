'use client';

import { useTheme } from 'next-themes';
import { segmentedItem, segmentedRoot } from '@/components/ui/segmented';
import { useIsClient } from '@/lib/use-is-client';

export const themeOptions = ['light', 'dark', 'system'] as const;
export type ThemeOption = (typeof themeOptions)[number];

interface ThemeSwitcherProps {
  /** Accessible name of the group, e.g. «المظهر». */
  label: string;
  labels: Record<ThemeOption, string>;
}

export function ThemeSwitcher({ label, labels }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  // The server can't know the saved theme, so no option looks selected until the browser takes over.
  const isClient = useIsClient();

  return (
    <div role="group" aria-label={label} className={segmentedRoot}>
      {themeOptions.map((option) => {
        const active = isClient && theme === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => setTheme(option)}
            className={segmentedItem({ active })}
          >
            {labels[option]}
          </button>
        );
      })}
    </div>
  );
}
