import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { landingColumn } from './section';

export function LandingFooter() {
  const t = useTranslations();

  return (
    <footer
      className={cn(
        landingColumn,
        'flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-stack pb-section',
      )}
    >
      <span className="text-16 font-extrabold">{t('common.brand')}</span>
      <p className="text-13 text-muted">{t('landing.demoNote')}</p>
    </footer>
  );
}
