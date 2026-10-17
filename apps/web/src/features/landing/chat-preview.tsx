import { arrivalTimeFor, formatCalories, formatMoney, formatTime } from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { sampleMeal } from './sample';

/** A made-up exchange that shows what the chat does: the request, the reply and the suggestion card. */
export function ChatPreview() {
  const t = useTranslations();
  const locale = useLocale();
  const arrival = formatTime(arrivalTimeFor(sampleMeal.breakTime));

  return (
    <figure
      aria-label={t('landing.preview.label')}
      className="relative flex w-full max-w-85 flex-col gap-2.5"
    >
      <p className="max-w-4/5 self-end rounded-22 bg-primary px-4 py-3 text-body-md text-on-primary">
        {t('landing.preview.user')}
      </p>
      <p className="max-w-9/10 self-start rounded-22 bg-surface px-4 py-3 text-body-md shadow-card">
        {t('landing.preview.agent')}
      </p>
      <Card className="flex flex-col gap-3 rounded-26 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-title-md">{t('landing.preview.meal')}</span>
            <span className="text-caption text-muted">
              {t('landing.preview.meta', {
                restaurant: t('landing.preview.restaurant'),
                time: arrival,
              })}
            </span>
          </div>
          <span className="text-title-md whitespace-nowrap">
            {formatMoney(sampleMeal.total, locale)}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="accent" className="h-6.5 px-2.5 font-medium">
            {t('landing.preview.calories', {
              calories: formatCalories(sampleMeal.kcal, locale, { approximate: true }),
              source: t('common.aiEstimate'),
            })}
          </Badge>
          <Badge tone="highlight" className="h-6.5 px-2.5 font-medium">
            {t('common.bestValue')}
          </Badge>
        </div>
      </Card>
    </figure>
  );
}
