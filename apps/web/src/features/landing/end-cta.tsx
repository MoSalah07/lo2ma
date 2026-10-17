import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import koshariTop from './photos/koshari-top.jpg';
import { alwaysDark, Section, SectionTitle } from './section';
import { StartLink } from './start-link';
import { NearbyImage } from './nearby-image';

/** The last band: the same action as the hero, for visitors who read to the end, over a bowl of koshari. */
export function EndCta() {
  const t = useTranslations();

  return (
    <Section>
      <div
        className={cn(
          alwaysDark,
          'relative isolate flex min-h-100 flex-col items-start justify-end gap-6 overflow-hidden rounded-panel p-7 md:justify-center md:p-12 lg:p-16',
        )}
      >
        <NearbyImage
          src={koshariTop}
          sizes="(min-width: 1280px) 1184px, 100vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-linear-to-t from-bg from-15% to-bg/40"
        />
        <div className="flex max-w-140 flex-col gap-2">
          <SectionTitle>{t('landing.end.title')}</SectionTitle>
          <p className="text-body-lg leading-loose text-ink-2">{t('landing.end.body')}</p>
        </div>
        <StartLink>{t('onboarding.start')}</StartLink>
      </div>
    </Section>
  );
}
