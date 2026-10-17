'use client';

import {
  adminOrderStatuses,
  adminOrderStatusSchema,
  ADMIN_PAGE_SIZE,
  formatMonthName,
  formatNumber,
  type AdminOrder,
  type AdminOrdersQuery,
} from '@lo2ma/core';
import { Download } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { ErrorMessage, LoadingBlocks } from '@/components/status-message';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { setUrlParams, useUrlParam } from '@/lib/use-url-params';
import { fetchOrdersForExport, useAdminOrders, useCompanies } from '../api';
import { OrdersTable } from '../orders-table';
import { PageHeader } from '../page-header';
import { useDebounced } from '@/lib/use-debounced';
import { downloadFile, toCsv } from './orders-csv';
import { OrdersFilters } from './orders-filters';
import { Pagination } from './pagination';

export function OrdersScreen() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const param = useUrlParam();
  const companies = useCompanies();

  // The filters live in the URL; the search box keeps its own text and writes it once typing pauses.
  const [search, setSearch] = useState(param('q') ?? '');
  const q = useDebounced(search.trim());
  const status = adminOrderStatusSchema.safeParse(param('status'));
  const query: AdminOrdersQuery = {
    q: param('q'),
    company: param('company'),
    month: param('month'),
    status: status.success ? status.data : undefined,
    page: Number(param('page')) || undefined,
  };

  useEffect(() => {
    const current = new URLSearchParams(window.location.search).get('q') ?? '';
    if (q !== current) setUrlParams({ q: q || undefined, page: undefined });
  }, [q]);

  const orders = useAdminOrders(query);
  const data = orders.data;
  const [exporting, setExporting] = useState(false);

  const filter = (changes: Record<string, string | undefined>) =>
    setUrlParams({ ...changes, page: undefined });

  function row(order: AdminOrder): string[] {
    return [
      order.id,
      order.customer,
      order.company?.name[locale] ?? t('table.solo'),
      order.restaurant[locale],
      String(order.total / 100),
      order.breakTime,
      t(`status.${order.status}`),
    ];
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const all = await fetchOrdersForExport(query);
      const header = [
        'order',
        'customer',
        'company',
        'restaurant',
        'total',
        'break',
        'status',
      ] as const;
      downloadFile(
        `lo2ma-orders-${data?.month ?? 'all'}.csv`,
        toCsv(
          header.map((key) => t(`table.${key}`)),
          all.map(row),
        ),
      );
    } finally {
      setExporting(false);
    }
  }

  const from = data && data.total > 0 ? (data.page - 1) * ADMIN_PAGE_SIZE + 1 : 0;
  const to = data ? from + data.items.length - (data.items.length > 0 ? 1 : 0) : 0;

  return (
    <>
      <PageHeader
        title={t('orders.title')}
        subtitle={
          data &&
          t('orders.subtitle', {
            orders: t('orderCount', { count: data.counts.all }),
            month: formatMonthName(data.month, locale),
          })
        }
        actions={
          <Button
            variant="outline"
            size="md"
            disabled={!data || data.total === 0 || exporting}
            onClick={() => void exportCsv()}
          >
            <Download aria-hidden className="size-4.5" />
            {t('orders.export')}
          </Button>
        }
      />

      <Card className="flex flex-col gap-3.5 rounded-card p-4">
        <OrdersFilters
          search={search}
          onSearch={setSearch}
          companies={companies.data ?? []}
          company={query.company}
          onCompany={(company) => filter({ company })}
          month={query.month ?? data?.month}
          onMonth={(month) => filter({ month })}
        />
        <div role="group" aria-label={t('orders.statusFilter')} className="flex flex-wrap gap-2">
          {(['all', ...adminOrderStatuses] as const).map((status) => {
            const pressed = (query.status ?? 'all') === status;
            return (
              <Chip
                key={status}
                pressed={pressed}
                onClick={() => filter({ status: status === 'all' ? undefined : status })}
                className="px-3.5 text-label-md"
              >
                {status === 'all' ? t('orders.all') : t(`status.${status}`)}
                {data && (
                  <span className="font-medium tabular-nums opacity-80">
                    {formatNumber(data.counts[status], locale)}
                  </span>
                )}
              </Chip>
            );
          })}
        </div>
      </Card>

      {orders.isError && <ErrorMessage onRetry={() => void orders.refetch()} />}
      {orders.isPending && <LoadingBlocks />}
      {data && (
        <Card
          aria-busy={orders.isPlaceholderData}
          className="rounded-card px-2 pt-2 transition-opacity aria-busy:opacity-60"
        >
          <OrdersTable orders={data.items} label={t('orders.title')} />
          {data.total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-divider p-3">
              <span className="text-body-sm text-muted tabular-nums">
                {t('orders.pageInfo', {
                  from: formatNumber(from, locale),
                  to: formatNumber(to, locale),
                  total: formatNumber(data.total, locale),
                })}
              </span>
              <Pagination
                page={data.page}
                pageCount={data.pageCount}
                onChange={(page) => setUrlParams({ page: String(page) }, 'push')}
              />
            </div>
          )}
        </Card>
      )}
    </>
  );
}
