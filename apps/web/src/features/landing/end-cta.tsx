import { useTranslations } from 'next-intl';
import { Section, SectionTitle } from './section';
import { StartLink } from './start-link';

/** The last band: the same action as the hero, for visitors who read to the end. */
export function EndCta() {
  const t = useTranslations();

  return (
    <Section>
      <div className="flex flex-col items-start gap-6 rounded-32 bg-primary p-7 text-on-primary md:flex-row md:items-center md:justify-between md:p-12 lg:p-16">
        <div className="flex flex-col gap-2">
          <SectionTitle>{t('landing.end.title')}</SectionTitle>
          <p className="text-15 leading-loose">{t('landing.end.body')}</p>
        </div>
        <StartLink onPrimary>{t('onboarding.start')}</StartLink>
      </div>
    </Section>
  );
}
