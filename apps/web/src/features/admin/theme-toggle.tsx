'use client';

import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { IconButton } from '@/components/ui/icon-button';
import { useIsClient } from '@/lib/use-is-client';

/** One button that flips between light and dark, for the dashboard header. */
export function ThemeToggle() {
  const t = useTranslations('admin');
  const { resolvedTheme, setTheme } = useTheme();
  // The server can't know the theme, so the button shows the moon until the browser takes over.
  const dark = useIsClient() && resolvedTheme === 'dark';

  return (
    <IconButton
      label={dark ? t('lightMode') : t('darkMode')}
      icon={dark ? Sun : Moon}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className="size-12"
    />
  );
}
