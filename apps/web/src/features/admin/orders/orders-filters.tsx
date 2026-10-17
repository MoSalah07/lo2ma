'use client';

import type { Company } from '@lo2ma/core';
import { ChevronDown } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useId } from 'react';
import { focusRing } from '@/components/ui/focus';
import { cn } from '@/lib/cn';
import { SearchBox } from '../search-box';

const pill = cn(
  'h-control-md rounded-control bg-surface-2 px-3.5 text-body-sm font-medium text-ink',
  focusRing,
);

interface OrdersFiltersProps {
  search: string;
  onSearch: (value: string) => void;
  companies: Company[];
  company: string | undefined;
  onCompany: (id: string | undefined) => void;
  month: string | undefined;
  onMonth: (month: string | undefined) => void;
}

/** Search, company and month: the first row of the orders filters. */
export function OrdersFilters(props: OrdersFiltersProps) {
  const t = useTranslations('admin.orders');
  const locale = useLocale();
  const companyId = useId();
  const monthId = useId();

  return (
    <div className="flex flex-wrap gap-2.5">
      <SearchBox
        label={t('search')}
        placeholder={t('searchPlaceholder')}
        value={props.search}
        onChange={props.onSearch}
        className="min-w-70 flex-1"
      />
      <div className="relative">
        <label htmlFor={companyId} className="sr-only">
          {t('company')}
        </label>
        <select
          id={companyId}
          value={props.company ?? ''}
          onChange={(event) => props.onCompany(event.target.value || undefined)}
          className={cn(pill, 'appearance-none pe-10')}
        >
          <option value="">{t('allCompanies')}</option>
          {props.companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name[locale]}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-muted"
        />
      </div>
      <label htmlFor={monthId} className="sr-only">
        {t('month')}
      </label>
      <input
        id={monthId}
        type="month"
        value={props.month ?? ''}
        onChange={(event) => props.onMonth(event.target.value || undefined)}
        className={cn(pill, 'tabular-nums')}
      />
    </div>
  );
}
