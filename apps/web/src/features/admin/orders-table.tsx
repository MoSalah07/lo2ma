'use client';

import { formatMoney, formatTime, type AdminOrder } from '@lo2ma/core';
import { useLocale, useTranslations } from 'next-intl';
import { bodyCell, headCell, rowClass, tableClass, tableScroll } from './data-table';
import { StatusBadge } from './status-badge';

interface OrdersTableProps {
  orders: AdminOrder[];
  /** Names the table for screen readers (the section's heading id). */
  labelledBy?: string;
  label?: string;
}

/** The orders table on the overview (latest five) and on the orders screen (one page). */
export function OrdersTable({ orders, labelledBy, label }: OrdersTableProps) {
  const t = useTranslations('admin.table');
  const locale = useLocale();

  return (
    <div className={tableScroll}>
      <table aria-labelledby={labelledBy} aria-label={label} className={tableClass}>
        <thead>
          <tr>
            <th scope="col" className={headCell()}>
              {t('order')}
            </th>
            <th scope="col" className={headCell()}>
              {t('customer')}
            </th>
            <th scope="col" className={headCell()}>
              {t('company')}
            </th>
            <th scope="col" className={headCell()}>
              {t('restaurant')}
            </th>
            <th scope="col" className={headCell('end')}>
              {t('total')}
            </th>
            <th scope="col" className={headCell()}>
              {t('break')}
            </th>
            <th scope="col" className={headCell()}>
              {t('status')}
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className={rowClass}>
              <td className={bodyCell()}>
                <bdi dir="ltr" className="font-semibold whitespace-nowrap">
                  {`#${order.id}`}
                </bdi>
              </td>
              <td className={bodyCell()}>
                <bdi className="whitespace-nowrap">{order.customer}</bdi>
              </td>
              <td className={bodyCell()}>
                {order.company ? (
                  <span className="whitespace-nowrap text-ink-2">{order.company.name[locale]}</span>
                ) : (
                  <span className="text-muted">{t('solo')}</span>
                )}
              </td>
              <td className={bodyCell()}>
                <span className="whitespace-nowrap text-ink-2">{order.restaurant[locale]}</span>
              </td>
              <td className={bodyCell('end')}>
                <span className="font-semibold whitespace-nowrap">
                  {formatMoney(order.total, locale)}
                </span>
              </td>
              <td className={bodyCell()}>
                <span className="tabular-nums">{formatTime(order.breakTime)}</span>
              </td>
              <td className={bodyCell()}>
                <StatusBadge status={order.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && (
        <p className="px-3 py-8 text-center text-14 text-muted">{t('empty')}</p>
      )}
    </div>
  );
}
