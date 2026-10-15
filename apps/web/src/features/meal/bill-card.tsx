'use client';

import { budgetUsage, formatMoney, formatNumber, type Suggestion } from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Meter } from '@/components/ui/meter';
import { pounds } from '@/lib/meal';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-13">
      <dt className="text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/** Food, delivery, service and the total, plus how much of the budget it leaves. */
export function BillCard({ bill, budget }: { bill: Suggestion['bill']; budget?: number }) {
  const t = useTranslations('bill');
  const locale = useLocale();
  const usage = budget ? budgetUsage(budget, bill.total) : null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-13 font-semibold text-ink-2">{t('title')}</h2>
      <Card className="flex flex-col gap-2 rounded-22 px-4 py-3.5">
        <dl className="flex flex-col gap-2">
          <Row label={t('food')} value={formatMoney(bill.food, locale)} />
          <Row label={t('delivery')} value={formatMoney(bill.delivery, locale)} />
          <Row label={t('service')} value={formatMoney(bill.service, locale)} />
          <div className="flex justify-between gap-3 border-t border-divider pt-2 text-16 font-extrabold">
            <dt>{t('total')}</dt>
            <dd>{formatMoney(bill.total, locale)}</dd>
          </div>
        </dl>
        {usage && budget && (
          <div className="flex flex-col gap-1.5 pt-1">
            <Meter value={usage.ratio} label={t('title')} />
            <p className="text-12 text-muted">
              {usage.overBudget
                ? t('overBudget', { amount: formatMoney(-usage.remaining, locale) })
                : t('remainingOf', {
                    amount: formatMoney(usage.remaining, locale),
                    budget: formatNumber(pounds(budget), locale),
                  })}
            </p>
          </div>
        )}
      </Card>
    </section>
  );
}
