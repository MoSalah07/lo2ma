'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ErrorMessage, LoadingBlocks } from '@/components/status-message';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCoupons } from '../api';
import { PageHeader } from '../page-header';
import { CouponForm } from './coupon-form';
import { CouponsTable } from './coupons-table';

export function CouponsScreen() {
  const t = useTranslations('admin.coupons');
  const coupons = useCoupons();

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          // Jumps to the form beside the table (below it on narrow screens) and moves focus there.
          <a href="#new-coupon" className={buttonVariants({ size: 'md' })}>
            <Plus aria-hidden className="size-4.5" />
            {t('new')}
          </a>
        }
      />
      <div className="flex flex-col items-start gap-4 xl:flex-row">
        <Card className="w-full min-w-0 flex-1 rounded-card px-2 pt-2 pb-1">
          {coupons.isError && <ErrorMessage onRetry={() => void coupons.refetch()} />}
          {coupons.isPending && <LoadingBlocks />}
          {coupons.data && <CouponsTable coupons={coupons.data} />}
        </Card>
        <div className="w-full shrink-0 xl:w-96">
          <CouponForm />
        </div>
      </div>
    </>
  );
}
