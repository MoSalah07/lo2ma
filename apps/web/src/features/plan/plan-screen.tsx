'use client';

import { formatDateRange } from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { ErrorMessage, LoadingBlocks } from '@/components/status-message';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { usePlan } from './api';
import { CurrentPlan } from './current-plan';
import { PlanBuilder } from './plan-builder';

function PlanHeader({ range }: { range?: string }) {
  const t = useTranslations('plan');
  return (
    <header className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
      <h1 className="text-26 leading-heading font-extrabold">{t('title')}</h1>
      {range && (
        <span className="inline-flex h-8.5 items-center rounded-full bg-surface px-3 text-13 font-medium ring-1 ring-line ring-inset">
          {range}
        </span>
      )}
    </header>
  );
}

/** The plan tab: the builder until the week is paid, then the current plan as the days go by. */
export function PlanScreen() {
  const t = useTranslations();
  const locale = useLocale();
  const plan = usePlan();

  if (plan.isPending) {
    return (
      <>
        <PlanHeader />
        <div className="px-4">
          <LoadingBlocks count={5} />
        </div>
      </>
    );
  }
  if (plan.isError) {
    return (
      <>
        <PlanHeader />
        <ErrorMessage onRetry={() => void plan.refetch()} />
      </>
    );
  }
  if (!plan.data) {
    return (
      <>
        <PlanHeader />
        <div className="flex flex-col items-center gap-4 px-5 py-10 text-center">
          <p className="text-15 text-ink-2">{t('plan.needsOnboarding')}</p>
          <Link href="/onboarding" className={buttonVariants({ size: 'md' })}>
            {t('onboarding.start')}
          </Link>
        </div>
      </>
    );
  }

  const week = plan.data;
  const first = week.days[0]?.date;
  const last = week.days.at(-1)?.date;

  return (
    <>
      <PlanHeader range={first && last ? formatDateRange(first, last, locale) : undefined} />
      {week.confirmed ? <CurrentPlan plan={week} /> : <PlanBuilder plan={week} />}
    </>
  );
}
