import { ARRIVAL_BUFFER_MINUTES, formatMoney, SHARED_DELIVERY_FEE } from '@lo2ma/core';
import { Check } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Eyebrow } from './eyebrow';
import { landingValues } from './facts';
import iftarTable from './photos/iftar-table.jpg';
import { Section, SectionTitle } from './section';
import { WeekPreview } from './week-preview';
import { NearbyImage } from './nearby-image';

export function WeekSection() {
  const t = useTranslations();
  const locale = useLocale();
  const points = [
    t('plan.sharedDelivery', { amount: formatMoney(SHARED_DELIVERY_FEE, locale) }),
    t('landing.week.arrives', {
      when: t('common.beforeBreak', { minutes: ARRIVAL_BUFFER_MINUTES }),
    }),
    t('landing.week.onePayment'),
  ];

  return (
    <Section>
      <Card className="grid items-center gap-7 rounded-32 p-5 md:p-10 lg:grid-cols-2 lg:gap-14 lg:p-14">
        <div className="flex flex-col items-start gap-4">
          <Eyebrow tone="highlight">{t('plan.title')}</Eyebrow>
          <SectionTitle>{t('landing.week.title')}</SectionTitle>
          <p className="text-body-lg leading-loose text-pretty text-ink-2">
            {t('landing.week.body', landingValues(locale))}
          </p>
          <ul className="flex flex-col gap-2.5">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-2.5 text-body-md font-medium">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-good text-on-good">
                  <Check aria-hidden className="size-3.5" strokeWidth={3} />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
        {/* A real table of Egyptian food behind the week, which stays plain, readable HTML. */}
        <div className="relative isolate overflow-hidden rounded-28 p-4 md:p-8">
          <NearbyImage
            src={iftarTable}
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
          <WeekPreview />
        </div>
      </Card>
    </Section>
  );
}
