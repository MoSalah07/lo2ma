import { formatNumber } from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Section, SectionTitle } from './section';

const steps = ['say', 'pick', 'pay'] as const;

export function HowItWorks() {
  const t = useTranslations('landing.how');
  const locale = useLocale();

  return (
    <Section className="flex flex-col gap-7">
      <SectionTitle>{t('title')}</SectionTitle>
      <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step}>
            <Card className="flex h-full flex-col gap-3 rounded-28 p-6">
              {/* The list already numbers the steps for screen readers. */}
              <span
                aria-hidden
                className="flex size-11 items-center justify-center rounded-16 bg-tint text-18 font-bold text-on-tint"
              >
                {formatNumber(index + 1, locale)}
              </span>
              <h3 className="text-20 leading-heading font-bold">{t(`${step}.title`)}</h3>
              <p className="text-15 leading-loose text-ink-2">{t(`${step}.body`)}</p>
            </Card>
          </li>
        ))}
      </ol>
    </Section>
  );
}
