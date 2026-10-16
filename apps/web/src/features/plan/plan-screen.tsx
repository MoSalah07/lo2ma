'use client';

import { formatDateRange } from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Screen, ScreenHeader } from '@/components/screen';
import { ErrorMessage, LoadingBlocks } from '@/components/status-message';
import { SuccessMoment } from '@/components/success-moment';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { usePlan } from './api';
import { CurrentPlan } from './current-plan';
import { PlanBuilder } from './plan-builder';

function PlanHeader({ range }: { range?: string }) {
  const t = useTranslations('plan');
  return (
    <ScreenHeader title={t('title')}>
      {range && (
        <span className="inline-flex h-8.5 items-center rounded-full bg-surface px-3 text-13 font-medium ring-1 ring-line ring-inset">
          {range}
        </span>
      )}
    </ScreenHeader>
  );
}

/** The plan tab: the builder until the week is paid, then the current plan as the days go by. */
export function PlanScreen() {
  const t = useTranslations();
  const locale = useLocale();
  const plan = usePlan();
  const confirmed = plan.data?.confirmed;
  const [celebrating, setCelebrating] = useState(false);
  // The week turning from the builder to confirmed, while the screen is open, is the moment to celebrate.
  // Opening a week that is already confirmed is not.
  const [seenConfirmed, setSeenConfirmed] = useState(confirmed);
  if (confirmed !== seenConfirmed) {
    setSeenConfirmed(confirmed);
    if (seenConfirmed === false && confirmed) setCelebrating(true);
  }

  if (plan.isPending) {
    return (
      <>
        <PlanHeader />
        <Screen>
          <LoadingBlocks count={5} />
        </Screen>
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
        <Screen className="items-center py-10 text-center">
          <p className="text-15 text-ink-2">{t('plan.needsOnboarding')}</p>
          <Link href="/onboarding" className={buttonVariants({ size: 'md' })}>
            {t('onboarding.start')}
          </Link>
        </Screen>
      </>
    );
  }

  const week = plan.data;
  const first = week.days[0]?.date;
  const last = week.days.at(-1)?.date;

  return (
    <>
      <div inert={celebrating} className="contents">
        <PlanHeader range={first && last ? formatDateRange(first, last, locale) : undefined} />
        {week.confirmed ? <CurrentPlan plan={week} /> : <PlanBuilder plan={week} />}
      </div>
      {celebrating && (
        <SuccessMoment
          title={t('success.plan')}
          note={t('success.planNext')}
          onDone={() => setCelebrating(false)}
        />
      )}
    </>
  );
}
