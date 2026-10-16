import { formatNumber } from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { Sequence, SequenceItem } from '@/components/motion/entrance';
import { cn } from '@/lib/cn';
import koshariSauces from './photos/koshari-sauces.jpg';
import koshariSpoon from './photos/koshari-spoon.jpg';
import taameya from './photos/taameya.jpg';
import { alwaysDark, Section, SectionTitle } from './section';
import { NearbyImage } from './nearby-image';

const steps = [
  { key: 'say', photo: koshariSpoon },
  { key: 'pick', photo: koshariSauces },
  { key: 'pay', photo: taameya },
] as const;

export function HowItWorks() {
  const t = useTranslations('landing.how');
  const locale = useLocale();

  return (
    <Section className="flex flex-col gap-7">
      <SectionTitle>{t('title')}</SectionTitle>
      <Sequence as="ol" trigger="scroll" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {steps.map(({ key, photo }, index) => (
          <li key={key}>
            <SequenceItem
              className={cn(
                alwaysDark,
                'relative isolate flex h-full min-h-100 flex-col justify-end gap-3 overflow-hidden rounded-28 p-6',
              )}
            >
              <NearbyImage
                src={photo}
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 -z-10 bg-linear-to-b from-bg/0 from-25% to-bg/95 to-75%"
              />
              {/* The list already numbers the steps for screen readers. */}
              <span
                aria-hidden
                className="flex size-11 items-center justify-center rounded-full bg-primary text-18 font-bold text-on-primary"
              >
                {formatNumber(index + 1, locale)}
              </span>
              <h3 className="text-22 leading-heading font-bold">{t(`${key}.title`)}</h3>
              <p className="text-15 leading-loose text-ink-2">{t(`${key}.body`)}</p>
            </SequenceItem>
          </li>
        ))}
      </Sequence>
    </Section>
  );
}
