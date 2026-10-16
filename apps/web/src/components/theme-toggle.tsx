'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { IconButton } from '@/components/ui/icon-button';
import { useIsClient } from '@/lib/use-is-client';

interface ThemeToggleProps {
  /** The button names the theme it switches to: «الوضع الغامق» / «الوضع الفاتح». */
  labels: { dark: string; light: string };
  className?: string;
}

/** One button that flips between light and dark, for page headers. */
export function ThemeToggle({ labels, className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  // The server can't know the theme, so the button shows the moon until the browser takes over.
  const dark = useIsClient() && resolvedTheme === 'dark';

  return (
    <IconButton
      label={dark ? labels.light : labels.dark}
      icon={dark ? Sun : Moon}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className={className}
    />
  );
}
