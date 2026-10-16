import { useTranslations } from 'next-intl';
import { Eyebrow } from './eyebrow';
import { HeroVisual } from './hero-visual';
import { Section } from './section';
import { StartLink } from './start-link';

export function Hero() {
  const t = useTranslations();

  return (
    <Section className="grid items-center gap-8 pt-stack lg:grid-cols-2 lg:gap-16 lg:pt-section">
      <div className="flex flex-col items-start gap-5">
        <Eyebrow tone="accent">{t('landing.eyebrow')}</Eyebrow>
        <h1 className="text-34 leading-tight font-extrabold text-balance lg:text-44 xl:text-56">
          {t('landing.title')}
        </h1>
        <p className="max-w-130 text-15 leading-loose text-pretty text-ink-2 lg:text-17 xl:text-18">
          {t('landing.subtitle')}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-1">
          <StartLink>{t('onboarding.start')}</StartLink>
          <span className="text-13 text-muted">{t('landing.ctaNote')}</span>
        </div>
      </div>
      <HeroVisual />
    </Section>
  );
}
