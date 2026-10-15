'use client';

import type { Locale } from '@lo2ma/i18n';
import { useLocale } from 'next-intl';
import { segmentedItem, segmentedRoot } from '@/components/ui/segmented';
import { Link, usePathname } from '@/i18n/navigation';

interface LanguageSwitcherProps {
  /** Accessible name of the control, e.g. «اللغة». */
  label: string;
  options: { locale: Locale; label: string }[];
}

/** Links to the same page in each language. Labels come from the server, so no messages ship to the client. */
export function LanguageSwitcher({ label, options }: LanguageSwitcherProps) {
  const current = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={label} className={segmentedRoot}>
      {options.map((option) => {
        const active = option.locale === current;
        return (
          <Link
            key={option.locale}
            href={pathname}
            locale={option.locale}
            lang={option.locale}
            aria-current={active ? 'true' : undefined}
            className={segmentedItem({ active })}
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}
