'use client';

import {
  formatDayMonth,
  formatMoney,
  formatNumber,
  type Coupon,
  type CouponStatus,
} from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Meter } from '@/components/ui/meter';
import { bodyCell, headCell, rowClass, tableClass, tableScroll } from '../data-table';

const statusTones: Record<CouponStatus, BadgeProps['tone']> = {
  active: 'good',
  paused: 'warn',
  ended: 'neutral',
};

export function CouponsTable({ coupons }: { coupons: Coupon[] }) {
  const t = useTranslations('admin.coupons');
  const tFormat = useTranslations('format');
  const locale = useLocale();
  const money = (piasters: number) => formatMoney(piasters, locale);
  const number = (value: number) => formatNumber(value, locale);

  return (
    <div className={tableScroll}>
      <table aria-label={t('title')} className={tableClass}>
        <thead>
          <tr>
            <th scope="col" className={headCell()}>
              {t('code')}
            </th>
            <th scope="col" className={headCell()}>
              {t('discount')}
            </th>
            <th scope="col" className={headCell()}>
              {t('audience')}
            </th>
            <th scope="col" className={headCell()}>
              {t('usage')}
            </th>
            <th scope="col" className={headCell()}>
              {t('ends')}
            </th>
            <th scope="col" className={headCell()}>
              {t('status')}
            </th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((coupon) => {
            const { discount, audience, limit, used } = coupon;
            const usage =
              limit === null
                ? t('usedNoLimit', { used: number(used) })
                : t('usedOf', { used: number(used), limit: number(limit) });
            return (
              <tr key={coupon.code} className={rowClass}>
                <td className={bodyCell()}>
                  <bdi dir="ltr" className="font-mono text-13 font-bold tracking-wide">
                    {coupon.code}
                  </bdi>
                </td>
                <td className={bodyCell()}>
                  <div className="flex flex-col gap-0.5 whitespace-nowrap">
                    <span className="font-semibold">
                      {discount.type === 'percent'
                        ? tFormat('percent', { value: number(discount.value) })
                        : money(discount.value)}
                    </span>
                    <span className="text-12 text-muted">
                      {discount.type === 'percent'
                        ? t('upTo', { amount: money(discount.cap) })
                        : t('fixed')}
                    </span>
                  </div>
                </td>
                <td className={bodyCell()}>
                  <span className="text-ink-2">
                    {audience.type === 'company'
                      ? t('forCompany', { company: audience.company.name[locale] })
                      : audience.type === 'new'
                        ? t('newOnly')
                        : t('everyone')}
                  </span>
                </td>
                <td className={bodyCell()}>
                  <div className="flex w-30 flex-col gap-1.5">
                    <span className="text-12 tabular-nums">{usage}</span>
                    {limit !== null && <Meter value={used / limit} label={usage} />}
                  </div>
                </td>
                <td className={bodyCell()}>
                  <span className="whitespace-nowrap text-ink-2">
                    {formatDayMonth(coupon.endsOn, locale)}
                  </span>
                </td>
                <td className={bodyCell()}>
                  <Badge tone={statusTones[coupon.status]} size="md">
                    {t(`states.${coupon.status}`)}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
