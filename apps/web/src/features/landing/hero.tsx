import { useTranslations } from 'next-intl';
import { Eyebrow } from './eyebrow';
import { HeroVisual } from './hero-visual';
import { LandingHeader } from './landing-header';
import { Section } from './section';
import { StartLink } from './start-link';

/** The first screen, in the page's theme: the koshari photo with real ingredients floating around it. */
export function Hero() {
  const t = useTranslations();

  return (
    <div className="relative isolate overflow-hidden">
      <LandingHeader />
      <Section className="grid items-center gap-8 pt-stack lg:grid-cols-2 lg:gap-12 lg:pt-section">
        <div className="flex flex-col items-start gap-5">
          <Eyebrow tone="accent">{t('landing.eyebrow')}</Eyebrow>
          <h1 className="text-display-sm text-balance lg:text-display-md xl:text-display-lg">
            {t('landing.title')}
          </h1>
          <p className="max-w-130 text-body-lg leading-loose text-pretty text-ink-2 lg:text-lead">
            {t('landing.subtitle')}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-1">
            <StartLink>{t('onboarding.start')}</StartLink>
            <span className="text-body-sm text-muted">{t('landing.ctaNote')}</span>
          </div>
        </div>
        <HeroVisual />
      </Section>
    </div>
  );
}
