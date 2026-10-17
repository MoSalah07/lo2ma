import type { Workplace } from '@lo2ma/core';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/cn';

/** A workplace in two lines: its name, then its district and the notes for the courier. */
export function WorkplaceSummary({
  workplace,
  id,
  className,
}: {
  workplace: Workplace;
  id?: string;
  className?: string;
}) {
  const locale = useLocale();
  const below = [workplace.area[locale], workplace.details].filter(Boolean).join(' · ');
  return (
    <span id={id} className={cn('flex min-w-0 flex-col text-start', className)}>
      <bdi className="truncate text-body-md font-medium">{workplace.name[locale]}</bdi>
      <span className="truncate text-caption text-muted">{below}</span>
    </span>
  );
}
